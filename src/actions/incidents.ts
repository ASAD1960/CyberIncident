'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { echoValues, fieldErrorsFrom, type ActionState } from '@/lib/action-state';
import { MAX_FILES_PER_UPLOAD } from '@/lib/constants';
import { rateLimit, tooManyRequests } from '@/lib/security/rate-limit';
import {
  assignSchema,
  createIncidentSchema,
  noteSchema,
  severitySchema,
  transitionSchema,
} from '@/lib/validation/incident';
import { toActionError } from '@/lib/services/errors';
import { getCategories } from '@/lib/services/settings';
import {
  addNote,
  assignIncident,
  createIncident,
  transitionIncident,
  updateSeverity,
} from '@/lib/services/incidents';
import { uploadEvidence } from '@/lib/services/evidence';
import type { IncidentStatus, NoteKind, Severity } from '@/types';

const textOf = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === 'string' ? v : undefined;
};

export async function createIncidentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const values = echoValues(formData, ['idempotencyKey']);

  const limit = rateLimit(`incident:create:${user.id}`, 10, 60 * 60_000);
  if (!limit.allowed) return { ok: false, message: tooManyRequests(limit), values };

  const parsed = createIncidentSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    severity: formData.get('severity'),
    affectedAsset: formData.get('affectedAsset'),
    occurredAt: formData.get('occurredAt'),
    idempotencyKey: formData.get('idempotencyKey'),
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error), values };

  const categories = await getCategories();
  if (!categories.some((c) => c.key === parsed.data.category)) {
    return { ok: false, fieldErrors: { category: ['Choose a category from the list.'] }, values };
  }

  const files = formData.getAll('evidence').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_FILES_PER_UPLOAD) {
    return { ok: false, fieldErrors: { evidence: [`Attach ${MAX_FILES_PER_UPLOAD} files or fewer.`] }, values };
  }

  let incidentId: string;
  let failed = 0;
  try {
    const { incident } = await createIncident(user, parsed.data);
    incidentId = incident.id;
    for (const file of files) {
      try {
        await uploadEvidence(user, incident.id, file);
      } catch (e) {
        failed += 1;
        console.error('[incident:create] evidence failed:', e instanceof Error ? e.message : e);
      }
    }
  } catch (e) {
    return toActionError(e, { values });
  }

  redirect(`/incidents/${incidentId}?submitted=1${failed ? `&evidenceFailed=${failed}` : ''}`);
}

export async function transitionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = transitionSchema.safeParse({
    incidentId: formData.get('incidentId'),
    toStatus: formData.get('toStatus'),
    summary: formData.get('summary'),
    reason: formData.get('reason'),
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error), values: echoValues(formData) };

  try {
    await transitionIncident(user, {
      incidentId: parsed.data.incidentId,
      toStatus: parsed.data.toStatus as IncidentStatus,
      summary: parsed.data.summary,
      reason: parsed.data.reason,
    });
  } catch (e) {
    return toActionError(e, { values: echoValues(formData) });
  }
  revalidatePath(`/incidents/${parsed.data.incidentId}`);
  revalidatePath('/incidents');
  revalidatePath('/dashboard');
  return { ok: true, message: 'Status updated.' };
}

export async function assignAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = assignSchema.safeParse({
    incidentId: formData.get('incidentId'),
    assigneeId: formData.get('assigneeId'),
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  try {
    await assignIncident(user, parsed.data.incidentId, parsed.data.assigneeId);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath(`/incidents/${parsed.data.incidentId}`);
  revalidatePath('/incidents');
  return { ok: true, message: 'Investigator assigned.' };
}

export async function severityAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = severitySchema.safeParse({
    incidentId: formData.get('incidentId'),
    severity: formData.get('severity'),
    reason: formData.get('reason'),
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  try {
    await updateSeverity(user, {
      incidentId: parsed.data.incidentId,
      severity: parsed.data.severity as Severity,
      reason: parsed.data.reason,
    });
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath(`/incidents/${parsed.data.incidentId}`);
  revalidatePath('/incidents');
  revalidatePath('/dashboard');
  return { ok: true, message: 'Severity updated.' };
}

export async function addNoteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = noteSchema.safeParse({
    incidentId: formData.get('incidentId'),
    kind: textOf(formData, 'kind') ?? 'note',
    content: formData.get('content'),
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error), values: echoValues(formData) };

  const limit = rateLimit(`note:${user.id}`, 60, 60 * 60_000);
  if (!limit.allowed) return { ok: false, message: tooManyRequests(limit), values: echoValues(formData) };

  try {
    await addNote(user, {
      incidentId: parsed.data.incidentId,
      kind: parsed.data.kind as NoteKind,
      content: parsed.data.content,
    });
  } catch (e) {
    return toActionError(e, { values: echoValues(formData) });
  }
  revalidatePath(`/incidents/${parsed.data.incidentId}`);
  return { ok: true, message: 'Saved.' };
}
