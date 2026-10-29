import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { EvidencePanel } from '@/components/incidents/evidence-panel';
import { NoteList } from '@/components/incidents/note-list';
import { NoteForm } from '@/components/incidents/notes-panel';
import { Timeline } from '@/components/incidents/timeline';
import { SeverityBadge, StatusBadge } from '@/components/incidents/badges';
import { AssignForm, SeverityForm, TransitionForm } from '@/components/incidents/workflow-panel';
import { canAddEvidence, canDeleteEvidence, canReplyAsReporter, canTriage, isStaff } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { getAllowedTransitions } from '@/lib/workflow/status';
import { listEvidence } from '@/lib/services/evidence';
import { getIncident, listAssignableAnalysts, listHistory, listNotes } from '@/lib/services/incidents';
import { getCategories, getSettings } from '@/lib/services/settings';
import { firstParam, formatDateTime } from '@/lib/utils';

export const metadata: Metadata = { title: 'Incident' };

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="panel p-4" aria-labelledby={id}>
      <h2 id={id} className="panel-title mb-3">{title}</h2>
      {children}
    </section>
  );
}

export default async function IncidentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const sp = await searchParams;

  // RLS returns nothing for incidents the user may not see, so "missing" and "forbidden" look the same.
  const incident = await getIncident(id);
  if (!incident) notFound();

  const role = user.profile.role;
  const actor = { id: user.id, role };
  const staff = isStaff(role);

  const [settings, categories, evidence, notes, history, analysts] = await Promise.all([
    getSettings(),
    getCategories({ includeInactive: true }),
    listEvidence(id),
    listNotes(id),
    listHistory(id),
    staff ? listAssignableAnalysts() : Promise.resolve([]),
  ]);

  const categoryLabel = categories.find((c) => c.key === incident.category)?.label ?? incident.category;
  const people = new Map(analysts.map((a) => [a.id, a.full_name]));
  const allowed = getAllowedTransitions(incident.status, role);
  const justSubmitted = firstParam(sp.submitted) === '1';
  const evidenceFailed = Number(firstParam(sp.evidenceFailed) ?? 0);
  const adminEvidenceHidden = role === 'admin' && !settings.adminEvidenceAccess;
  const canAssign = canTriage(role) && !['submitted', 'resolved', 'closed'].includes(incident.status);

  return (
    <>
      {justSubmitted && (
        <Alert tone="success" className="mb-4">
          Report submitted. Your reference is <strong>{incident.ref}</strong>. Keep it handy if you contact the security team.
        </Alert>
      )}
      {evidenceFailed > 0 && (
        <Alert tone="warning" className="mb-4">
          {evidenceFailed} file{evidenceFailed === 1 ? ' was' : 's were'} not saved. The report itself was submitted. You can add the files again below.
        </Alert>
      )}

      <header className="mb-6">
        <p className="text-sm font-semibold text-brand">{incident.ref}</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{incident.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <SeverityBadge severity={incident.severity} />
          <StatusBadge status={incident.status} />
          <span className="text-sm text-muted">{categoryLabel}</span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_21rem]">
        <div className="min-w-0 space-y-6">
          <Section id="desc-h" title="What was reported">
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{incident.description}</p>
          </Section>

          {incident.resolution_summary && (
            <Section id="res-h" title="Resolution">
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{incident.resolution_summary}</p>
            </Section>
          )}

          <Section id="ev-h" title="Evidence">
            {adminEvidenceHidden ? (
              <Alert tone="info">Evidence files are restricted. An administrator can allow access under Settings.</Alert>
            ) : (
              <EvidencePanel
                incidentId={incident.id}
                items={evidence}
                canUpload={canAddEvidence(actor, incident)}
                canDelete={canDeleteEvidence(role)}
                maxFileSizeMb={settings.maxFileSizeMb}
              />
            )}
          </Section>

          {role !== 'admin' && (
            <Section id="notes-h" title={staff ? 'Investigation' : 'Messages from the security team'}>
              <div className="space-y-5">
                <NoteList notes={notes} />
                {canTriage(role) && incident.status !== 'closed' && <NoteForm incidentId={incident.id} mode="analyst" />}
                {!staff && canReplyAsReporter(actor, incident) && notes.length > 0 && <NoteForm incidentId={incident.id} mode="reporter" />}
              </div>
            </Section>
          )}
        </div>

        <aside className="space-y-6">
          {staff && (allowed.length > 0 || canAssign || canTriage(role)) && (
            <Section id="wf-h" title="Manage">
              <div className="space-y-6">
                <TransitionForm incidentId={incident.id} allowed={allowed} hasExistingSummary={Boolean(incident.resolution_summary)} />
                {canAssign && (
                  <div className="border-t border-line pt-5">
                    <AssignForm incidentId={incident.id} analysts={analysts} currentAssigneeId={incident.assignee_id} />
                  </div>
                )}
                {canTriage(role) && incident.status !== 'closed' && (
                  <div className="border-t border-line pt-5">
                    <SeverityForm incidentId={incident.id} current={incident.severity} />
                  </div>
                )}
                {canTriage(role) && incident.status === 'submitted' && (
                  <p className="text-xs text-muted">Start the review to unlock assignment.</p>
                )}
              </div>
            </Section>
          )}

          <Section id="det-h" title="Details">
            <dl className="space-y-3 text-sm">
              <div><dt className="font-semibold">Reported by</dt><dd>{incident.reporter?.full_name ?? '—'}</dd></div>
              <div><dt className="font-semibold">Investigator</dt><dd>{incident.assignee?.full_name ?? 'Not assigned yet'}</dd></div>
              <div><dt className="font-semibold">Affected system</dt><dd className="break-words">{incident.affected_asset ?? '—'}</dd></div>
              <div><dt className="font-semibold">Happened</dt><dd>{formatDateTime(incident.occurred_at)}</dd></div>
              <div><dt className="font-semibold">Reported</dt><dd>{formatDateTime(incident.created_at)}</dd></div>
              <div><dt className="font-semibold">Last updated</dt><dd>{formatDateTime(incident.updated_at)}</dd></div>
              {incident.resolved_at && <div><dt className="font-semibold">Resolved</dt><dd>{formatDateTime(incident.resolved_at)}</dd></div>}
            </dl>
          </Section>

          <Section id="tl-h" title="Timeline">
            <Timeline events={history} people={people} />
          </Section>
        </aside>
      </div>
    </>
  );
}
