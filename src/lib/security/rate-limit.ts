import 'server-only';
import { headers } from 'next/headers';

/**
 * Fixed-window, in-memory rate limiter (NFR-05).
 *
 * Good enough for a single Node process and for demonstrating the control. On serverless
 * or multi-instance deployments swap the Map for a shared store (Upstash Redis, etc.)
 * behind the same `rateLimit()` signature.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) prune(now);
    return { allowed: true, retryAfterSeconds: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

function prune(now: number) {
  for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

export const tooManyRequests = (r: RateLimitResult) =>
  `Too many attempts. Try again in ${Math.max(1, Math.ceil(r.retryAfterSeconds / 60))} minute(s).`;
