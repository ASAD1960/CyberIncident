import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Paginated, Profile, UserRole } from '@/types';
import { fromSupabaseError } from './errors';

const USER_PAGE_SIZE = 20;

export async function listUsers(page = 1, q?: string): Promise<Paginated<Profile>> {
  const supabase = await createClient();
  const from = (page - 1) * USER_PAGE_SIZE;
  const { data, error } = await supabase.rpc('admin_list_profiles', {
    p_search: q?.replace(/[%_*,()\\"'`:]/g, ' ').trim().slice(0, 80) || null,
    p_limit: USER_PAGE_SIZE,
    p_offset: from,
  });
  if (error) throw fromSupabaseError(error);
  const rows = (data ?? []) as Array<Profile & { total_count: number | string }>;
  const total = Number(rows[0]?.total_count ?? 0);
  return {
    items: rows.map((row) => {
      const { total_count: _totalCount, ...profile } = row;
      return profile;
    }),
    total,
    page,
    pageSize: USER_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / USER_PAGE_SIZE)),
  };
}

/** Role/status changes go through a SECURITY DEFINER RPC that checks the caller and writes the audit entry. */
export async function updateUserAccess(userId: string, role: UserRole, status: 'active' | 'inactive'): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('admin_update_user', { p_user_id: userId, p_role: role, p_status: status });
  if (error) throw fromSupabaseError(error);
}

export async function updateOwnProfile(userId: string, fullName: string, notifyStatusUpdates: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, notify_status_updates: notifyStatusUpdates })
    .eq('id', userId);
  if (error) throw fromSupabaseError(error);
}
