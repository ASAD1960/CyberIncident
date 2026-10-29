import type { Metadata } from 'next';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button, buttonClass } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { BarList } from '@/components/dashboard/bar-list';
import { SeverityBadge, StatusBadge } from '@/components/incidents/badges';
import { requireUser } from '@/lib/auth/session';
import { SEVERITIES, SEVERITY_LABELS, STATUSES, STATUS_LABELS } from '@/lib/constants';
import { getReportRows } from '@/lib/services/reports';
import { getCategories } from '@/lib/services/settings';
import { reportFilterSchema } from '@/lib/validation/report';
import { firstParam, formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Reports' };
const PREVIEW_ROWS = 50;

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const raw = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, firstParam(v)]));
  const parsed = reportFilterSchema.safeParse(raw);
  const filters = parsed.success ? parsed.data : {};

  const [{ rows, truncated }, categories] = await Promise.all([getReportRows(filters), getCategories({ includeInactive: true })]);
  const categoryLabels = new Map(categories.map((c) => [c.key, c.label]));

  const exportParams = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) exportParams.set(k, String(v));
  const exportHref = `/api/reports/export${exportParams.size ? `?${exportParams}` : ''}`;

  const bySeverity = SEVERITIES.slice().reverse().map((s) => ({ label: SEVERITY_LABELS[s], value: rows.filter((r) => r.severity === s).length }));
  const byStatus = STATUSES.map((s) => ({ label: STATUS_LABELS[s], value: rows.filter((r) => r.status === s).length }));

  return (
    <>
      <PageHeader
        title="Reports"
        description={user.profile.role === 'reporter' ? 'A summary of your own reports.' : 'Summarize incidents by date, category, severity, or status, then export them.'}
        actions={
          <a href={exportHref} className={buttonClass('secondary')}>
            <Download className="h-4 w-4" aria-hidden /> Export CSV
          </a>
        }
      />
      {!parsed.success && <Alert tone="warning" className="mb-4">Some filters were not valid and were ignored.</Alert>}

      <form method="get" className="panel mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5" aria-label="Report filters">
        <div><label htmlFor="r-from" className="label">From</label><input id="r-from" type="date" name="from" defaultValue={filters.from} className="input" /></div>
        <div><label htmlFor="r-to" className="label">To</label><input id="r-to" type="date" name="to" defaultValue={filters.to} className="input" /></div>
        <div>
          <label htmlFor="r-cat" className="label">Category</label>
          <select id="r-cat" name="category" defaultValue={filters.category ?? ''} className="input">
            <option value="">All</option>
            {categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="r-sev" className="label">Severity</label>
          <select id="r-sev" name="severity" defaultValue={filters.severity ?? ''} className="input">
            <option value="">All</option>
            {SEVERITIES.map((s) => <option key={s} value={s}>{SEVERITY_LABELS[s]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="r-status" className="label">Status</label>
          <select id="r-status" name="status" defaultValue={filters.status ?? ''} className="input">
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-5">
          <Button type="submit">Apply filters</Button>
          <Link href="/reports" className={buttonClass('secondary')}>Clear</Link>
        </div>
      </form>

      {truncated && <Alert tone="warning" className="mb-4">Results are limited to the most recent 5,000 incidents. Narrow the dates to see everything.</Alert>}

      <p className="mb-3 text-sm"><strong className="tabular-nums">{rows.length}</strong> incident{rows.length === 1 ? '' : 's'} match.</p>

      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <section className="panel p-4" aria-labelledby="rs-h"><h2 id="rs-h" className="panel-title mb-3">By severity</h2><BarList items={bySeverity} /></section>
        <section className="panel p-4" aria-labelledby="rt-h"><h2 id="rt-h" className="panel-title mb-3">By status</h2><BarList items={byStatus} /></section>
      </div>

      <section className="panel" aria-label="Report preview">
        {rows.length === 0 ? (
          <EmptyState title="No incidents match these filters">Try a wider date range or fewer filters.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <caption className="sr-only">Incident report preview</caption>
              <thead className="border-b border-line text-xs text-muted">
                <tr>
                  {['Reference', 'Title', 'Category', 'Severity', 'Status', 'Reported'].map((h) => (
                    <th key={h} scope="col" className="px-4 py-2 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.slice(0, PREVIEW_ROWS).map((r) => (
                  <tr key={r.ref}>
                    <td className="whitespace-nowrap px-4 py-2 font-semibold">{r.ref}</td>
                    <td className="max-w-xs truncate px-4 py-2">{r.title}</td>
                    <td className="px-4 py-2">{categoryLabels.get(r.category) ?? r.category}</td>
                    <td className="px-4 py-2"><SeverityBadge severity={r.severity} /></td>
                    <td className="px-4 py-2"><StatusBadge status={r.status} /></td>
                    <td className="whitespace-nowrap px-4 py-2 text-muted">{formatDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > PREVIEW_ROWS && (
              <p className="border-t border-line px-4 py-3 text-xs text-muted">Showing the first {PREVIEW_ROWS} rows. Export the CSV for the full list.</p>
            )}
          </div>
        )}
      </section>
    </>
  );
}
