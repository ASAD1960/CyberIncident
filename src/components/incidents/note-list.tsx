import { NOTE_KIND_LABELS } from '@/lib/constants';
import { formatDateTime } from '@/lib/utils';
import type { InvestigationNote } from '@/types';

export function NoteList({ notes }: { notes: InvestigationNote[] }) {
  if (notes.length === 0) return <p className="text-sm text-muted">Nothing has been added yet.</p>;
  return (
    <ul className="space-y-3">
      {notes.map((n) => (
        <li key={n.id} className="rounded-md border border-line p-3">
          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="rounded bg-paper px-1.5 py-0.5 font-semibold text-ink">{NOTE_KIND_LABELS[n.kind]}</span>
            {n.visibility === 'internal' && <span className="font-semibold">Internal only</span>}
            <span>
              {n.author?.full_name ?? 'Unknown'} · <time dateTime={n.created_at}>{formatDateTime(n.created_at)}</time>
            </span>
          </div>
          {/* Rendered as text by React (escaped); whitespace preserved for readability. */}
          <p className="whitespace-pre-wrap break-words text-sm">{n.content}</p>
        </li>
      ))}
    </ul>
  );
}
