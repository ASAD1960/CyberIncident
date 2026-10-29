import type { Incident, UserRole } from '@/types';

/**
 * Pure, side-effect-free permission rules. These drive the UI and server-side pre-checks;
 * Postgres RLS and the workflow RPCs remain the authoritative enforcement layer.
 */
type Actor = { id: string; role: UserRole };

export const isStaff = (role: UserRole) => role === 'analyst' || role === 'admin';

export const canTriage = (role: UserRole) => role === 'analyst';
export const canManageUsers = (role: UserRole) => role === 'admin';
export const canViewAuditLog = (role: UserRole) => role === 'admin';
export const canManageSettings = (role: UserRole) => role === 'admin';
export const canAddInternalNotes = (role: UserRole) => role === 'analyst';

export function canAddEvidence(actor: Actor, incident: Pick<Incident, 'reporter_id' | 'status'>): boolean {
  if (incident.status === 'closed') return false;
  if (actor.role === 'analyst') return true;
  return actor.role === 'reporter' && incident.reporter_id === actor.id;
}

export const canDeleteEvidence = (role: UserRole) => role === 'analyst';

export function canReplyAsReporter(actor: Actor, incident: Pick<Incident, 'reporter_id' | 'status'>): boolean {
  return incident.reporter_id === actor.id && incident.status !== 'closed';
}

export function canViewEvidence(role: UserRole, adminEvidenceAccess: boolean): boolean {
  if (role === 'admin') return adminEvidenceAccess;
  return true; // reporters/analysts: row visibility is further narrowed by RLS
}
