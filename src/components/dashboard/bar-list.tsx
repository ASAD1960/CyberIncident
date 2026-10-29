/** Horizontal bar chart built from a plain list, so screen readers get label + value for every row. */
export function BarList({
  items,
  emptyText = 'No data for this period.',
}: {
  items: { label: string; value: number }[];
  emptyText?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.every((i) => i.value === 0)) return <p className="text-sm text-muted">{emptyText}</p>;
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.label} className="grid grid-cols-[8.5rem_1fr_2.5rem] items-center gap-3 text-sm">
          <span className="truncate">{i.label}</span>
          <span className="h-3 overflow-hidden rounded-sm bg-paper" aria-hidden>
            <span className="block h-full rounded-sm bg-brand" style={{ width: `${(i.value / max) * 100}%` }} />
          </span>
          <span className="text-right font-semibold tabular-nums">{i.value}</span>
        </li>
      ))}
    </ul>
  );
}
