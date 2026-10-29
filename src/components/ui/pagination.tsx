import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Server-rendered pagination that preserves the current filters via the query string. */
export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  basePath,
  params,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    sp.set('page', String(p));
    return `${basePath}?${sp.toString()}`;
  };
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const link = 'inline-flex items-center gap-1 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-paper';

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-muted">
      <p>
        Showing {start}–{end} of {total}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className={link}>
            <ChevronLeft className="h-4 w-4" aria-hidden /> Previous
          </Link>
        ) : null}
        {page < pageCount ? (
          <Link href={href(page + 1)} className={link}>
            Next <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
