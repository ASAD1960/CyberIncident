import type { ActionState } from '@/lib/action-state';

export type ServiceErrorCode =
  | 'VALIDATION'
  | 'NOT_AUTHORIZED'
  | 'NOT_FOUND'
  | 'INVALID_TRANSITION'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL';

/** Errors safe to show to the user. Anything else is logged and replaced by a generic message (NFR-18). */
export class ServiceError extends Error {
  constructor(
    public readonly code: ServiceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

const RPC_CODE_MAP: Record<string, ServiceErrorCode> = {
  NOT_AUTHORIZED: 'NOT_AUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_TRANSITION: 'INVALID_TRANSITION',
  ASSIGNEE_REQUIRED: 'VALIDATION',
  SUMMARY_REQUIRED: 'VALIDATION',
  REASON_REQUIRED: 'VALIDATION',
  INVALID_ASSIGNEE: 'VALIDATION',
  INVALID_OPERATION: 'VALIDATION',
};

/** Converts a PostgREST / Postgres error into a ServiceError without leaking internals. */
export function fromSupabaseError(error: { message: string; code?: string }): ServiceError {
  const match = /^([A-Z_]+):\s*(.+)$/s.exec(error.message);
  if (match && RPC_CODE_MAP[match[1]]) {
    return new ServiceError(RPC_CODE_MAP[match[1]], match[2].trim());
  }
  if (error.code === '42501') {
    return new ServiceError('NOT_AUTHORIZED', 'You do not have permission to do that.');
  }
  if (error.code === '23505') return new ServiceError('CONFLICT', 'That record already exists.');
  if (error.code === '23503') return new ServiceError('VALIDATION', 'A referenced record does not exist.');
  console.error('[supabase]', error.code, error.message);
  return new ServiceError('INTERNAL', 'Something went wrong. Please try again.');
}

/** Maps any thrown value to an ActionState suitable for the UI. */
export function toActionError(error: unknown, extra: Partial<ActionState> = {}): ActionState {
  if (error instanceof ServiceError) return { ok: false, message: error.message, ...extra };
  console.error('[action]', error instanceof Error ? error.message : error);
  return { ok: false, message: 'Something went wrong. Please try again.', ...extra };
}
