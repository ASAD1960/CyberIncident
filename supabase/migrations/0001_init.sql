-- =============================================================================
-- CyberIncident: initial schema
-- Run in the Supabase SQL editor (or `supabase db push`).
-- Covers: enums, tables, indexes, helper functions, workflow RPCs, triggers,
-- Row Level Security, column-level grants, private evidence bucket, seed data.
-- =============================================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.user_role as enum ('reporter', 'analyst', 'admin');
create type public.account_status as enum ('active', 'inactive');
create type public.incident_severity as enum ('low', 'medium', 'high', 'critical');
create type public.incident_status as enum (
  'submitted', 'under_review', 'assigned', 'in_investigation', 'resolved', 'closed', 'reopened'
);
create type public.note_kind as enum ('note', 'finding', 'remediation', 'info_request', 'reporter_reply');
create type public.note_visibility as enum ('internal', 'reporter');

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 120),
  email text not null,
  role public.user_role not null default 'reporter',
  account_status public.account_status not null default 'active',
  notify_status_updates boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.incident_categories (
  key text primary key check (key ~ '^[a-z_]{2,40}$'),
  label text not null,
  is_active boolean not null default true,
  sort_order int not null default 100
);

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

create sequence public.incident_ref_seq start 1;

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  title text not null check (char_length(title) between 5 and 150),
  description text not null check (char_length(description) between 20 and 5000),
  category text not null references public.incident_categories (key),
  severity public.incident_severity not null default 'medium',
  status public.incident_status not null default 'submitted',
  reporter_id uuid not null references public.profiles (id),
  assignee_id uuid references public.profiles (id),
  affected_asset text check (affected_asset is null or char_length(affected_asset) <= 200),
  occurred_at timestamptz,
  resolution_summary text,
  idempotency_key uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  closed_at timestamptz,
  unique (reporter_id, idempotency_key)
);

create index incidents_status_idx on public.incidents (status);
create index incidents_severity_idx on public.incidents (severity);
create index incidents_category_idx on public.incidents (category);
create index incidents_reporter_idx on public.incidents (reporter_id);
create index incidents_assignee_idx on public.incidents (assignee_id);
create index incidents_created_idx on public.incidents (created_at desc);
create index incidents_title_trgm_idx on public.incidents using gin (title gin_trgm_ops);
create index incidents_asset_trgm_idx on public.incidents using gin (affected_asset gin_trgm_ops);

create table public.investigation_notes (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  kind public.note_kind not null default 'note',
  visibility public.note_visibility not null default 'internal',
  content text not null check (char_length(content) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index notes_incident_idx on public.investigation_notes (incident_id, created_at);

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  uploader_id uuid not null references public.profiles (id),
  storage_path text not null unique,
  original_filename text not null check (char_length(original_filename) <= 255),
  mime_type text not null,
  file_size bigint not null check (file_size > 0),
  sha256_hash char(64) not null,
  uploaded_at timestamptz not null default now()
);
create index evidence_incident_idx on public.evidence (incident_id);

create table public.incident_history (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  action_type text not null,
  previous_value text,
  new_value text,
  reporter_visible boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index history_incident_idx on public.incident_history (incident_id, created_at);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id text,
  outcome text not null default 'success' check (outcome in ('success', 'failure', 'denied')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_created_idx on public.audit_logs (created_at desc);
create index audit_action_idx on public.audit_logs (action);
create index audit_actor_idx on public.audit_logs (actor_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  incident_id uuid references public.incidents (id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- Allowed workflow transitions. Keep in sync with src/lib/workflow/status.ts
create table public.status_transitions (
  from_status public.incident_status not null,
  to_status public.incident_status not null,
  primary key (from_status, to_status)
);
insert into public.status_transitions values
  ('submitted', 'under_review'),
  ('under_review', 'assigned'),
  ('under_review', 'closed'),
  ('assigned', 'in_investigation'),
  ('assigned', 'under_review'),
  ('in_investigation', 'resolved'),
  ('in_investigation', 'assigned'),
  ('resolved', 'closed'),
  ('resolved', 'reopened'),
  ('closed', 'reopened'),
  ('reopened', 'under_review'),
  ('reopened', 'assigned'),
  ('reopened', 'in_investigation');

-- -----------------------------------------------------------------------------
-- Seed data
-- -----------------------------------------------------------------------------
insert into public.incident_categories (key, label, sort_order) values
  ('phishing', 'Phishing', 10),
  ('suspicious_login', 'Suspicious login', 20),
  ('unauthorized_access', 'Unauthorized access', 30),
  ('malware', 'Malware', 40),
  ('data_breach', 'Data breach', 50),
  ('account_compromise', 'Account compromise', 60),
  ('other', 'Other security incident', 900);

insert into public.app_settings (key, value) values
  ('admin_evidence_access', 'false'::jsonb),
  ('max_file_size_mb', '10'::jsonb);

-- -----------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so RLS policies can read profiles safely)
-- -----------------------------------------------------------------------------
create or replace function public.current_app_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and account_status = 'active'
$$;

create or replace function public.is_active_user()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and account_status = 'active')
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() in ('analyst', 'admin'), false)
$$;

create or replace function public.admin_can_read_evidence()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select (value #>> '{}')::boolean from public.app_settings where key = 'admin_evidence_access'), false)
$$;

-- Internal audit writer. Not callable by API roles.
create or replace function public.write_audit(
  p_actor uuid, p_action text, p_entity_type text, p_entity_id text,
  p_outcome text, p_metadata jsonb
) returns void
language sql security definer set search_path = public as $$
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, outcome, metadata)
  values (p_actor, p_action, p_entity_type, p_entity_id, coalesce(p_outcome, 'success'), coalesce(p_metadata, '{}'::jsonb))
$$;

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------
-- New auth user -> profile. Role is ALWAYS reporter; never trusted from metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)), 120)
  );
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger incidents_touch before update on public.incidents
  for each row execute function public.touch_updated_at();

create or replace function public.assign_incident_ref()
returns trigger language plpgsql as $$
begin
  new.ref := 'INC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.incident_ref_seq')::text, 6, '0');
  return new;
end;
$$;
create trigger incidents_ref before insert on public.incidents
  for each row execute function public.assign_incident_ref();

create or replace function public.on_incident_created()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.incident_history (incident_id, actor_id, action_type, new_value, reporter_visible)
  values (new.id, new.reporter_id, 'created', new.status::text, true);
  perform public.write_audit(new.reporter_id, 'incident.created', 'incident', new.id::text, 'success',
    jsonb_build_object('ref', new.ref, 'category', new.category, 'severity', new.severity));
  return new;
end;
$$;
create trigger incidents_after_insert after insert on public.incidents
  for each row execute function public.on_incident_created();

create or replace function public.on_note_created()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.incident_history (incident_id, actor_id, action_type, reporter_visible, metadata)
  values (new.incident_id, new.author_id, 'note_added', new.visibility = 'reporter', jsonb_build_object('kind', new.kind));
  return new;
end;
$$;
create trigger notes_after_insert after insert on public.investigation_notes
  for each row execute function public.on_note_created();

create or replace function public.on_evidence_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.write_audit(new.uploader_id, 'evidence.uploaded', 'evidence', new.id::text, 'success',
      jsonb_build_object('incident_id', new.incident_id, 'size', new.file_size, 'sha256', new.sha256_hash));
    insert into public.incident_history (incident_id, actor_id, action_type, new_value, reporter_visible)
    values (new.incident_id, new.uploader_id, 'evidence_added', new.original_filename, false);
    return new;
  else
    perform public.write_audit(auth.uid(), 'evidence.deleted', 'evidence', old.id::text, 'success',
      jsonb_build_object('incident_id', old.incident_id, 'sha256', old.sha256_hash));
    return old;
  end if;
end;
$$;
create trigger evidence_audit after insert or delete on public.evidence
  for each row execute function public.on_evidence_change();

create or replace function public.on_profile_update_guard()
returns trigger language plpgsql as $$
begin
  -- Defense in depth on top of column grants: only the RPC / SQL editor may change these.
  if (new.role is distinct from old.role or new.account_status is distinct from old.account_status)
     and current_user in ('authenticated', 'anon') then
    raise exception 'NOT_AUTHORIZED: role and account status can only be changed by an administrator';
  end if;
  return new;
end;
$$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.on_profile_update_guard();

create or replace function public.on_settings_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.write_audit(auth.uid(), 'settings.updated', tg_table_name, coalesce(new.key::text, ''), 'success',
    jsonb_build_object('new', to_jsonb(new) - 'updated_by'));
  return new;
end;
$$;
create trigger settings_audit after update on public.app_settings
  for each row execute function public.on_settings_change();

-- Audit trail and history are append-only, even for the service role.
create or replace function public.reject_modification()
returns trigger language plpgsql as $$
begin raise exception '% is append-only', tg_table_name; end;
$$;
create trigger audit_logs_immutable before update or delete on public.audit_logs
  for each row execute function public.reject_modification();
create trigger audit_logs_no_truncate before truncate on public.audit_logs
  for each statement execute function public.reject_modification();
create trigger history_immutable before update on public.incident_history
  for each row execute function public.reject_modification();

-- -----------------------------------------------------------------------------
-- Workflow RPCs (atomic: change + history + audit in one transaction)
-- Error messages use "CODE: message" so the app can map them to friendly text.
-- -----------------------------------------------------------------------------
create or replace function public.transition_incident(
  p_incident_id uuid,
  p_to_status public.incident_status,
  p_summary text default null,
  p_reason text default null
) returns public.incidents
language plpgsql security definer set search_path = public as $$
declare
  v_role public.user_role := public.current_app_role();
  v_inc public.incidents;
  v_prev public.incident_status;
  v_summary text := nullif(trim(coalesce(p_summary, '')), '');
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
  v_action text;
begin
  if v_role is null then
    raise exception 'NOT_AUTHORIZED: You do not have permission to change this incident';
  end if;
  select * into v_inc from public.incidents where id = p_incident_id for update;
  if not found then raise exception 'NOT_FOUND: Incident not found'; end if;

  if not (v_role = 'analyst' or (v_role = 'admin' and p_to_status = 'reopened')) then
    raise exception 'NOT_AUTHORIZED: Your role cannot move an incident to this status';
  end if;
  if not exists (select 1 from public.status_transitions where from_status = v_inc.status and to_status = p_to_status) then
    raise exception 'INVALID_TRANSITION: An incident cannot move from % to %', v_inc.status, p_to_status;
  end if;
  if p_to_status = 'assigned' and v_inc.assignee_id is null then
    raise exception 'ASSIGNEE_REQUIRED: Assign an investigator before using this status';
  end if;
  if p_to_status in ('resolved', 'closed')
     and char_length(coalesce(v_summary, v_inc.resolution_summary, '')) < 10 then
    raise exception 'SUMMARY_REQUIRED: Enter a resolution summary of at least 10 characters';
  end if;
  if p_to_status = 'reopened' and char_length(coalesce(v_reason, '')) < 5 then
    raise exception 'REASON_REQUIRED: Enter a reason for reopening (at least 5 characters)';
  end if;

  v_prev := v_inc.status;
  update public.incidents set
    status = p_to_status,
    resolution_summary = case when p_to_status in ('resolved', 'closed') then coalesce(v_summary, resolution_summary) else resolution_summary end,
    resolved_at = case when p_to_status = 'resolved' then now() when p_to_status = 'reopened' then null else resolved_at end,
    closed_at = case when p_to_status = 'closed' then now() when p_to_status = 'reopened' then null else closed_at end
  where id = v_inc.id
  returning * into v_inc;

  insert into public.incident_history (incident_id, actor_id, action_type, previous_value, new_value, reporter_visible, metadata)
  values (v_inc.id, auth.uid(), 'status_changed', v_prev::text, p_to_status::text, true,
          case when v_reason is not null then jsonb_build_object('reason', v_reason) else '{}'::jsonb end);

  v_action := case p_to_status when 'closed' then 'incident.closed' when 'reopened' then 'incident.reopened' else 'incident.status_changed' end;
  perform public.write_audit(auth.uid(), v_action, 'incident', v_inc.id::text, 'success',
    jsonb_build_object('ref', v_inc.ref, 'from', v_prev, 'to', p_to_status) ||
    case when v_reason is not null then jsonb_build_object('reason', v_reason) else '{}'::jsonb end);
  return v_inc;
end;
$$;

create or replace function public.assign_incident(p_incident_id uuid, p_assignee_id uuid)
returns public.incidents
language plpgsql security definer set search_path = public as $$
declare
  v_inc public.incidents;
  v_prev_assignee uuid;
  v_prev_status public.incident_status;
begin
  if public.current_app_role() is distinct from 'analyst' then
    raise exception 'NOT_AUTHORIZED: Only analysts can assign incidents';
  end if;
  if not exists (select 1 from public.profiles where id = p_assignee_id and role = 'analyst' and account_status = 'active') then
    raise exception 'INVALID_ASSIGNEE: The selected investigator is not an active analyst';
  end if;
  select * into v_inc from public.incidents where id = p_incident_id for update;
  if not found then raise exception 'NOT_FOUND: Incident not found'; end if;
  if v_inc.status = 'submitted' then
    raise exception 'INVALID_TRANSITION: Start the review before assigning an investigator';
  end if;
  if v_inc.status in ('resolved', 'closed') then
    raise exception 'INVALID_TRANSITION: Reopen the incident before changing its assignee';
  end if;

  v_prev_assignee := v_inc.assignee_id;
  v_prev_status := v_inc.status;
  update public.incidents set
    assignee_id = p_assignee_id,
    status = case when status in ('under_review', 'reopened') then 'assigned'::public.incident_status else status end
  where id = v_inc.id
  returning * into v_inc;

  insert into public.incident_history (incident_id, actor_id, action_type, previous_value, new_value, reporter_visible)
  values (v_inc.id, auth.uid(), 'assignee_changed', v_prev_assignee::text, p_assignee_id::text, false);
  if v_prev_status <> v_inc.status then
    insert into public.incident_history (incident_id, actor_id, action_type, previous_value, new_value, reporter_visible)
    values (v_inc.id, auth.uid(), 'status_changed', v_prev_status::text, v_inc.status::text, true);
  end if;
  perform public.write_audit(auth.uid(), 'incident.assigned', 'incident', v_inc.id::text, 'success',
    jsonb_build_object('ref', v_inc.ref, 'assignee_id', p_assignee_id, 'previous_assignee_id', v_prev_assignee));
  return v_inc;
end;
$$;

create or replace function public.update_incident_severity(
  p_incident_id uuid, p_severity public.incident_severity, p_reason text default null
) returns public.incidents
language plpgsql security definer set search_path = public as $$
declare
  v_inc public.incidents;
  v_prev public.incident_severity;
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
begin
  if public.current_app_role() is distinct from 'analyst' then
    raise exception 'NOT_AUTHORIZED: Only analysts can change severity';
  end if;
  select * into v_inc from public.incidents where id = p_incident_id for update;
  if not found then raise exception 'NOT_FOUND: Incident not found'; end if;
  if v_inc.status = 'closed' then
    raise exception 'INVALID_TRANSITION: Reopen the incident before changing its severity';
  end if;
  if v_inc.severity = p_severity then return v_inc; end if;

  v_prev := v_inc.severity;
  update public.incidents set severity = p_severity where id = v_inc.id returning * into v_inc;
  insert into public.incident_history (incident_id, actor_id, action_type, previous_value, new_value, reporter_visible, metadata)
  values (v_inc.id, auth.uid(), 'severity_changed', v_prev::text, p_severity::text, false,
          case when v_reason is not null then jsonb_build_object('reason', v_reason) else '{}'::jsonb end);
  perform public.write_audit(auth.uid(), 'incident.severity_changed', 'incident', v_inc.id::text, 'success',
    jsonb_build_object('ref', v_inc.ref, 'from', v_prev, 'to', p_severity));
  return v_inc;
end;
$$;

create or replace function public.admin_update_user(
  p_user_id uuid, p_role public.user_role, p_status public.account_status
) returns public.profiles
language plpgsql security definer set search_path = public as $$
declare
  v_old public.profiles;
  v_new public.profiles;
begin
  if public.current_app_role() is distinct from 'admin' then
    raise exception 'NOT_AUTHORIZED: Only administrators can manage users';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'INVALID_OPERATION: You cannot change your own role or status';
  end if;
  select * into v_old from public.profiles where id = p_user_id for update;
  if not found then raise exception 'NOT_FOUND: User not found'; end if;

  update public.profiles set role = p_role, account_status = p_status where id = p_user_id returning * into v_new;

  if v_old.role <> v_new.role then
    perform public.write_audit(auth.uid(), 'user.role_changed', 'user', p_user_id::text, 'success',
      jsonb_build_object('from', v_old.role, 'to', v_new.role));
  end if;
  if v_old.account_status <> v_new.account_status then
    perform public.write_audit(auth.uid(), 'user.status_changed', 'user', p_user_id::text, 'success',
      jsonb_build_object('from', v_old.account_status, 'to', v_new.account_status));
  end if;
  return v_new;
end;
$$;

revoke all on function public.transition_incident(uuid, public.incident_status, text, text) from public, anon;
revoke all on function public.assign_incident(uuid, uuid) from public, anon;
revoke all on function public.update_incident_severity(uuid, public.incident_severity, text) from public, anon;
revoke all on function public.admin_update_user(uuid, public.user_role, public.account_status) from public, anon;
revoke all on function public.write_audit(uuid, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.transition_incident(uuid, public.incident_status, text, text) to authenticated;
grant execute on function public.assign_incident(uuid, uuid) to authenticated;
grant execute on function public.update_incident_severity(uuid, public.incident_severity, text) to authenticated;
grant execute on function public.admin_update_user(uuid, public.user_role, public.account_status) to authenticated;
grant execute on function public.current_app_role(), public.is_active_user(), public.is_staff(),
  public.admin_can_read_evidence() to authenticated;

-- -----------------------------------------------------------------------------
-- Table privileges (least privilege; RLS below narrows rows further)
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;

grant select on public.profiles, public.incident_categories, public.app_settings, public.status_transitions,
  public.incidents, public.investigation_notes, public.evidence, public.incident_history,
  public.audit_logs, public.notifications to authenticated;
grant update (full_name, notify_status_updates) on public.profiles to authenticated;
grant update (label, is_active, sort_order) on public.incident_categories to authenticated;
grant update (value, updated_by, updated_at) on public.app_settings to authenticated;
grant insert (title, description, category, severity, affected_asset, occurred_at, reporter_id, idempotency_key)
  on public.incidents to authenticated;
grant insert (incident_id, author_id, kind, visibility, content) on public.investigation_notes to authenticated;
grant insert (incident_id, uploader_id, storage_path, original_filename, mime_type, file_size, sha256_hash)
  on public.evidence to authenticated;
grant delete on public.evidence to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.incident_categories enable row level security;
alter table public.app_settings enable row level security;
alter table public.status_transitions enable row level security;
alter table public.incidents enable row level security;
alter table public.investigation_notes enable row level security;
alter table public.evidence enable row level security;
alter table public.incident_history enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;

-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or (public.is_active_user() and (public.is_staff() or role in ('analyst', 'admin'))));
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- reference data
create policy categories_select on public.incident_categories for select to authenticated
  using (public.is_active_user());
create policy categories_update on public.incident_categories for update to authenticated
  using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');
create policy settings_select on public.app_settings for select to authenticated
  using (public.is_active_user());
create policy settings_update on public.app_settings for update to authenticated
  using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');
create policy transitions_select on public.status_transitions for select to authenticated
  using (public.is_active_user());

-- incidents (all changes after creation go through the RPCs above)
create policy incidents_select on public.incidents for select to authenticated
  using (public.is_active_user() and (reporter_id = auth.uid() or public.is_staff()));
create policy incidents_insert on public.incidents for insert to authenticated
  with check (public.is_active_user() and reporter_id = auth.uid());

-- investigation notes (admins do not read internal notes)
create policy notes_select on public.investigation_notes for select to authenticated
  using (
    public.current_app_role() = 'analyst'
    or (visibility = 'reporter' and public.is_active_user()
        and exists (select 1 from public.incidents i where i.id = incident_id and i.reporter_id = auth.uid()))
  );
create policy notes_insert on public.investigation_notes for insert to authenticated
  with check (
    author_id = auth.uid() and (
      public.current_app_role() = 'analyst'
      or (public.is_active_user() and visibility = 'reporter' and kind = 'reporter_reply'
          and exists (select 1 from public.incidents i where i.id = incident_id and i.reporter_id = auth.uid()
                      and i.status not in ('closed')))
    )
  );

-- evidence (admin access is a configurable policy, see app_settings.admin_evidence_access)
create policy evidence_select on public.evidence for select to authenticated
  using (
    public.current_app_role() = 'analyst'
    or (public.current_app_role() = 'admin' and public.admin_can_read_evidence())
    or (public.is_active_user()
        and exists (select 1 from public.incidents i where i.id = incident_id and i.reporter_id = auth.uid()))
  );
create policy evidence_insert on public.evidence for insert to authenticated
  with check (
    uploader_id = auth.uid() and (
      public.current_app_role() = 'analyst'
      or (public.is_active_user()
          and exists (select 1 from public.incidents i where i.id = incident_id and i.reporter_id = auth.uid()
                      and i.status <> 'closed'))
    )
  );
create policy evidence_delete on public.evidence for delete to authenticated
  using (public.current_app_role() = 'analyst');

-- history (reporters only see events flagged reporter_visible on their own incidents)
create policy history_select on public.incident_history for select to authenticated
  using (
    public.is_staff()
    or (reporter_visible and public.is_active_user()
        and exists (select 1 from public.incidents i where i.id = incident_id and i.reporter_id = auth.uid()))
  );

-- audit logs: administrators only; no insert/update/delete policies exist
create policy audit_select on public.audit_logs for select to authenticated
  using (public.current_app_role() = 'admin');

-- notifications: own rows only
create policy notifications_select on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Private evidence bucket. No storage policies are created for API roles, so the
-- bucket is reachable only through the server (service role) after the app has
-- authorized the request via RLS-protected metadata.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('evidence', 'evidence', false, 10485760)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;
