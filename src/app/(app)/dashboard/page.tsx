import type { Metadata } from 'next';
import Link from 'next/link';
import { Alert } from '@/components/ui/alert';
import { ButtonLink, Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { BarList } from '@/components/dashboard/bar-list';
import { StatStrip } from '@/components/dashboard/stat-strip';
import { TrendChart } from '@/components/dashboard/trend-chart';
import { SeverityBadge, StatusBadge } from '@/components/incidents/badges';
import { requireUser } from '@/lib/auth/session';
import { SEVERITIES, SEVERITY_LABELS, STATUSES, STATUS_LABELS } from '@/lib/constants';
import { getAttentionQueue, getDashboardStats } from '@/lib/services/dashboard';
import { getCategories } from '@/lib/services/settings';
import { dateInput } from '@/lib/validation/common';
import { firstParam } from '@/lib/utils';

export const metadata: Metadata = { title: 'Dashboard' };

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;

  const today = new Date();
  const defaultFrom = isoDay(new Date(today.getTime() - 29 * 86_400_000));
  const from = dateInput.safeParse(firstParam(sp.from)).data ?? defaultFrom;
  const to = dateInput.safeParse(firstParam(sp.to)).data ?? isoDay(today);

  const [stats, queue, categories] = await Promise.all([
    getDashboardStats({ from, to }),
    getAttentionQueue(),
    getCategories({ includeInactive: true }),
  ]);
  const categoryLabels = new Map(categories.map((c) => [c.key, c.label]));
  const isReporter = user.profile.role === 'reporter';

  return (
    <>
      <PageHeader
        title={`Hello, ${user.profile.full_name.split(' ')[0]}`}
        description={isReporter ? 'Here is where your reports stand.' : 'Here is what needs the team’s attention.'}
        actions={<ButtonLink href="/incidents/new">Report an incident</ButtonLink>}
      />

      {firstParam(sp.error) === 'forbidden' && (
        <Alert tone="warning" className="mb-4">Your role does not have access to that page.</Alert>
      )}

      <StatStrip
        stats={[
          { label: 'Open', value: stats.open, hint: 'Not yet resolved' },
          { label: 'Critical and open', value: stats.critical, tone: 'danger' },
          { label: 'In investigation', value: stats.underInvestigation },
          { label: 'Resolved or closed', value: stats.resolved },
        ]}
      />
      {stats.truncated && (
        <Alert tone="warning" className="mt-3">Showing the most recent 5,000 incidents in this range. Narrow the dates for exact totals.</Alert>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="panel" aria-labelledby="queue-h">
          <div className="border-b border-line px-4 py-3">
            <h2 id="queue-h" className="panel-title">{isReporter ? 'Your open reports' : 'Needs attention'}</h2>
            <p className="text-xs text-muted">Open incidents, most severe first.</p>
          </div>
          {queue.length === 0 ? (
            <EmptyState title="Nothing open" action={<ButtonLink href="/incidents/new" variant="secondary">Report an incident</ButtonLink>}>
              When something is reported, it will show up here.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {queue.map((i) => (
                <li key={i.id}>
                  <Link href={`/incidents/${i.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-paper/60">
                    <span className="w-28 shrink-0 text-sm font-semibold text-brand">{i.ref}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{i.title}</span>
                    <SeverityBadge severity={i.severity} />
                    <StatusBadge status={i.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel p-4" aria-labelledby="sev-h">
          <h2 id="sev-h" className="panel-title mb-3">By severity</h2>
          <BarList items={SEVERITIES.slice().reverse().map((s) => ({ label: SEVERITY_LABELS[s], value: stats.bySeverity[s] }))} />
        </section>
      </div>

      <section className="panel mt-6 p-4" aria-labelledby="trend-h">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 id="trend-h" className="panel-title">Incidents reported per day</h2>
          <form method="get" className="flex flex-wrap items-end gap-2" aria-label="Date range">
            <div>
              <label htmlFor="d-from" className="mb-1 block text-xs font-semibold">From</label>
              <input id="d-from" type="date" name="from" defaultValue={from} className="input py-1" />
            </div>
            <div>
              <label htmlFor="d-to" className="mb-1 block text-xs font-semibold">To</label>
              <input id="d-to" type="date" name="to" defaultValue={to} className="input py-1" />
            </div>
            <Button type="submit" variant="secondary" className="py-1.5">Apply</Button>
          </form>
        </div>
        <TrendChart days={stats.perDay} from={from} to={to} />
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="panel p-4" aria-labelledby="cat-h">
          <h2 id="cat-h" className="panel-title mb-3">By category</h2>
          <BarList items={stats.byCategory.map((c) => ({ label: categoryLabels.get(c.key) ?? c.key, value: c.count }))} />
        </section>
        <section className="panel p-4" aria-labelledby="status-h">
          <h2 id="status-h" className="panel-title mb-3">By status</h2>
          <BarList items={STATUSES.map((s) => ({ label: STATUS_LABELS[s], value: stats.byStatus[s] }))} />
        </section>
      </div>
    </>
  );
}
