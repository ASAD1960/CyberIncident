'use client';

import { addNoteAction } from '@/actions/incidents';
import { ActionForm } from '@/components/forms/action-form';
import { SelectField, TextAreaField } from '@/components/forms/fields';
import { SubmitButton } from '@/components/ui/submit-button';
import type { NoteKind } from '@/types';

/** Analysts choose the note type; reporters can only send a reply to an information request. */
export function NoteForm({ incidentId, mode }: { incidentId: string; mode: 'analyst' | 'reporter' }) {
  const analystOptions: { value: NoteKind; label: string }[] = [
    { value: 'note', label: 'Internal note' },
    { value: 'finding', label: 'Finding (internal)' },
    { value: 'remediation', label: 'Remediation action (internal)' },
    { value: 'info_request', label: 'Ask the reporter for information' },
  ];
  return (
    <ActionForm action={addNoteAction} className="space-y-3">
      <input type="hidden" name="incidentId" value={incidentId} />
      {mode === 'analyst' ? (
        <SelectField name="kind" label="Type" options={analystOptions} defaultValue="note" />
      ) : (
        <input type="hidden" name="kind" value="reporter_reply" />
      )}
      <TextAreaField
        name="content"
        label={mode === 'analyst' ? 'Add to the investigation' : 'Reply to the investigation team'}
        rows={4}
        required
        maxLength={5000}
        hint={mode === 'reporter' ? 'Your reply is visible to the security team.' : 'Internal entries are hidden from the reporter.'}
      />
      <SubmitButton pendingLabel="Saving…">{mode === 'analyst' ? 'Add entry' : 'Send reply'}</SubmitButton>
    </ActionForm>
  );
}
