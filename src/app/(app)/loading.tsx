export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-line" />
      <div className="h-40 animate-pulse rounded-lg bg-line/70" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
