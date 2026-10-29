import { cn } from '@/lib/utils';

export interface Stat {
  label: string;
  value: number;
  tone?: 'default' | 'danger';
  hint?: string;
}

/** Compact, single-row summary. Numbers carry their own text label, so nothing relies on colour. */
export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <dl className="panel grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
      {stats.map((s) => (
        <div key={s.label} className="border-b border-line p-4 last:border-b-0 sm:border-b-0">
          <dt className="text-sm font-semibold text-muted">{s.label}</dt>
          <dd className={cn('mt-1 font-display text-3xl font-semibold tabular-nums', s.tone === 'danger' && s.value > 0 && 'text-danger')}>
            {s.value}
          </dd>
          {s.hint && <p className="mt-0.5 text-xs text-muted">{s.hint}</p>}
        </div>
      ))}
    </dl>
  );
}
