import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { reportFilterSchema } from '@/lib/validation/report';
import { getReportRows, toCsv } from '@/lib/services/reports';
import { getCategories } from '@/lib/services/settings';
import { writeAudit } from '@/lib/services/audit';
import { rateLimit } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

/** GET /api/reports/export?from=&to=&category=&severity=&status= -> CSV limited to what the user can see. */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.profile.account_status !== 'active') {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (!rateLimit(`report:export:${user.id}`, 20, 60 * 60_000).allowed) {
    return NextResponse.json({ error: 'Too many exports. Try again later.' }, { status: 429 });
  }

  const parsed = reportFilterSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid filters' }, { status: 400 });

  try {
    const [{ rows, truncated }, categories] = await Promise.all([getReportRows(parsed.data), getCategories({ includeInactive: true })]);
    const csv = toCsv(rows, new Map(categories.map((c) => [c.key, c.label])));
    await writeAudit({
      actorId: user.id,
      action: 'report.exported',
      entityType: 'report',
      metadata: { rows: rows.length, truncated, filters: parsed.data },
    });
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="incident-report-${new Date().toISOString().slice(0, 10)}.csv"`,
        'Cache-Control': 'no-store',
        ...(truncated ? { 'X-Report-Truncated': 'true' } : {}),
      },
    });
  } catch (e) {
    console.error('[export]', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'The report could not be generated' }, { status: 500 });
  }
}
