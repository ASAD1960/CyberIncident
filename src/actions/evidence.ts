'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { fieldErrorsFrom, type ActionState } from '@/lib/action-state';
import { MAX_FILES_PER_UPLOAD } from '@/lib/constants';
import { rateLimit, tooManyRequests } from '@/lib/security/rate-limit';
import { evidenceUploadSchema } from '@/lib/validation/incident';
import { ServiceError, toActionError } from '@/lib/services/errors';
import { deleteEvidence, uploadEvidence } from '@/lib/services/evidence';
import { z } from 'zod';

export async function uploadEvidenceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = evidenceUploadSchema.safeParse({ incidentId: formData.get('incidentId') });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  const files = formData.getAll('evidence').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { ok: false, fieldErrors: { evidence: ['Choose at least one file.'] } };
  if (files.length > MAX_FILES_PER_UPLOAD) {
    return { ok: false, fieldErrors: { evidence: [`Upload ${MAX_FILES_PER_UPLOAD} files or fewer at a time.`] } };
  }

  const limit = rateLimit(`evidence:upload:${user.id}`, 30, 60 * 60_000);
  if (!limit.allowed) return { ok: false, message: tooManyRequests(limit) };

  const problems: string[] = [];
  let saved = 0;
  for (const file of files) {
    try {
      await uploadEvidence(user, parsed.data.incidentId, file);
      saved += 1;
    } catch (e) {
      problems.push(e instanceof ServiceError ? e.message : `"${file.name}" could not be saved.`);
      if (!(e instanceof ServiceError)) console.error('[evidence:upload]', e);
    }
  }

  revalidatePath(`/incidents/${parsed.data.incidentId}`);
  if (problems.length === 0) return { ok: true, message: `${saved} file${saved === 1 ? '' : 's'} uploaded.` };
  const prefix = saved ? `${saved} uploaded. ` : '';
  return { ok: false, message: `${prefix}${problems.join(' ')}` };
}

export async function deleteEvidenceAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = z.object({ evidenceId: z.string().uuid(), incidentId: z.string().uuid() }).safeParse({
    evidenceId: formData.get('evidenceId'),
    incidentId: formData.get('incidentId'),
  });
  if (!parsed.success) return;
  try {
    await deleteEvidence(user, parsed.data.evidenceId);
  } catch (e) {
    toActionError(e); // logged; the page re-renders with the unchanged list
  }
  revalidatePath(`/incidents/${parsed.data.incidentId}`);
}
