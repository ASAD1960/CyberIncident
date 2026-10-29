import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { rateLimit } from '@/lib/security/rate-limit';
import { ServiceError } from '@/lib/services/errors';
import { createDownloadUrl } from '@/lib/services/evidence';

export const dynamic = 'force-dynamic';

/**
 * GET /api/evidence/:id/download
 * Authorizes via RLS, writes an audit entry, then redirects to a 60-second signed URL that
 * forces an attachment download. There is no permanent public URL for any evidence file (NFR-07).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || user.profile.account_status !== 'active') {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Evidence not found' }, { status: 404 });
  }
  if (!rateLimit(`evidence:download:${user.id}`, 60, 60_000).allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const url = await createDownloadUrl(user, id);
    const response = NextResponse.redirect(url, 302);
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (e) {
    if (e instanceof ServiceError && e.code === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Evidence not found' }, { status: 404 });
    }
    console.error('[download]', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'The file could not be retrieved' }, { status: 500 });
  }
}
