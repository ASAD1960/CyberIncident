import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { MAX_REPORT_ROWS, OPEN_STATUSES } from '@/lib/constants';
import type { IncidentStatus, Severity } from '@/types';
import { fromSupabaseError } from './errors';

export interface DashboardStats {
  total: number;
  open: number;
  critical: number;
  underInvestigation: number;
  resolved: number;
  bySeverity: Record<Severity, number>;
  byCategory: { key: string; count: number }[];
  byStatus: Record<IncidentStatus, number>;
  perDay: { date: string; count: number }[];
  truncated: boolean;
}

interface Row {
  severity: Severity;
  status: IncidentStatus;
  category: string;
  created_at: string;
}

/**
 * Aggregates incident counts for a date range. Rows come from the user's own RLS-scoped client,
 * so every number respects the viewer's permissions (FR-43).
 */
export async function getDashboardStats(range: { from?: string; to?: string }): Promise<DashboardStats> {
  const supabase = await createClient();
  let query = supabase.from('incidents').select('severity, status, category, created_at');
  if (range.from) query = query.gte('created_at', `${range.from}T00:00:00Z`);
  if (range.to) query = query.lte('created_at', `${range.to}T23:59:59.999Z`);
  const { data, error } = await query.order('created_at', { ascending: false }).limit(MAX_REPORT_ROWS);
  if (error) throw fromSupabaseError(error);

  const rows = (data ?? []) as Row[];
  const bySeverity: Record<Severity, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  const byStatus: Record<IncidentStatus, number> = {
    submitted: 0, under_review: 0, assigned: 0, in_investigation: 0, resolved: 0, closed: 0, reopened: 0,
  };
  const categories = new Map<string, number>();
  const days = new Map<string, number>();

  for (const r of rows) {
    bySeverity[r.severity] += 1;
    byStatus[r.status] += 1;
    categories.set(r.category, (categories.get(r.category) ?? 0) + 1);
    const day = r.created_at.slice(0, 10);
    days.set(day, (days.get(day) ?? 0) + 1);
  }

  return {
    total: rows.length,
    open: rows.filter((r) => OPEN_STATUSES.includes(r.status)).length,
    critical: rows.filter((r) => r.severity === 'critical' && OPEN_STATUSES.includes(r.status)).length,
    underInvestigation: byStatus.in_investigation,
    resolved: byStatus.resolved + byStatus.closed,
    bySeverity,
    byStatus,
    byCategory: [...categories].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
    perDay: [...days].map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
    truncated: rows.length >= MAX_REPORT_ROWS,
  };
}

/** Open incidents ordered by urgency, for the "needs attention" list. */
export async function getAttentionQueue(limit = 6) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('incidents')
    .select('id, ref, title, severity, status, created_at')
    .in('status', OPEN_STATUSES)
    .order('severity', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw fromSupabaseError(error);
  return (data ?? []) as { id: string; ref: string; title: string; severity: Severity; status: IncidentStatus; created_at: string }[];
}
