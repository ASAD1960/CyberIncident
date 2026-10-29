'use client';

import Link from 'next/link';
import { requestPasswordResetAction, signInAction, updatePasswordAction } from '@/actions/auth';
import { ActionForm } from './action-form';
import { TextField } from './fields';
import { SubmitButton } from '@/components/ui/submit-button';

export function LoginForm({ next }: { next?: string }) {
  return (
    <ActionForm action={signInAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <TextField name="email" label="Email" type="email" autoComplete="email" required />
      <TextField name="password" label="Password" type="password" autoComplete="current-password" required />
      <SubmitButton pendingLabel="Signing in…" className="w-full">Sign in</SubmitButton>
      <p className="text-center text-sm">
        <Link href="/forgot-password" className="font-semibold text-brand hover:underline">Forgot your password?</Link>
      </p>
    </ActionForm>
  );
}

export function ForgotPasswordForm() {
  return (
    <ActionForm action={requestPasswordResetAction} className="space-y-4">
      <TextField name="email" label="Email" type="email" autoComplete="email" required />
      <SubmitButton pendingLabel="Sending link…" className="w-full">Send reset link</SubmitButton>
      <p className="text-center text-sm">
        <Link href="/login" className="font-semibold text-brand hover:underline">Back to sign in</Link>
      </p>
    </ActionForm>
  );
}

export function ResetPasswordForm() {
  return (
    <ActionForm action={updatePasswordAction} className="space-y-4">
      <TextField
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        hint="At least 12 characters with upper-case, lower-case, and a number."
        required
      />
      <TextField name="confirm" label="Confirm new password" type="password" autoComplete="new-password" required />
      <SubmitButton pendingLabel="Saving…" className="w-full">Set new password</SubmitButton>
    </ActionForm>
  );
}
