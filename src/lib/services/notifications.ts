import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { fromSupabaseError } from './errors';
import type { AppNotification } from '@/types';

export type NotificationType =
  | 'incident_submitted'
  | 'incident_assigned'
  | 'status_changed'
  | 'info_requested'
  | 'reporter_replied';

/** Types users cannot opt out of (FR-47 only covers non-essential notifications). */
const ESSENTIAL: NotificationType[] = ['incident_submitted', 'incident_assigned', 'info_requested', 'reporter_replied'];

const TITLES: Record<NotificationType, (ref: string) => string> = {
  incident_submitted: (ref) => `New incident ${ref} needs review`,
  incident_assigned: (ref) => `You were assigned ${ref}`,
  status_changed: (ref) => `${ref} has a status update`,
  info_requested: (ref) => `More information requested on ${ref}`,
  reporter_replied: (ref) => `Reporter replied on ${ref}`,
};

/**
 * Creates in-app notifications. Titles carry only the incident reference, never descriptions,
 * evidence names or findings (FR-46). Failures are logged and never block the main action.
 */
export async function notify(params: {
  userIds: string[];
  type: NotificationType;
  incidentId: string;
  incidentRef: string;
  excludeUserId?: string;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    let recipients = [...new Set(params.userIds)].filter((id) => id && id !== params.excludeUserId);
    if (recipients.length === 0) return;

    const { data: profiles } = await admin
      .from('profiles')
      .select('id, notify_status_updates, account_status')
      .in('id', recipients);
    recipients = (profiles ?? [])
      .filter((p: { account_status: string; notify_status_updates: boolean }) =>
        p.account_status === 'active' && (ESSENTIAL.includes(params.type) || p.notify_status_updates),
      )
      .map((p: { id: string }) => p.id);
    if (recipients.length === 0) return;

    const { error } = await admin.from('notifications').insert(
      recipients.map((user_id) => ({
        user_id,
        type: params.type,
        title: TITLES[params.type](params.incidentRef),
        incident_id: params.incidentId,
      })),
    );
    if (error) console.error('[notify] insert failed:', error.message);
  } catch (e) {
    console.error('[notify] unexpected failure:', e instanceof Error ? e.message : e);
  }
}

/** Active analysts, used for "new incident" and "reporter replied" fan-out. */
export async function getAnalystIds(): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin.from('profiles').select('id').eq('role', 'analyst').eq('account_status', 'active');
  return (data ?? []).map((r: { id: string }) => r.id);
}

export async function listNotifications(limit = 50): Promise<AppNotification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, incident_id, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw fromSupabaseError(error);
  return (data ?? []) as AppNotification[];
}

export async function countUnread(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null);
  return count ?? 0;
}

export async function markRead(id?: string): Promise<void> {
  const supabase = await createClient();
  let query = supabase.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);
  if (id) query = query.eq('id', id);
  const { error } = await query;
  if (error) throw fromSupabaseError(error);
}
