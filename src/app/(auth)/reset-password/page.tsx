import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ResetPasswordForm } from '@/components/forms/auth-forms';
import { getCurrentUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Choose a new password' };

export default async function ResetPasswordPage() {
  // Only reachable through the emailed recovery link, which creates a short-lived session.
  const user = await getCurrentUser();
  if (!user) redirect('/login?error=link');
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Choose a new password</h1>
      <p className="mb-6 mt-1 text-sm text-muted">You’ll be signed in once it’s saved.</p>
      <ResetPasswordForm />
    </>
  );
}
