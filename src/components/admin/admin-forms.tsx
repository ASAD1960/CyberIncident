'use client';

import { updateProfileAction, updateSettingsAction, updateUserAction } from '@/actions/admin';
import { ActionForm } from '@/components/forms/action-form';
import { CheckboxField, SelectField, TextField } from '@/components/forms/fields';
import { SubmitButton } from '@/components/ui/submit-button';
import { ROLES, ROLE_LABELS } from '@/lib/constants';
import type { AppSettings, Profile } from '@/types';

export function UserAccessForm({ user }: { user: Profile }) {
  return (
    <ActionForm action={updateUserAction} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <input type="hidden" name="userId" value={user.id} />
      <SelectField
        name="role"
        label="Role"
        defaultValue={user.role}
        options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
      />
      <SelectField
        name="status"
        label="Account"
        defaultValue={user.account_status}
        options={[
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]}
      />
      <SubmitButton variant="secondary">Save</SubmitButton>
    </ActionForm>
  );
}

export function SettingsForm({ settings }: { settings: AppSettings }) {
  return (
    <ActionForm action={updateSettingsAction} className="space-y-5">
      <CheckboxField
        name="adminEvidenceAccess"
        label="Let administrators open evidence files"
        hint="Off by default. When off, only analysts and the original reporter can see or download evidence."
        defaultChecked={settings.adminEvidenceAccess}
      />
      <div className="max-w-xs">
        <TextField
          name="maxFileSizeMb"
          label="Largest allowed file (MB)"
          type="number"
          defaultValue={String(settings.maxFileSizeMb)}
          hint="Between 1 and 10."
          required
        />
      </div>
      <SubmitButton>Save settings</SubmitButton>
    </ActionForm>
  );
}

export function ProfileForm({ profile }: { profile: Profile }) {
  return (
    <ActionForm action={updateProfileAction} className="max-w-md space-y-5">
      <TextField name="fullName" label="Full name" defaultValue={profile.full_name} autoComplete="name" required maxLength={120} />
      <div>
        <p className="label">Email</p>
        <p className="text-sm">{profile.email}</p>
        <p className="hint">Your email is managed by your sign-in account.</p>
      </div>
      <CheckboxField
        name="notifyStatusUpdates"
        label="Tell me when an incident’s status changes"
        hint="Assignments and information requests always notify you."
        defaultChecked={profile.notify_status_updates}
      />
      <SubmitButton>Save profile</SubmitButton>
    </ActionForm>
  );
}
