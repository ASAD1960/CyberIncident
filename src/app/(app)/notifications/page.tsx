import type { Metadata } from 'next';
import Link from 'next/link';
import { markAllNotificationsReadAction, markNotificationReadAction } from '@/actions/notifications';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { requireUser } from '@/lib/auth/session';
import { listNotifications } from '@/lib/services/notifications';
import { cn, formatDateTime } from '@/lib/utils';

export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  await requireUser();
  const items = await listNotifications();
  const unread = items.filter((n) => !n.read_at).length;

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Updates on incidents you reported or work on. Messages show only the reference; open the incident for details."
        actions={
          unread > 0 ? (
            <form action={markAllNotificationsReadAction}>
              <Button type="submit" variant="secondary">Mark all as read</Button>
            </form>
          ) : undefined
        }
      />
      <section className="panel" aria-label="Notifications">
        {items.length === 0 ? (
          <EmptyState title="You’re all caught up">New updates will appear here.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((n) => (
              <li key={n.id} className={cn('flex flex-wrap items-center gap-3 px-4 py-3', !n.read_at && 'bg-brand-soft/50')}>
                <div className="min-w-0 flex-1">
                  <p className={cn('text-sm', !n.read_at && 'font-semibold')}>
                    {!n.read_at && <span className="mr-2 rounded bg-brand px-1.5 py-0.5 text-xs font-bold text-white">New</span>}
                    {n.title}
                  </p>
                  <p className="text-xs text-muted"><time dateTime={n.created_at}>{formatDateTime(n.created_at)}</time></p>
                </div>
                {n.incident_id && (
                  <Link href={`/incidents/${n.incident_id}`} className="text-sm font-semibold text-brand hover:underline">Open incident</Link>
                )}
                {!n.read_at && (
                  <form action={markNotificationReadAction}>
                    <input type="hidden" name="id" value={n.id} />
                    <Button type="submit" variant="ghost" className="px-2 py-1 text-xs">Mark as read</Button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
