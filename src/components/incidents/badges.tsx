import { ChevronDown, ChevronUp, ChevronsUp, Equal } from 'lucide-react';
import { SEVERITY_LABELS, STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { IncidentStatus, Severity } from '@/types';

/**
 * Severity is encoded three ways (icon shape, text label, colour) so it never relies on colour alone (NFR-27).
 */
const SEVERITY_STYLE: Record<Severity, { box: string; Icon: typeof ChevronUp }> = {
  low: { box: 'bg-ok-soft text-ok border-ok/30', Icon: ChevronDown },
  medium: { box: 'bg-warn-soft text-warn border-warn/30', Icon: Equal },
  high: { box: 'bg-[#fce3d2] text-[#8a3500] border-[#8a3500]/40', Icon: ChevronUp },
  critical: { box: 'bg-danger-soft text-danger border-danger border-2 font-bold', Icon: ChevronsUp },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { box, Icon } = SEVERITY_STYLE[severity];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold', box)}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {SEVERITY_LABELS[severity]}
    </span>
  );
}

const STATUS_STYLE: Record<IncidentStatus, string> = {
  submitted: 'border-line bg-paper text-ink',
  under_review: 'border-brand/40 bg-brand-soft text-brand-dark',
  assigned: 'border-brand/40 bg-brand-soft text-brand-dark',
  in_investigation: 'border-brand bg-brand text-white',
  resolved: 'border-ok/40 bg-ok-soft text-ok',
  closed: 'border-line bg-surface text-muted',
  reopened: 'border-warn/50 bg-warn-soft text-warn',
};

export function StatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', STATUS_STYLE[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}
