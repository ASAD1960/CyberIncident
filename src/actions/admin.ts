'use server';

import { revalidatePath } from 'next/cache';
import { requireRole, requireUser } from '@/lib/auth/session';
import { echoValues, fieldErrorsFrom, type ActionState } from '@/lib/action-state';
import { categoryToggleSchema, profileSchema, settingsSchema, updateUserSchema } from '@/lib/validation/admin';
import { toActionError } from '@/lib/services/errors';
import { setCategoryActive, updateSettings } from '@/lib/services/settings';
import { updateOwnProfile, updateUserAccess } from '@/lib/services/users';
import type { UserRole } from '@/types';

export async function updateUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole('admin');
  const parsed = updateUserSchema.safeParse({
    userId: formData.get('userId'),
    role: formData.get('role'),
    status: formData.get('status'),
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  try {
    await updateUserAccess(parsed.data.userId, parsed.data.role as UserRole, parsed.data.status);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath('/admin/users');
  return { ok: true, message: 'Saved.' };
}

export async function updateSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole('admin');
  const parsed = settingsSchema.safeParse({
    adminEvidenceAccess: formData.get('adminEvidenceAccess'),
    maxFileSizeMb: formData.get('maxFileSizeMb'),
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error), values: echoValues(formData) };

  try {
    await updateSettings(user.id, parsed.data);
  } catch (e) {
    return toActionError(e, { values: echoValues(formData) });
  }
  revalidatePath('/admin/settings');
  return { ok: true, message: 'Settings saved.' };
}

export async function toggleCategoryAction(formData: FormData): Promise<void> {
  await requireRole('admin');
  const parsed = categoryToggleSchema.safeParse({ key: formData.get('key'), active: formData.get('active') });
  if (!parsed.success) return;
  try {
    await setCategoryActive(parsed.data.key, parsed.data.active);
  } catch (e) {
    toActionError(e);
  }
  revalidatePath('/admin/settings');
}

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    fullName: formData.get('fullName'),
    notifyStatusUpdates: formData.get('notifyStatusUpdates'),
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error), values: echoValues(formData) };

  try {
    await updateOwnProfile(user.id, parsed.data.fullName, parsed.data.notifyStatusUpdates);
  } catch (e) {
    return toActionError(e, { values: echoValues(formData) });
  }
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Profile saved.' };
}
