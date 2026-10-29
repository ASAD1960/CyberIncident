# CyberIncident — Security Review and Patch Notes

## Changes applied in this review

1. **Profile privacy:** added `get_my_profile()` so authenticated users fetch private fields only for their own profile, and `admin_list_profiles()` for administrator-only user management. The follow-up migration revokes broad profile-table `SELECT` and grants direct reads only for `id` and `full_name`, which are used by directory/relationship display.
2. **Incident-history integrity:** added `BEFORE DELETE` and `BEFORE TRUNCATE` triggers for `incident_history`, complementing the existing update protection.
3. **Reporter reply attribution:** service validation now rejects `reporter_reply` notes from non-reporters; the migration also enforces that restriction in the database policy.
4. **CSV export feedback:** CSV cell handling now checks formula markers after leading control/whitespace characters. The report query fetches one extra row to accurately detect truncation, and the endpoint emits `X-Report-Truncated: true` when the row cap is exceeded.
5. **Helper-function execution:** the follow-up migration removes public/anonymous execution from the profile/security helper functions and grants execution to authenticated users for the RLS/application use cases.

## Validation performed

- `npm run typecheck` — passed after the changes.
- ESLint via `node node_modules/next/dist/bin/next lint` — passed with no warnings or errors.
- `next build` — could not complete because the environment could not download the Linux SWC binary from the npm registry (`EAI_AGAIN registry.npmjs.org`). This is an environment/network limitation; production build status remains unverified.
- Live Supabase/RLS tests — not run because no live database environment was provided.

## Important deployment steps

- Back up the database and apply `supabase/migrations/0002_security_hardening.sql` to a **staging** Supabase project first. Review the migration against the exact schema currently deployed before production.
- Test login, profile page, own-profile editing, administrator user list/search, reporter/assignee name display, incident creation, analyst workflow actions, notes, evidence upload/download, and CSV exports with separate reporter, analyst, and administrator accounts.
- Verify RLS behavior using actual authenticated sessions. Do not rely only on UI hiding controls.
- The history delete/truncate triggers intentionally prevent parent-row deletion if it would cascade into history. If incident deletion is ever required, design and document a deliberate retention/archive procedure rather than silently bypassing the guard.
- The CSV endpoint marks truncation in the response header; the current browser download UI does not yet display a warning. Users should narrow filters when the export reaches the configured cap.
- Rate limiting remains process-local. Before multi-instance/serverless production deployment, move it to a shared store and configure client IP extraction for the trusted hosting proxy.

## Scope and limitations

This is a source-level hardening pass, not a penetration test or production certification. Database behavior, storage policies, deployment secrets, reverse-proxy headers, and real user workflows still need staging verification.
