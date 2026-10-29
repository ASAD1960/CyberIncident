'use client';

import { useState } from 'react';
import { assignAction, severityAction, transitionAction } from '@/actions/incidents';
import { ActionForm } from '@/components/forms/action-form';
import { SelectField, TextAreaField } from '@/components/forms/fields';
import { SubmitButton } from '@/components/ui/submit-button';
import { SEVERITIES, SEVERITY_LABELS, STATUS_LABELS } from '@/lib/constants';
import { transitionNeedsReason, transitionNeedsSummary } from '@/lib/workflow/status';
import type { IncidentStatus, PersonRef, Severity } from '@/types';

export function TransitionForm({
  incidentId,
  allowed,
  hasExistingSummary,
}: {
  incidentId: string;
  allowed: IncidentStatus[];
  hasExistingSummary: boolean;
}) {
  const [selected, setSelected] = useState<IncidentStatus | ''>('');
  if (allowed.length === 0) return <p className="text-sm text-muted">No status changes are available to you right now.</p>;

  const needsSummary = selected !== '' && transitionNeedsSummary(selected);
  const needsReason = selected !== '' && transitionNeedsReason(selected);

  return (
    <ActionForm action={transitionAction} className="space-y-3">
      <input type="hidden" name="incidentId" value={incidentId} />
      <div>
        <label htmlFor="toStatus" className="label">Move to</label>
        <select
          id="toStatus"
          name="toStatus"
          className="input"
          value={selected}
          onChange={(e) => setSelected(e.target.value as IncidentStatus | '')}
          required
        >
          <option value="">Choose a status</option>
          {allowed.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>
      {needsSummary && (
        <TextAreaField
          name="summary"
          label="Resolution summary"
          rows={4}
          maxLength={3000}
          required={!hasExistingSummary}
          hint={hasExistingSummary ? 'Leave blank to keep the existing summary.' : 'Describe the root cause and what was done to resolve it.'}
        />
      )}
      {needsReason && <TextAreaField name="reason" label="Reason for reopening" rows={3} maxLength={500} required />}
      <SubmitButton pendingLabel="Updating…">Update status</SubmitButton>
    </ActionForm>
  );
}

export function AssignForm({
  incidentId,
  analysts,
  currentAssigneeId,
}: {
  incidentId: string;
  analysts: PersonRef[];
  currentAssigneeId: string | null;
}) {
  return (
    <ActionForm action={assignAction} className="space-y-3">
      <input type="hidden" name="incidentId" value={incidentId} />
      <SelectField
        name="assigneeId"
        label="Investigator"
        placeholder="Choose an analyst"
        defaultValue={currentAssigneeId ?? ''}
        options={analysts.map((a) => ({ value: a.id, label: a.full_name }))}
      />
      <SubmitButton variant="secondary" pendingLabel="Assigning…">Assign</SubmitButton>
    </ActionForm>
  );
}

export function SeverityForm({ incidentId, current }: { incidentId: string; current: Severity }) {
  return (
    <ActionForm action={severityAction} className="space-y-3">
      <input type="hidden" name="incidentId" value={incidentId} />
      <SelectField
        name="severity"
        label="Severity"
        defaultValue={current}
        options={SEVERITIES.map((s) => ({ value: s, label: SEVERITY_LABELS[s] }))}
      />
      <TextAreaField name="reason" label="Reason (optional)" rows={2} maxLength={500} />
      <SubmitButton variant="secondary" pendingLabel="Saving…">Update severity</SubmitButton>
    </ActionForm>
  );
}
