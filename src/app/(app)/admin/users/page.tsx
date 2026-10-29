import type { Metadata } from 'next';
import { UserAccessForm } from '@/components/admin/admin-forms';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { requireRole } from '@/lib/auth/session';
import { listUsers } from '@/lib/services/users';
import { firstParam, formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Users' };

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const admin = await requireRole('admin');
  const sp = await searchParams;
  const q = firstParam(sp.q)?.slice(0, 80);
  const page = Math.max(1, Math.min(10000, Number(firstParam(sp.page)) || 1));
  const result = await listUsers(page, q);

  return (
    <>
      <PageHeader title="Users" description="Change roles and turn accounts on or off. Every change is written to the audit log." />
      <form method="get" className="panel mb-4 flex flex-wrap items-end gap-3 p-4" aria-label="Find users">
        <div className="min-w-[14rem] flex-1">
          <label htmlFor="u-q" className="label">Search by name or email</label>
          <input id="u-q" name="q" defaultValue={q} className="input" maxLength={80} />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <section className="panel" aria-label="Users">
        {result.items.length === 0 ? (
          <EmptyState title="No users found">Try a different name or email.</EmptyState>
        ) : (
          <>
            <ul className="divide-y divide-line">
              {result.items.map((u) => (
                <li key={u.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_24rem] md:items-end">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{u.full_name}{u.id === admin.id && <span className="ml-2 text-xs font-semibold text-muted">(you)</span>}</p>
                    <p className="truncate text-sm text-muted">{u.email}</p>
                    <p className="text-xs text-muted">Joined {formatDate(u.created_at)}</p>
                  </div>
                  {u.id === admin.id ? (
                    <p className="text-sm text-muted">You can’t change your own role or status.</p>
                  ) : (
                    <UserAccessForm user={u} />
                  )}
                </li>
              ))}
            </ul>
            <div className="border-t border-line">
              <Pagination page={result.page} pageCount={result.pageCount} total={result.total} pageSize={result.pageSize} basePath="/admin/users" params={{ q }} />
            </div>
          </>
        )}
      </section>
    </>
  );
}
