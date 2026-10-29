import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { LoginForm } from '@/components/forms/auth-forms';
import { getCurrentUser } from '@/lib/auth/session';
import { firstParam, safeRedirectPath } from '@/lib/utils';

export const metadata: Metadata = { title: 'Sign in' };

const NOTICES: Record<string, string> = {
  inactive: 'This account is inactive. Contact an administrator.',
  link: 'That link has expired or was already used. Request a new one.',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (user && user.profile.account_status === 'active') redirect('/dashboard');

  const error = firstParam(sp.error);
  const next = safeRedirectPath(firstParam(sp.next), '');

  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Sign in</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Use the account your organization gave you.</p>
      {error && NOTICES[error] && <Alert tone="error" className="mb-4">{NOTICES[error]}</Alert>}
      <LoginForm next={next || undefined} />
    </>
  );
}
