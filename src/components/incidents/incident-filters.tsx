import Link from 'next/link';
import { SEVERITIES, SEVERITY_LABELS, STATUSES, STATUS_LABELS } from '@/lib/constants';
import { Button, buttonClass } from '@/components/ui/button';
import type { IncidentFilters } from '@/lib/validation/incident';
import type { Category, PersonRef } from '@/types';

/** Plain GET form: filters live in the URL so results are shareable and work without client JS. */
export function IncidentFiltersForm({
  filters,
  categories,
  analysts,
  showAssignee,
}: {
  filters: IncidentFilters;
  categories: Category[];
  analysts: PersonRef[];
  showAssignee: boolean;
}) {
  return (
    <form method="get" className="panel mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Filter incidents">
      <div className="sm:col-span-2">
        <label htmlFor="f-q" className="label">Search</label>
        <input id="f-q" name="q" defaultValue={filters.q} className="input" placeholder="Reference, title, or affected system" maxLength={100} />
      </div>
      <div>
        <label htmlFor="f-category" className="label">Category</label>
        <select id="f-category" name="category" defaultValue={filters.category ?? ''} className="input">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="f-severity" className="label">Severity</label>
        <select id="f-severity" name="severity" defaultValue={filters.severity ?? ''} className="input">
          <option value="">Any severity</option>
          {SEVERITIES.map((s) => <option key={s} value={s}>{SEVERITY_LABELS[s]}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="f-status" className="label">Status</label>
        <select id="f-status" name="status" defaultValue={filters.status ?? ''} className="input">
          <option value="">Any status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>
      {showAssignee && (
        <div>
          <label htmlFor="f-assignee" className="label">Investigator</label>
          <select id="f-assignee" name="assignee" defaultValue={filters.assignee ?? ''} className="input">
            <option value="">Anyone</option>
            <option value="unassigned">Unassigned</option>
            {analysts.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
          </select>
        </div>
      )}
      <div>
        <label htmlFor="f-from" className="label">Reported from</label>
        <input id="f-from" type="date" name="from" defaultValue={filters.from} className="input" />
      </div>
      <div>
        <label htmlFor="f-to" className="label">Reported to</label>
        <input id="f-to" type="date" name="to" defaultValue={filters.to} className="input" />
      </div>
      <div>
        <label htmlFor="f-sort" className="label">Sort by</label>
        <select id="f-sort" name="sort" defaultValue={filters.sort} className="input">
          <option value="created_at">Date reported</option>
          <option value="updated_at">Last updated</option>
          <option value="severity">Severity</option>
          <option value="status">Status</option>
        </select>
      </div>
      <div>
        <label htmlFor="f-dir" className="label">Order</label>
        <select id="f-dir" name="dir" defaultValue={filters.dir} className="input">
          <option value="desc">Newest or highest first</option>
          <option value="asc">Oldest or lowest first</option>
        </select>
      </div>
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
        <Button type="submit">Apply filters</Button>
        <Link href="/incidents" className={buttonClass('secondary')}>Clear</Link>
      </div>
    </form>
  );
}
