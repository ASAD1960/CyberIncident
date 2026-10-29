import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { AuditFilters } from '@/lib/validation/admin';
import type { AuditEntry, Paginated, PersonRef } from '@/types';
import { fromSupabaseError } from './errors';

const AUDIT_PAGE_SIZE = 25;

/** Read access is limited to administrators by RLS; the page also gates on role. */
export async function listAuditLogs(filters: AuditFilters): Promise<Paginated<AuditEntry>> {
  const supabase = await createClient();
  const from = (filters.page - 1) * AUDIT_PAGE_SIZE;
  // audit_logs.actor_id intentionally has no FK (the table is append-only), so actors are joined below.
  let query = supabase.from('audit_logs').select('*', { count: 'exact' });
  if (filters.action) query = query.eq('action', filters.action);
  if (filters.outcome) query = query.eq('outcome', filters.outcome);
  if (filters.from) query = query.gte('created_at', `${filters.from}T00:00:00Z`);
  if (filters.to) query = query.lte('created_at', `${filters.to}T23:59:59.999Z`);

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, from + AUDIT_PAGE_SIZE - 1);
  if (error) throw fromSupabaseError(error);
  const rows = (data ?? []) as Omit<AuditEntry, 'actor'>[];
  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter((id): id is string => Boolean(id)))];
  const actors = new Map<string, PersonRef>();
  if (actorIds.length) {
    const { data: people } = await supabase.from('profiles').select('id, full_name').in('id', actorIds);
    for (const p of (people ?? []) as PersonRef[]) actors.set(p.id, p);
  }

  const total = count ?? 0;
  return {
    items: rows.map((r) => ({ ...r, actor: r.actor_id ? (actors.get(r.actor_id) ?? null) : null })),
    total,
    page: filters.page,
    pageSize: AUDIT_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE)),
  };
}
