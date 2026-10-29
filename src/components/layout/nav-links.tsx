'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, BarChart3, ClipboardList, FilePlus2, LayoutDashboard, ScrollText, Settings, UserCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS = { dashboard: LayoutDashboard, incidents: ClipboardList, new: FilePlus2, reports: BarChart3, notifications: Bell, profile: UserCircle, users: Users, audit: ScrollText, settings: Settings };

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  badge?: number;
}

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {items.map(({ href, label, icon, badge }) => {
        const Icon = ICONS[icon];
        const active = pathname === href || (href !== '/incidents' && pathname.startsWith(`${href}/`)) || (href === '/incidents' && pathname.startsWith('/incidents') && pathname !== '/incidents/new');
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white',
                active && 'bg-white/15 text-white',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="flex-1">{label}</span>
              {badge ? (
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-rail" aria-label={`${badge} unread`}>
                  {badge}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
