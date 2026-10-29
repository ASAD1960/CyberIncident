import type { IncidentStatus, Severity, UserRole, NoteKind } from '@/types';

export const APP_NAME = 'CyberIncident';
export const PAGE_SIZE = 15;
export const MAX_REPORT_ROWS = 5000;

export const ROLES: UserRole[] = ['reporter', 'analyst', 'admin'];
export const ROLE_LABELS: Record<UserRole, string> = {
  reporter: 'Reporter',
  analyst: 'Security analyst',
  admin: 'Administrator',
};

export const SEVERITIES: Severity[] = ['low', 'medium', 'high', 'critical'];
export const SEVERITY_LABELS: Record<Severity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const STATUSES: IncidentStatus[] = [
  'submitted',
  'under_review',
  'assigned',
  'in_investigation',
  'resolved',
  'closed',
  'reopened',
];
export const STATUS_LABELS: Record<IncidentStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under review',
  assigned: 'Assigned',
  in_investigation: 'In investigation',
  resolved: 'Resolved',
  closed: 'Closed',
  reopened: 'Reopened',
};
/** Statuses that count as "open" on the dashboard. */
export const OPEN_STATUSES: IncidentStatus[] = [
  'submitted',
  'under_review',
  'assigned',
  'in_investigation',
  'reopened',
];

export const NOTE_KIND_LABELS: Record<NoteKind, string> = {
  note: 'Note',
  finding: 'Finding',
  remediation: 'Remediation',
  info_request: 'Information request',
  reporter_reply: 'Reporter reply',
};

// --- Evidence ----------------------------------------------------------------
export const EVIDENCE_BUCKET = 'evidence';
export const HARD_MAX_FILE_MB = 10; // must stay below next.config serverActions.bodySizeLimit
export const MAX_FILES_PER_UPLOAD = 5;
export const SIGNED_URL_TTL_SECONDS = 60;

/** Extension -> MIME type. The stored MIME type comes from here, never from the client. */
export const ALLOWED_EVIDENCE_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.txt': 'text/plain',
  '.log': 'text/plain',
  '.csv': 'text/csv',
  '.json': 'application/json',
  '.eml': 'message/rfc822',
};

export const AUDIT_ACTIONS = [
  'auth.login',
  'auth.login_failed',
  'auth.logout',
  'auth.password_reset_requested',
  'incident.created',
  'incident.status_changed',
  'incident.severity_changed',
  'incident.assigned',
  'incident.closed',
  'incident.reopened',
  'evidence.uploaded',
  'evidence.downloaded',
  'evidence.deleted',
  'user.role_changed',
  'user.status_changed',
  'settings.updated',
  'report.exported',
  'access.denied',
] as const;
