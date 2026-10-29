-- Security hardening follow-up migration for existing CyberIncident installations.
-- Apply after 0001_init.sql. Review in staging before production deployment.

-- Keep incident history append-only, including attempts to delete rows or truncate.
create trigger history_no_delete before delete on public.incident_history
  for each row execute function public.reject_modification();
create trigger history_no_truncate before truncate on public.incident_history
  for each statement execute function public.reject_modification();

-- Limit direct profile reads to directory fields. Private profile data is returned
-- only by narrowly scoped, SECURITY DEFINER RPCs below.
revoke select on public.profiles from authenticated;
grant select (id, full_name) on public.profiles to authenticated;

create or replace function public.get_my_profile()
returns table (
  id uuid,
  full_name text,
  email text,
  role public.user_role,
  account_status public.account_status,
  notify_status_updates boolean,
  created_at timestamptz
)
language sql stable security definer set search_path = public, pg_temp as $$
  select p.id, p.full_name, p.email, p.role, p.account_status, p.notify_status_updates, p.created_at
  from public.profiles p
  where p.id = auth.uid()
$$;

create or replace function public.admin_list_profiles(
  p_search text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  full_name text,
  email text,
  role public.user_role,
  account_status public.account_status,
  notify_status_updates boolean,
  created_at timestamptz,
  total_count bigint
)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null or not public.is_active_user() or public.current_app_role() <> 'admin' then
    raise exception 'NOT_AUTHORIZED: administrator access required' using errcode = '42501';
  end if;

  return query
  select p.id, p.full_name, p.email, p.role, p.account_status, p.notify_status_updates, p.created_at,
         count(*) over () as total_count
  from public.profiles p
  where p_search is null or btrim(p_search) = ''
     or position(lower(btrim(p_search)) in lower(p.full_name)) > 0
     or position(lower(btrim(p_search)) in lower(p.email)) > 0
  order by p.created_at desc
  limit greatest(1, least(coalesce(p_limit, 20), 100))
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

revoke all on function public.get_my_profile() from public, anon;
revoke all on function public.admin_list_profiles(text, integer, integer) from public, anon;
grant execute on function public.get_my_profile() to authenticated;
grant execute on function public.admin_list_profiles(text, integer, integer) to authenticated;

-- RPC helpers should not be callable anonymously. Authenticated execution is needed
-- by RLS policies and application workflow checks.
revoke all on function public.current_app_role() from public, anon;
revoke all on function public.is_active_user() from public, anon;
revoke all on function public.is_staff() from public, anon;
revoke all on function public.admin_can_read_evidence() from public, anon;
grant execute on function public.current_app_role(), public.is_active_user(), public.is_staff(),
  public.admin_can_read_evidence() to authenticated;

-- Only the owning reporter may create reporter_reply notes. Analysts may create
-- investigation notes and info requests, but cannot impersonate the reporter.
drop policy if exists notes_insert on public.investigation_notes;
create policy notes_insert on public.investigation_notes for insert to authenticated
  with check (
    author_id = auth.uid() and (
      (public.current_app_role() = 'analyst' and kind <> 'reporter_reply')
      or (public.current_app_role() = 'reporter' and public.is_active_user()
          and visibility = 'reporter' and kind = 'reporter_reply'
          and exists (
            select 1 from public.incidents i
            where i.id = incident_id and i.reporter_id = auth.uid() and i.status <> 'closed'
          ))
    )
  );
