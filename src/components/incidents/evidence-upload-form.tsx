'use client';

import { uploadEvidenceAction } from '@/actions/evidence';
import { ActionForm } from '@/components/forms/action-form';
import { FileField } from '@/components/forms/fields';
import { SubmitButton } from '@/components/ui/submit-button';
import { ALLOWED_EVIDENCE_TYPES, MAX_FILES_PER_UPLOAD } from '@/lib/constants';

export function EvidenceUploadForm({ incidentId, maxFileSizeMb }: { incidentId: string; maxFileSizeMb: number }) {
  return (
    <ActionForm action={uploadEvidenceAction} encType="multipart/form-data" className="space-y-3">
      <input type="hidden" name="incidentId" value={incidentId} />
      <FileField
        name="evidence"
        label="Add files"
        hint={`Up to ${MAX_FILES_PER_UPLOAD} files, ${maxFileSizeMb} MB each. Allowed: ${Object.keys(ALLOWED_EVIDENCE_TYPES).join(' ')}`}
        accept={Object.keys(ALLOWED_EVIDENCE_TYPES).join(',')}
      />
      <SubmitButton variant="secondary" pendingLabel="Uploading…">Upload files</SubmitButton>
    </ActionForm>
  );
}
