import type { ZodError } from 'zod';

/** Shape returned by every Server Action used with `useActionState`. */
export interface ActionState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  /** Echo of submitted text values so a failed submit does not wipe the form. */
  values?: Record<string, string>;
}

export const initialActionState: ActionState = { ok: false };

export function fieldErrorsFrom(error: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_form');
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/** Copy plain-text entries out of FormData (files and secrets are never echoed). */
export function echoValues(formData: FormData, exclude: string[] = []): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string' && !exclude.includes(key) && !/password/i.test(key) && !key.startsWith('$')) {
      out[key] = value;
    }
  }
  return out;
}
