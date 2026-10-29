import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { sha256Hex } from '@/lib/security/hash';

export interface AuditInput {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  outcome?: 'success' | 'failure' | 'denied';
  metadata?: Record<string, unknown>;
}

const SECRET_KEY = /pass(word)?|token|secret|authorization|cookie|api[-_]?key|jwt/i;

/** Drops anything that looks like a credential before it can reach the log (FR-38, NFR-06). */
function scrub(value: unknown, depth = 0): unknown {
  if (depth > 3) return '[truncated]';
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => scrub(v, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, SECRET_KEY.test(k) ? '[redacted]' : scrub(v, depth + 1)]),
    );
  }
  if (typeof value === 'string' && value.length > 300) return `${value.slice(0, 300)}…`;
  return value;
}

/**
 * Appends an audit entry using the service role (clients have no INSERT rights on audit_logs).
 * Logging must never break the user's request, so failures are reported to the server log only.
 * Database-side events (incident create/status/assign/severity, evidence, roles, settings) are
 * written by triggers/RPCs; this helper covers app-level events such as login and downloads.
 */
export async function writeAudit(input: AuditInput): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('audit_logs').insert({
      actor_id: input.actorId ?? null,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      outcome: input.outcome ?? 'success',
      metadata: scrub(input.metadata ?? {}),
    });
    if (error) console.error('[audit] insert failed:', error.message);
  } catch (e) {
    console.error('[audit] unexpected failure:', e instanceof Error ? e.message : e);
  }
}

/** Short, non-reversible fingerprint so repeated failed logins can be correlated without storing the email. */
export const fingerprint = (value: string) => sha256Hex(value.toLowerCase()).slice(0, 12);
