'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPublicEnv } from '@/lib/env';
import { fieldErrorsFrom, type ActionState } from '@/lib/action-state';
import { safeRedirectPath } from '@/lib/utils';
import { forgotPasswordSchema, loginSchema, resetPasswordSchema } from '@/lib/validation/auth';
import { getClientIp, rateLimit, tooManyRequests } from '@/lib/security/rate-limit';
import { fingerprint, writeAudit } from '@/lib/services/audit';
import { getCurrentUser } from '@/lib/auth/session';

const GENERIC_LOGIN_ERROR = 'Email or password is incorrect.';

export async function signInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '');
  const parsed = loginSchema.safeParse({
    email,
    password: formData.get('password'),
    next: formData.get('next') ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error), values: { email } };
  }

  const ip = await getClientIp();
  const perAccount = rateLimit(`login:${ip}:${parsed.data.email}`, 5, 15 * 60_000);
  const perIp = rateLimit(`login-ip:${ip}`, 30, 15 * 60_000);
  if (!perAccount.allowed || !perIp.allowed) {
    await writeAudit({
      action: 'auth.login_failed',
      entityType: 'auth',
      outcome: 'denied',
      metadata: { reason: 'rate_limited', account: fingerprint(parsed.data.email) },
    });
    return { ok: false, message: tooManyRequests(perAccount.allowed ? perIp : perAccount), values: { email } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user) {
    await writeAudit({
      action: 'auth.login_failed',
      entityType: 'auth',
      outcome: 'failure',
      metadata: { reason: 'invalid_credentials', account: fingerprint(parsed.data.email) },
    });
    return { ok: false, message: GENERIC_LOGIN_ERROR, values: { email } };
  }

  const { data: profileRows } = await supabase.rpc('get_my_profile');
  const profile = profileRows?.[0];
  if (!profile || profile.id !== data.user.id || profile.account_status !== 'active') {
    await supabase.auth.signOut();
    await writeAudit({
      actorId: data.user.id,
      action: 'auth.login_failed',
      entityType: 'auth',
      outcome: 'denied',
      metadata: { reason: 'account_inactive' },
    });
    return { ok: false, message: 'This account is inactive. Contact an administrator.', values: { email } };
  }

  await writeAudit({ actorId: data.user.id, action: 'auth.login', entityType: 'auth', entityId: data.user.id });
  redirect(safeRedirectPath(parsed.data.next));
}

export async function signOutAction(): Promise<void> {
  const user = await getCurrentUser();
  const supabase = await createClient();
  await supabase.auth.signOut();
  if (user) await writeAudit({ actorId: user.id, action: 'auth.logout', entityType: 'auth', entityId: user.id });
  redirect('/login');
}

/** Always answers the same way so the form cannot be used to discover which emails have accounts. */
export async function requestPasswordResetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  const ip = await getClientIp();
  const limit = rateLimit(`reset:${ip}`, 5, 60 * 60_000);
  if (!limit.allowed) return { ok: false, message: tooManyRequests(limit) };

  const supabase = await createClient();
  const site = getPublicEnv().NEXT_PUBLIC_SITE_URL;
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${site}/auth/callback?next=/reset-password`,
  });
  await writeAudit({
    action: 'auth.password_reset_requested',
    entityType: 'auth',
    metadata: { account: fingerprint(parsed.data.email) },
  });
  return { ok: true, message: 'If an account exists for that address, a reset link is on its way.' };
}

export async function updatePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Your reset link has expired. Request a new one.' };

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, message: 'The password could not be updated. Request a new reset link and try again.' };
  redirect('/dashboard');
}
