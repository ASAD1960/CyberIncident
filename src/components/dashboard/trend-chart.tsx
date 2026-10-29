import { formatDate } from '@/lib/utils';

/** Daily incident counts as an SVG column chart with a text alternative. */
export function TrendChart({ days, from, to }: { days: { date: string; count: number }[]; from: string; to: string }) {
  const map = new Map(days.map((d) => [d.date, d.count]));
  const series: { date: string; count: number }[] = [];
  for (let t = Date.parse(`${from}T00:00:00Z`); t <= Date.parse(`${to}T00:00:00Z`) && series.length < 366; t += 86_400_000) {
    const date = new Date(t).toISOString().slice(0, 10);
    series.push({ date, count: map.get(date) ?? 0 });
  }
  const total = series.reduce((n, d) => n + d.count, 0);
  if (series.length === 0 || total === 0) return <p className="text-sm text-muted">No incidents were reported in this period.</p>;

  const max = Math.max(...series.map((d) => d.count));
  const peak = series.reduce((a, b) => (b.count > a.count ? b : a));
  const w = 600;
  const h = 140;
  const gap = 2;
  const bw = Math.max(2, (w - gap * (series.length - 1)) / series.length);

  return (
    <figure>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-36 w-full"
        role="img"
        aria-label={`${total} incidents reported between ${formatDate(from)} and ${formatDate(to)}. Busiest day: ${formatDate(peak.date)} with ${peak.count}.`}
        preserveAspectRatio="none"
      >
        <line x1="0" y1={h - 0.5} x2={w} y2={h - 0.5} stroke="var(--line)" />
        {series.map((d, i) => {
          const bh = d.count === 0 ? 0 : Math.max(3, (d.count / max) * (h - 8));
          return (
            <rect key={d.date} x={i * (bw + gap)} y={h - bh} width={bw} height={bh} fill="var(--brand)" rx="1">
              <title>{`${formatDate(d.date)}: ${d.count}`}</title>
            </rect>
          );
        })}
      </svg>
      <figcaption className="mt-1 flex justify-between text-xs text-muted">
        <span>{formatDate(from)}</span>
        <span>Peak: {peak.count} on {formatDate(peak.date)}</span>
        <span>{formatDate(to)}</span>
      </figcaption>
    </figure>
  );
}
