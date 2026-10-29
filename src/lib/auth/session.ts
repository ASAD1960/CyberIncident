import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile, UserRole } from '@/types';

export interface SessionUser {
  id: string;
  email: string;
  profile: Profile;
}

/** Verified user (validated with the Auth server, not just the cookie). Cached per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profileRows, error: profileError } = await supabase.rpc('get_my_profile');
  if (profileError) return null;
  const profile = profileRows?.[0];
  if (!profile || profile.id !== user.id) return null;

  return { id: user.id, email: user.email ?? (profile as Profile).email, profile: profile as Profile };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.profile.account_status !== 'active') redirect('/login?error=inactive');
  return user;
}

/** Server-side role gate for pages and actions. Redirects rather than rendering a partial UI. */
export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.profile.role)) redirect('/dashboard?error=forbidden');
  return user;
}
