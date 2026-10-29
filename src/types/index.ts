export type UserRole = 'reporter' | 'analyst' | 'admin';
export type AccountStatus = 'active' | 'inactive';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus =
  | 'submitted'
  | 'under_review'
  | 'assigned'
  | 'in_investigation'
  | 'resolved'
  | 'closed'
  | 'reopened';
export type NoteKind = 'note' | 'finding' | 'remediation' | 'info_request' | 'reporter_reply';
export type NoteVisibility = 'internal' | 'reporter';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  account_status: AccountStatus;
  notify_status_updates: boolean;
  created_at: string;
}

export interface PersonRef {
  id: string;
  full_name: string;
}

export interface Category {
  key: string;
  label: string;
  is_active: boolean;
  sort_order: number;
}

export interface Incident {
  id: string;
  ref: string;
  title: string;
  description: string;
  category: string;
  severity: Severity;
  status: IncidentStatus;
  reporter_id: string;
  assignee_id: string | null;
  affected_asset: string | null;
  occurred_at: string | null;
  resolution_summary: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
}

export interface IncidentWithPeople extends Incident {
  reporter: PersonRef | null;
  assignee: PersonRef | null;
}

export interface InvestigationNote {
  id: string;
  incident_id: string;
  author_id: string;
  kind: NoteKind;
  visibility: NoteVisibility;
  content: string;
  created_at: string;
  author: PersonRef | null;
}

export interface EvidenceItem {
  id: string;
  incident_id: string;
  uploader_id: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  sha256_hash: string;
  uploaded_at: string;
  uploader: PersonRef | null;
}

export interface HistoryEvent {
  id: string;
  incident_id: string;
  actor_id: string | null;
  action_type: string;
  previous_value: string | null;
  new_value: string | null;
  reporter_visible: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  actor: PersonRef | null;
}

export interface AuditEntry {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  outcome: 'success' | 'failure' | 'denied';
  metadata: Record<string, unknown>;
  created_at: string;
  actor: PersonRef | null;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  incident_id: string | null;
  read_at: string | null;
  created_at: string;
}

export interface AppSettings {
  adminEvidenceAccess: boolean;
  maxFileSizeMb: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
