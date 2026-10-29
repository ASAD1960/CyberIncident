import type { Metadata } from 'next';
import Link from 'next/link';
import { Alert } from '@/components/ui/alert';
import { Button, buttonClass } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { requireRole } from '@/lib/auth/session';
import { AUDIT_ACTIONS } from '@/lib/constants';
import { listAuditLogs } from '@/lib/services/audit-query';
import { auditFilterSchema } from '@/lib/validation/admin';
import { cn, firstParam, formatDateTime, titleCase } from '@/lib/utils';

export const metadata: Metadata = { title: 'Audit log' };

const OUTCOME_LABEL = { success: 'Success', failure: 'Failed', denied: 'Denied' } as const;

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole('admin');
  const sp = await searchParams;
  const parsed = auditFilterSchema.safeParse(Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, firstParam(v)])));
  const filters = parsed.success ? parsed.data : auditFilterSchema.parse({});
  const result = await listAuditLogs(filters);

  return (
    <>
      <PageHeader title="Audit log" description="A read-only record of security-relevant activity. Entries cannot be edited or deleted from the application." />
      {!parsed.success && <Alert tone="warning" className="mb-4">Some filters were not valid and were ignored.</Alert>}

      <form method="get" className="panel mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5" aria-label="Audit filters">
        <div>
          <label htmlFor="a-action" className="label">Action</label>
          <select id="a-action" name="action" defaultValue={filters.action ?? ''} className="input">
            <option value="">All actions</option>
            {AUDIT_ACTIONS.map((a) => <option key={a} value={a}>{titleCase(a)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="a-outcome" className="label">Outcome</label>
          <select id="a-outcome" name="outcome" defaultValue={filters.outcome ?? ''} className="input">
            <option value="">Any outcome</option>
            <option value="success">Success</option>
            <option value="failure">Failed</option>
            <option value="denied">Denied</option>
          </select>
        </div>
        <div><label htmlFor="a-from" className="label">From</label><input id="a-from" type="date" name="from" defaultValue={filters.from} className="input" /></div>
        <div><label htmlFor="a-to" className="label">To</label><input id="a-to" type="date" name="to" defaultValue={filters.to} className="input" /></div>
        <div className="flex items-end gap-2">
          <Button type="submit">Apply</Button>
          <Link href="/admin/audit" className={buttonClass('secondary')}>Clear</Link>
        </div>
      </form>

      <section className="panel" aria-label="Audit entries">
        {result.items.length === 0 ? (
          <EmptyState title="No entries match">Try a wider date range.</EmptyState>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[48rem] text-left text-sm">
                <caption className="sr-only">Audit log</caption>
                <thead className="border-b border-line text-xs text-muted">
                  <tr>
                    {['When', 'Who', 'Action', 'Record', 'Outcome', 'Details'].map((h) => <th key={h} scope="col" className="px-4 py-2 font-semibold">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line align-top">
                  {result.items.map((e) => (
                    <tr key={e.id}>
                      <td className="whitespace-nowrap px-4 py-2 text-muted">{formatDateTime(e.created_at)}</td>
                      <td className="px-4 py-2">{e.actor?.full_name ?? <span className="text-muted">{e.actor_id ? 'Unknown user' : 'Not signed in'}</span>}</td>
                      <td className="whitespace-nowrap px-4 py-2 font-semibold">{titleCase(e.action)}</td>
                      <td className="px-4 py-2 text-xs text-muted">{e.entity_type}{e.entity_id ? ` · ${e.entity_id.slice(0, 8)}` : ''}</td>
                      <td className="px-4 py-2">
                        <span className={cn('rounded border px-2 py-0.5 text-xs font-semibold', e.outcome === 'success' ? 'border-ok/40 bg-ok-soft text-ok' : 'border-danger/40 bg-danger-soft text-danger')}>
                          {OUTCOME_LABEL[e.outcome]}
                        </span>
                      </td>
                      <td className="max-w-xs px-4 py-2 font-mono text-[11px] text-muted">
                        <span className="line-clamp-2 break-all">{Object.keys(e.metadata ?? {}).length ? JSON.stringify(e.metadata) : '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line">
              <Pagination
                page={result.page} pageCount={result.pageCount} total={result.total} pageSize={result.pageSize}
                basePath="/admin/audit" params={{ action: filters.action, outcome: filters.outcome, from: filters.from, to: filters.to }}
              />
            </div>
          </>
        )}
      </section>
    </>
  );
}
