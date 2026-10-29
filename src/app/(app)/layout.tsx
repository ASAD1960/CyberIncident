import { AppShell } from '@/components/layout/app-shell';
import { requireUser } from '@/lib/auth/session';
import { countUnread } from '@/lib/services/notifications';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unread = await countUnread().catch(() => 0);
  return (
    <AppShell user={user} unread={unread}>
      {children}
    </AppShell>
  );
}
