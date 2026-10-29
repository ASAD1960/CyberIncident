import { Menu, ShieldAlert } from 'lucide-react';
import { signOutAction } from '@/actions/auth';
import { APP_NAME, ROLE_LABELS } from '@/lib/constants';
import { canManageSettings, canManageUsers, canViewAuditLog } from '@/lib/auth/permissions';
import type { SessionUser } from '@/lib/auth/session';
import { NavLinks, type NavItem } from './nav-links';

function buildNav(user: SessionUser, unread: number): { main: NavItem[]; admin: NavItem[] } {
  const role = user.profile.role;
  const main: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '/incidents', label: role === 'reporter' ? 'My incidents' : 'Incidents', icon: 'incidents' },
    { href: '/incidents/new', label: 'Report an incident', icon: 'new' },
    { href: '/reports', label: 'Reports', icon: 'reports' },
    { href: '/notifications', label: 'Notifications', icon: 'notifications', badge: unread },
    { href: '/profile', label: 'Profile', icon: 'profile' },
  ];
  const admin: NavItem[] = [];
  if (canManageUsers(role)) admin.push({ href: '/admin/users', label: 'Users', icon: 'users' });
  if (canViewAuditLog(role)) admin.push({ href: '/admin/audit', label: 'Audit log', icon: 'audit' });
  if (canManageSettings(role)) admin.push({ href: '/admin/settings', label: 'Settings', icon: 'settings' });
  return { main, admin };
}

function Sidebar({ user, unread }: { user: SessionUser; unread: number }) {
  const { main, admin } = buildNav(user, unread);
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center gap-2 px-2 pt-1 font-display text-lg font-semibold text-white">
        <ShieldAlert className="h-5 w-5" aria-hidden />
        {APP_NAME}
      </div>
      <nav aria-label="Primary" className="flex-1 space-y-6">
        <NavLinks items={main} />
        {admin.length > 0 && (
          <div>
            <p className="mb-1 px-3 text-xs font-semibold text-white/60">Administration</p>
            <NavLinks items={admin} />
          </div>
        )}
      </nav>
      <div className="border-t border-white/15 px-2 pt-4 text-sm text-white">
        <p className="truncate font-semibold">{user.profile.full_name}</p>
        <p className="truncate text-xs text-white/70">{ROLE_LABELS[user.profile.role]}</p>
        <form action={signOutAction} className="mt-3">
          <button type="submit" className="rounded-md border border-white/30 px-3 py-1.5 text-xs font-semibold hover:bg-white/10">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

export function AppShell({ user, unread, children }: { user: SessionUser; unread: number; children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-screen bg-rail lg:block">
        <Sidebar user={user} unread={unread} />
      </aside>

      {/* Mobile bar with disclosure menu (no JS required) */}
      <details className="group sticky top-0 z-30 bg-rail text-white lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-display font-semibold">
          <span className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" aria-hidden /> {APP_NAME}
          </span>
          <span className="flex items-center gap-2 text-sm font-semibold">
            Menu <Menu className="h-5 w-5" aria-hidden />
          </span>
        </summary>
        <div className="max-h-[80vh] overflow-y-auto border-t border-white/15">
          <Sidebar user={user} unread={unread} />
        </div>
      </details>

      <main id="main" className="min-w-0 px-4 py-6 sm:px-8 lg:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
