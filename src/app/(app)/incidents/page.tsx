import type { Metadata } from 'next';
import { Alert } from '@/components/ui/alert';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { IncidentFiltersForm } from '@/components/incidents/incident-filters';
import { IncidentTable } from '@/components/incidents/incident-table';
import { isStaff } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { incidentFilterSchema } from '@/lib/validation/incident';
import { listAssignableAnalysts, listIncidents } from '@/lib/services/incidents';
import { getCategories } from '@/lib/services/settings';
import { firstParam } from '@/lib/utils';

export const metadata: Metadata = { title: 'Incidents' };

export default async function IncidentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const raw = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, firstParam(v)]));
  const parsed = incidentFilterSchema.safeParse(raw);
  const filters = parsed.success ? parsed.data : incidentFilterSchema.parse({});

  const staff = isStaff(user.profile.role);
  const [result, categories, analysts] = await Promise.all([
    listIncidents(filters),
    getCategories({ includeInactive: true }),
    staff ? listAssignableAnalysts() : Promise.resolve([]),
  ]);
  const categoryLabels = new Map(categories.map((c) => [c.key, c.label]));
  const hasFilters = Object.entries(raw).some(([k, v]) => v && !['page', 'sort', 'dir'].includes(k));

  const pageParams: Record<string, string | undefined> = {
    q: filters.q, category: filters.category, severity: filters.severity, status: filters.status,
    assignee: filters.assignee, from: filters.from, to: filters.to, sort: filters.sort, dir: filters.dir,
  };

  return (
    <>
      <PageHeader
        title={staff ? 'Incidents' : 'My incidents'}
        description={staff ? 'Search, filter, and open any incident you have access to.' : 'Everything you have reported, and where it stands.'}
        actions={<ButtonLink href="/incidents/new">Report an incident</ButtonLink>}
      />
      {!parsed.success && <Alert tone="warning" className="mb-4">Some filters were not valid and were ignored.</Alert>}
      <IncidentFiltersForm filters={filters} categories={categories.filter((c) => c.is_active)} analysts={analysts} showAssignee={staff} />

      <section className="panel" aria-label="Results">
        {result.items.length === 0 ? (
          <EmptyState
            title={hasFilters ? 'No incidents match these filters' : 'No incidents yet'}
            action={!hasFilters ? <ButtonLink href="/incidents/new">Report an incident</ButtonLink> : undefined}
          >
            {hasFilters ? 'Try removing a filter or widening the date range.' : 'Reports you submit will appear here.'}
          </EmptyState>
        ) : (
          <>
            <IncidentTable incidents={result.items} categoryLabels={categoryLabels} showReporter={staff} />
            <div className="border-t border-line">
              <Pagination page={result.page} pageCount={result.pageCount} total={result.total} pageSize={result.pageSize} basePath="/incidents" params={pageParams} />
            </div>
          </>
        )}
      </section>
    </>
  );
}
