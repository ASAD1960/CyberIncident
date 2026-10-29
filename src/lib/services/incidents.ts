import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { PAGE_SIZE } from '@/lib/constants';
import { canTriage } from '@/lib/auth/permissions';
import { validateTransition } from '@/lib/workflow/status';
import type { SessionUser } from '@/lib/auth/session';
import type { CreateIncidentInput, IncidentFilters } from '@/lib/validation/incident';
import { ServiceError, fromSupabaseError } from './errors';
import { notify, getAnalystIds } from './notifications';
import { writeAudit } from './audit';
import type {
  HistoryEvent,
  Incident,
  IncidentStatus,
  IncidentWithPeople,
  InvestigationNote,
  NoteKind,
  Paginated,
  PersonRef,
  Severity,
} from '@/types';

const INCIDENT_SELECT = `
  *,
  reporter:profiles!incidents_reporter_id_fkey(id, full_name),
  assignee:profiles!incidents_assignee_id_fkey(id, full_name)
`;

/** Strip characters that carry meaning inside PostgREST filter strings and LIKE patterns. */
export function sanitizeSearchTerm(q: string): string {
  return q.replace(/[%_*,()\\"'`:]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
}

export async function listIncidents(filters: IncidentFilters): Promise<Paginated<IncidentWithPeople>> {
  const supabase = await createClient();
  const page = filters.page;
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase.from('incidents').select(INCIDENT_SELECT, { count: 'exact' });

  if (filters.q) {
    const term = sanitizeSearchTerm(filters.q);
    if (term) query = query.or(`title.ilike.%${term}%,ref.ilike.%${term}%,affected_asset.ilike.%${term}%`);
  }
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.severity) query = query.eq('severity', filters.severity);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.assignee === 'unassigned') query = query.is('assignee_id', null);
  else if (filters.assignee) query = query.eq('assignee_id', filters.assignee);
  if (filters.from) query = query.gte('created_at', `${filters.from}T00:00:00Z`);
  if (filters.to) query = query.lte('created_at', `${filters.to}T23:59:59.999Z`);

  query = query
    .order(filters.sort, { ascending: filters.dir === 'asc' })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const { data, count, error } = await query;
  if (error) throw fromSupabaseError(error);

  const total = count ?? 0;
  return {
    items: (data ?? []) as IncidentWithPeople[],
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

/** Returns null when the incident does not exist OR RLS hides it (indistinguishable by design). */
export async function getIncident(id: string): Promise<IncidentWithPeople | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('incidents').select(INCIDENT_SELECT).eq('id', id).maybeSingle();
  if (error) {
    if (error.code === '22P02') return null; // malformed uuid
    throw fromSupabaseError(error);
  }
  return (data as IncidentWithPeople | null) ?? null;
}

/**
 * Creates an incident. The (reporter_id, idempotency_key) unique constraint makes retries safe:
 * a repeated submit returns the original record instead of creating a duplicate (NFR-21).
 */
export async function createIncident(
  user: SessionUser,
  input: CreateIncidentInput,
): Promise<{ incident: Incident; duplicate: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('incidents')
    .insert({
      title: input.title,
      description: input.description,
      category: input.category,
      severity: input.severity,
      affected_asset: input.affectedAsset ?? null,
      occurred_at: input.occurredAt ? `${input.occurredAt}:00Z` : null,
      reporter_id: user.id,
      idempotency_key: input.idempotencyKey,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('incidents')
        .select('*')
        .eq('reporter_id', user.id)
        .eq('idempotency_key', input.idempotencyKey)
        .maybeSingle();
      if (existing) return { incident: existing as Incident, duplicate: true };
    }
    if (error.code === '23503') throw new ServiceError('VALIDATION', 'Choose a valid category.');
    throw fromSupabaseError(error);
  }

  const incident = data as Incident;
  const analysts = await getAnalystIds();
  await notify({
    userIds: analysts,
    type: 'incident_submitted',
    incidentId: incident.id,
    incidentRef: incident.ref,
    excludeUserId: user.id,
  });
  return { incident, duplicate: false };
}

export async function transitionIncident(
  user: SessionUser,
  params: { incidentId: string; toStatus: IncidentStatus; summary?: string; reason?: string },
): Promise<Incident> {
  const incident = await getIncident(params.incidentId);
  if (!incident) throw new ServiceError('NOT_FOUND', 'Incident not found.');

  const problem = validateTransition({
    from: incident.status,
    to: params.toStatus,
    role: user.profile.role,
    hasAssignee: Boolean(incident.assignee_id),
    existingSummary: incident.resolution_summary,
    summary: params.summary,
    reason: params.reason,
  });
  if (problem) {
    await writeAudit({
      actorId: user.id,
      action: 'access.denied',
      entityType: 'incident',
      entityId: incident.id,
      outcome: 'denied',
      metadata: { operation: 'status_change', from: incident.status, to: params.toStatus },
    });
    throw new ServiceError('INVALID_TRANSITION', problem);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('transition_incident', {
    p_incident_id: params.incidentId,
    p_to_status: params.toStatus,
    p_summary: params.summary ?? null,
    p_reason: params.reason ?? null,
  });
  if (error) {
    const err = fromSupabaseError(error);
    if (err.code === 'NOT_AUTHORIZED' || err.code === 'INVALID_TRANSITION') {
      await writeAudit({
        actorId: user.id,
        action: 'access.denied',
        entityType: 'incident',
        entityId: incident.id,
        outcome: 'denied',
        metadata: { operation: 'status_change', to: params.toStatus },
      });
    }
    throw err;
  }

  const updated = data as Incident;
  await notify({
    userIds: [updated.reporter_id, ...(updated.assignee_id ? [updated.assignee_id] : [])],
    type: 'status_changed',
    incidentId: updated.id,
    incidentRef: updated.ref,
    excludeUserId: user.id,
  });
  return updated;
}

export async function assignIncident(user: SessionUser, incidentId: string, assigneeId: string): Promise<Incident> {
  if (!canTriage(user.profile.role)) throw new ServiceError('NOT_AUTHORIZED', 'Only analysts can assign incidents.');
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('assign_incident', {
    p_incident_id: incidentId,
    p_assignee_id: assigneeId,
  });
  if (error) throw fromSupabaseError(error);

  const updated = data as Incident;
  await notify({
    userIds: [assigneeId],
    type: 'incident_assigned',
    incidentId: updated.id,
    incidentRef: updated.ref,
    excludeUserId: user.id,
  });
  await notify({
    userIds: [updated.reporter_id],
    type: 'status_changed',
    incidentId: updated.id,
    incidentRef: updated.ref,
    excludeUserId: user.id,
  });
  return updated;
}

export async function updateSeverity(
  user: SessionUser,
  params: { incidentId: string; severity: Severity; reason?: string },
): Promise<Incident> {
  if (!canTriage(user.profile.role)) throw new ServiceError('NOT_AUTHORIZED', 'Only analysts can change severity.');
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('update_incident_severity', {
    p_incident_id: params.incidentId,
    p_severity: params.severity,
    p_reason: params.reason ?? null,
  });
  if (error) throw fromSupabaseError(error);
  return data as Incident;
}

export async function listAssignableAnalysts(): Promise<PersonRef[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'analyst')
    .eq('account_status', 'active')
    .order('full_name');
  if (error) throw fromSupabaseError(error);
  return (data ?? []) as PersonRef[];
}

// --- Notes -----------------------------------------------------------------------

export async function listNotes(incidentId: string): Promise<InvestigationNote[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('investigation_notes')
    .select('*, author:profiles!investigation_notes_author_id_fkey(id, full_name)')
    .eq('incident_id', incidentId)
    .order('created_at', { ascending: true });
  if (error) throw fromSupabaseError(error);
  return (data ?? []) as InvestigationNote[];
}

export async function addNote(
  user: SessionUser,
  params: { incidentId: string; kind: NoteKind; content: string },
): Promise<void> {
  const isReporterReply = params.kind === 'reporter_reply';
  if (!isReporterReply && user.profile.role !== 'analyst') {
    throw new ServiceError('NOT_AUTHORIZED', 'Only analysts can add investigation notes.');
  }
  if (isReporterReply && user.profile.role !== 'reporter') {
    throw new ServiceError('NOT_AUTHORIZED', 'Only the reporter can reply here.');
  }

  const incident = await getIncident(params.incidentId);
  if (!incident) throw new ServiceError('NOT_FOUND', 'Incident not found.');
  if (isReporterReply && incident.reporter_id !== user.id) {
    throw new ServiceError('NOT_AUTHORIZED', 'You cannot reply on this incident.');
  }
  if (incident.status === 'closed') throw new ServiceError('INVALID_TRANSITION', 'Closed incidents cannot be changed. Reopen it first.');

  const visibility = params.kind === 'info_request' || isReporterReply ? 'reporter' : 'internal';
  const supabase = await createClient();
  const { error } = await supabase.from('investigation_notes').insert({
    incident_id: params.incidentId,
    author_id: user.id,
    kind: params.kind,
    visibility,
    content: params.content,
  });
  if (error) throw fromSupabaseError(error);

  if (params.kind === 'info_request') {
    await notify({
      userIds: [incident.reporter_id],
      type: 'info_requested',
      incidentId: incident.id,
      incidentRef: incident.ref,
      excludeUserId: user.id,
    });
  } else if (isReporterReply) {
    await notify({
      userIds: incident.assignee_id ? [incident.assignee_id] : await getAnalystIds(),
      type: 'reporter_replied',
      incidentId: incident.id,
      incidentRef: incident.ref,
      excludeUserId: user.id,
    });
  }
}

// --- Timeline --------------------------------------------------------------------

export async function listHistory(incidentId: string): Promise<HistoryEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('incident_history')
    .select('*, actor:profiles!incident_history_actor_id_fkey(id, full_name)')
    .eq('incident_id', incidentId)
    .order('created_at', { ascending: true });
  if (error) throw fromSupabaseError(error);
  return (data ?? []) as HistoryEvent[];
}
