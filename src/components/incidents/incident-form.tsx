'use client';

import { createIncidentAction } from '@/actions/incidents';
import { ActionForm } from '@/components/forms/action-form';
import { FileField, SelectField, TextAreaField, TextField } from '@/components/forms/fields';
import { SubmitButton } from '@/components/ui/submit-button';
import { ALLOWED_EVIDENCE_TYPES, MAX_FILES_PER_UPLOAD, SEVERITIES, SEVERITY_LABELS } from '@/lib/constants';

export function IncidentForm({
  categories,
  idempotencyKey,
  maxFileSizeMb,
}: {
  categories: { key: string; label: string }[];
  idempotencyKey: string;
  maxFileSizeMb: number;
}) {
  return (
    <ActionForm action={createIncidentAction} encType="multipart/form-data" className="space-y-5">
      {/* A retry of the same form submission resolves to the same incident (NFR-21). */}
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      <TextField name="title" label="What happened?" hint="A short summary, for example “Suspicious sign-in from another country”." required maxLength={150} />
      <TextAreaField
        name="description"
        label="Details"
        hint="Include what you saw, when you noticed it, and what you did next. Never paste passwords or secrets."
        required
        rows={6}
        maxLength={5000}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          name="category"
          label="Category"
          required
          placeholder="Choose a category"
          options={categories.map((c) => ({ value: c.key, label: c.label }))}
        />
        <SelectField
          name="severity"
          label="How urgent does it feel?"
          hint="Analysts review this and may change it."
          required
          defaultValue="medium"
          options={SEVERITIES.map((s) => ({ value: s, label: SEVERITY_LABELS[s] }))}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="affectedAsset" label="Affected system or account" hint="Optional. For example a laptop name, app, or email address." maxLength={200} />
        <TextField name="occurredAt" label="When did it happen (UTC)?" type="datetime-local" hint="Optional. Leave blank if you are not sure." />
      </div>
      <FileField
        name="evidence"
        label="Supporting files"
        hint={`Optional. Up to ${MAX_FILES_PER_UPLOAD} files, ${maxFileSizeMb} MB each. Allowed: ${Object.keys(ALLOWED_EVIDENCE_TYPES).join(' ')}`}
        accept={Object.keys(ALLOWED_EVIDENCE_TYPES).join(',')}
      />
      <div className="flex items-center gap-3">
        <SubmitButton pendingLabel="Submitting report…">Submit report</SubmitButton>
      </div>
    </ActionForm>
  );
}
