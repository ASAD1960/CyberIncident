import { NOTE_KIND_LABELS, SEVERITY_LABELS, STATUS_LABELS } from '@/lib/constants';
import { formatDateTime } from '@/lib/utils';
import type { HistoryEvent, IncidentStatus, NoteKind, Severity } from '@/types';

function describe(e: HistoryEvent, people: Map<string, string>): string {
  const status = (v: string | null) => (v ? STATUS_LABELS[v as IncidentStatus] ?? v : '—');
  switch (e.action_type) {
    case 'created':
      return 'Reported the incident';
    case 'status_changed': {
      const reason = typeof e.metadata?.reason === 'string' ? ` — ${e.metadata.reason}` : '';
      return `Changed status from ${status(e.previous_value)} to ${status(e.new_value)}${reason}`;
    }
    case 'assignee_changed':
      return `Assigned ${e.new_value ? (people.get(e.new_value) ?? 'an investigator') : 'an investigator'}`;
    case 'severity_changed': {
      const s = (v: string | null) => (v ? SEVERITY_LABELS[v as Severity] ?? v : '—');
      return `Changed severity from ${s(e.previous_value)} to ${s(e.new_value)}`;
    }
    case 'note_added': {
      const kind = String(e.metadata?.kind ?? 'note') as NoteKind;
      return `Added: ${NOTE_KIND_LABELS[kind] ?? 'note'}`;
    }
    case 'evidence_added':
      return `Attached a file${e.new_value ? ` (${e.new_value})` : ''}`;
    default:
      return e.action_type.replace(/_/g, ' ');
  }
}

export function Timeline({ events, people }: { events: HistoryEvent[]; people: Map<string, string> }) {
  if (events.length === 0) return <p className="text-sm text-muted">No activity recorded yet.</p>;
  return (
    <ol className="relative space-y-4 border-l-2 border-line pl-5">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-brand bg-surface" aria-hidden />
          <p className="text-sm font-semibold">{describe(e, people)}</p>
          <p className="text-xs text-muted">
            {e.actor?.full_name ?? 'System'} · <time dateTime={e.created_at}>{formatDateTime(e.created_at)}</time>
          </p>
        </li>
      ))}
    </ol>
  );
}
