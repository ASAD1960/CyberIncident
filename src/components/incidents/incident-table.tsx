import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { SeverityBadge, StatusBadge } from './badges';
import type { IncidentWithPeople } from '@/types';

export function IncidentTable({
  incidents,
  categoryLabels,
  showReporter,
}: {
  incidents: IncidentWithPeople[];
  categoryLabels: Map<string, string>;
  showReporter: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[44rem] text-left text-sm">
        <caption className="sr-only">Incidents</caption>
        <thead className="border-b border-line text-xs text-muted">
          <tr>
            <th scope="col" className="px-4 py-2 font-semibold">Reference</th>
            <th scope="col" className="px-4 py-2 font-semibold">Incident</th>
            <th scope="col" className="px-4 py-2 font-semibold">Severity</th>
            <th scope="col" className="px-4 py-2 font-semibold">Status</th>
            <th scope="col" className="px-4 py-2 font-semibold">Investigator</th>
            {showReporter && <th scope="col" className="px-4 py-2 font-semibold">Reporter</th>}
            <th scope="col" className="px-4 py-2 font-semibold">Reported</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {incidents.map((i) => (
            <tr key={i.id} className="hover:bg-paper/60">
              <td className="whitespace-nowrap px-4 py-3 font-semibold">
                <Link href={`/incidents/${i.id}`} className="text-brand hover:underline">{i.ref}</Link>
              </td>
              <td className="max-w-xs px-4 py-3">
                <Link href={`/incidents/${i.id}`} className="line-clamp-1 font-semibold hover:underline">{i.title}</Link>
                <span className="text-xs text-muted">{categoryLabels.get(i.category) ?? i.category}</span>
              </td>
              <td className="px-4 py-3"><SeverityBadge severity={i.severity} /></td>
              <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
              <td className="px-4 py-3">{i.assignee?.full_name ?? <span className="text-muted">Unassigned</span>}</td>
              {showReporter && <td className="px-4 py-3">{i.reporter?.full_name ?? '—'}</td>}
              <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(i.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
