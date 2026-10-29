import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/forms/auth-forms';

export const metadata: Metadata = { title: 'Reset your password' };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Reset your password</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Enter your email and we’ll send a link to choose a new password.</p>
      <ForgotPasswordForm />
    </>
  );
}
