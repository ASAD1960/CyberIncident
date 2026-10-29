import type { IncidentStatus, UserRole } from '@/types';

/**
 * Incident workflow. Mirrors public.status_transitions in the database migration.
 * The database function transition_incident() re-validates every change, so this module
 * exists for early, friendly feedback and for rendering only the valid choices in the UI.
 */
export const TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  submitted: ['under_review'],
  under_review: ['assigned', 'closed'],
  assigned: ['in_investigation', 'under_review'],
  in_investigation: ['resolved', 'assigned'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  reopened: ['under_review', 'assigned', 'in_investigation'],
};

export function getAllowedTransitions(status: IncidentStatus, role: UserRole): IncidentStatus[] {
  const next = TRANSITIONS[status] ?? [];
  if (role === 'analyst') return next;
  if (role === 'admin') return next.filter((s) => s === 'reopened'); // FR-25: authorized personnel may reopen
  return [];
}

export interface TransitionCheck {
  from: IncidentStatus;
  to: IncidentStatus;
  role: UserRole;
  hasAssignee: boolean;
  existingSummary: string | null;
  summary?: string | null;
  reason?: string | null;
}

/** Returns a user-facing error message, or null when the transition is acceptable. */
export function validateTransition(c: TransitionCheck): string | null {
  if (!getAllowedTransitions(c.from, c.role).includes(c.to)) {
    return 'That status change is not allowed for this incident.';
  }
  if (c.to === 'assigned' && !c.hasAssignee) {
    return 'Assign an investigator before using this status.';
  }
  if (c.to === 'resolved' || c.to === 'closed') {
    const summary = (c.summary ?? '').trim() || c.existingSummary || '';
    if (summary.length < 10) return 'Enter a resolution summary of at least 10 characters.';
  }
  if (c.to === 'reopened' && (c.reason ?? '').trim().length < 5) {
    return 'Enter a reason for reopening (at least 5 characters).';
  }
  return null;
}

export const transitionNeedsSummary = (to: IncidentStatus) => to === 'resolved' || to === 'closed';
export const transitionNeedsReason = (to: IncidentStatus) => to === 'reopened';
