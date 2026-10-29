import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { MAX_REPORT_ROWS, SEVERITY_LABELS, STATUS_LABELS } from '@/lib/constants';
import type { ReportFilters } from '@/lib/validation/report';
import type { IncidentStatus, Severity } from '@/types';
import { fromSupabaseError } from './errors';

export interface ReportRow {
  ref: string;
  title: string;
  category: string;
  severity: Severity;
  status: IncidentStatus;
  affected_asset: string | null;
  reporter: string;
  assignee: string;
  created_at: string;
  resolved_at: string | null;
}

/**
 * Report data is read through the user's RLS-scoped client, so exports can only ever contain what the
 * user may already see. Descriptions and notes are deliberately excluded (data minimization, SRD 8.4).
 */
export async function getReportRows(filters: ReportFilters): Promise<{ rows: ReportRow[]; truncated: boolean }> {
  const supabase = await createClient();
  let query = supabase
    .from('incidents')
    .select(
      `ref, title, category, severity, status, affected_asset, created_at, resolved_at,
       reporter:profiles!incidents_reporter_id_fkey(full_name),
       assignee:profiles!incidents_assignee_id_fkey(full_name)`,
    );
  if (filters.from) query = query.gte('created_at', `${filters.from}T00:00:00Z`);
  if (filters.to) query = query.lte('created_at', `${filters.to}T23:59:59.999Z`);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.severity) query = query.eq('severity', filters.severity);
  if (filters.status) query = query.eq('status', filters.status);

  const { data, error } = await query.order('created_at', { ascending: false }).limit(MAX_REPORT_ROWS + 1);
  if (error) throw fromSupabaseError(error);

  type Raw = Omit<ReportRow, 'reporter' | 'assignee'> & {
    reporter: { full_name: string } | null;
    assignee: { full_name: string } | null;
  };
  const fetched = (data ?? []) as unknown as Raw[];
  const truncated = fetched.length > MAX_REPORT_ROWS;
  const rows = fetched.slice(0, MAX_REPORT_ROWS).map((r) => ({
    ...r,
    reporter: r.reporter?.full_name ?? '',
    assignee: r.assignee?.full_name ?? '',
  }));
  return { rows, truncated };
}

/** Neutralizes spreadsheet formula injection, including formula markers after leading controls/space. */
function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[\u0000-\u0020]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(rows: ReportRow[], categoryLabels: Map<string, string>): string {
  const header = ['Reference', 'Title', 'Category', 'Severity', 'Status', 'Affected system', 'Reporter', 'Assignee', 'Reported (UTC)', 'Resolved (UTC)'];
  const lines = rows.map((r) =>
    [
      r.ref,
      r.title,
      categoryLabels.get(r.category) ?? r.category,
      SEVERITY_LABELS[r.severity],
      STATUS_LABELS[r.status],
      r.affected_asset,
      r.reporter,
      r.assignee,
      r.created_at,
      r.resolved_at,
    ]
      .map(csvCell)
      .join(','),
  );
  return `\uFEFF${[header.map(csvCell).join(','), ...lines].join('\r\n')}\r\n`;
}
