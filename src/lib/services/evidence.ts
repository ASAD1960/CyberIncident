import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { EVIDENCE_BUCKET, SIGNED_URL_TTL_SECONDS } from '@/lib/constants';
import { canAddEvidence, canDeleteEvidence } from '@/lib/auth/permissions';
import { generateStoragePath, validateEvidenceFile } from '@/lib/security/files';
import { sha256Hex } from '@/lib/security/hash';
import type { SessionUser } from '@/lib/auth/session';
import type { EvidenceItem } from '@/types';
import { ServiceError, fromSupabaseError } from './errors';
import { writeAudit } from './audit';
import { getSettings } from './settings';

const EVIDENCE_SELECT = '*, uploader:profiles!evidence_uploader_id_fkey(id, full_name)';

/** RLS decides which rows come back (admins only when the access policy allows it). */
export async function listEvidence(incidentId: string): Promise<EvidenceItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('evidence')
    .select(EVIDENCE_SELECT)
    .eq('incident_id', incidentId)
    .order('uploaded_at', { ascending: false });
  if (error) throw fromSupabaseError(error);
  return (data ?? []) as EvidenceItem[];
}

/**
 * Validates and stores one evidence file:
 * 1. authorize against the incident (visible through RLS + permission rule)
 * 2. validate size / extension / signature, compute SHA-256
 * 3. upload to the PRIVATE bucket under a server-generated path
 * 4. insert the metadata row as the user (RLS re-checks); roll back the object on failure
 * The audit entry is written by a database trigger on insert.
 */
export async function uploadEvidence(user: SessionUser, incidentId: string, file: File): Promise<EvidenceItem> {
  const supabase = await createClient();
  const { data: incident } = await supabase
    .from('incidents')
    .select('id, reporter_id, status')
    .eq('id', incidentId)
    .maybeSingle();
  if (!incident) throw new ServiceError('NOT_FOUND', 'Incident not found.');
  if (!canAddEvidence({ id: user.id, role: user.profile.role }, incident)) {
    await writeAudit({
      actorId: user.id,
      action: 'access.denied',
      entityType: 'incident',
      entityId: incidentId,
      outcome: 'denied',
      metadata: { operation: 'evidence_upload' },
    });
    throw new ServiceError('NOT_AUTHORIZED', 'You cannot add evidence to this incident.');
  }

  const settings = await getSettings();
  const valid = await validateEvidenceFile(file, settings.maxFileSizeMb);
  const hash = sha256Hex(valid.bytes);
  const path = generateStoragePath(incidentId, valid.extension);

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage.from(EVIDENCE_BUCKET).upload(path, valid.bytes, {
    contentType: valid.mimeType,
    upsert: false,
    cacheControl: '0',
  });
  if (uploadError) {
    console.error('[evidence] upload failed:', uploadError.message);
    throw new ServiceError('INTERNAL', `"${valid.displayName}" could not be saved. Please try again.`);
  }

  const { data, error } = await supabase
    .from('evidence')
    .insert({
      incident_id: incidentId,
      uploader_id: user.id,
      storage_path: path,
      original_filename: valid.displayName,
      mime_type: valid.mimeType,
      file_size: valid.bytes.length,
      sha256_hash: hash,
    })
    .select(EVIDENCE_SELECT)
    .single();

  if (error) {
    await admin.storage.from(EVIDENCE_BUCKET).remove([path]); // never leave orphaned files
    throw fromSupabaseError(error);
  }
  return data as EvidenceItem;
}

/**
 * Authorizes a download (RLS must return the row), logs it, and returns a short-lived signed URL
 * that forces an attachment download. Also re-hashes nothing on the hot path; integrity checks are
 * available through verifyEvidenceIntegrity().
 */
export async function createDownloadUrl(user: SessionUser, evidenceId: string): Promise<string> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from('evidence')
    .select('id, incident_id, storage_path, original_filename, sha256_hash')
    .eq('id', evidenceId)
    .maybeSingle();

  if (!row) {
    await writeAudit({
      actorId: user.id,
      action: 'access.denied',
      entityType: 'evidence',
      entityId: evidenceId,
      outcome: 'denied',
      metadata: { operation: 'evidence_download' },
    });
    throw new ServiceError('NOT_FOUND', 'Evidence not found.');
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(EVIDENCE_BUCKET)
    .createSignedUrl(row.storage_path, SIGNED_URL_TTL_SECONDS, { download: row.original_filename });
  if (error || !data?.signedUrl) {
    console.error('[evidence] signed url failed:', error?.message);
    throw new ServiceError('INTERNAL', 'The file could not be retrieved. Please try again.');
  }

  await writeAudit({
    actorId: user.id,
    action: 'evidence.downloaded',
    entityType: 'evidence',
    entityId: row.id,
    metadata: { incident_id: row.incident_id, sha256: row.sha256_hash },
  });
  return data.signedUrl;
}

/** Re-downloads the stored object and compares it to the recorded SHA-256 (FR-32). */
export async function verifyEvidenceIntegrity(evidenceId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from('evidence')
    .select('storage_path, sha256_hash')
    .eq('id', evidenceId)
    .maybeSingle();
  if (!row) throw new ServiceError('NOT_FOUND', 'Evidence not found.');

  const admin = createAdminClient();
  const { data: blob, error } = await admin.storage.from(EVIDENCE_BUCKET).download(row.storage_path);
  if (error || !blob) throw new ServiceError('INTERNAL', 'The stored file could not be read.');
  return sha256Hex(Buffer.from(await blob.arrayBuffer())) === row.sha256_hash;
}

export async function deleteEvidence(user: SessionUser, evidenceId: string): Promise<void> {
  if (!canDeleteEvidence(user.profile.role)) {
    throw new ServiceError('NOT_AUTHORIZED', 'Only analysts can delete evidence.');
  }
  const supabase = await createClient();
  const { data: row } = await supabase.from('evidence').select('id, storage_path').eq('id', evidenceId).maybeSingle();
  if (!row) throw new ServiceError('NOT_FOUND', 'Evidence not found.');

  // Delete the row first (RLS + audit trigger), then the object.
  const { error } = await supabase.from('evidence').delete().eq('id', evidenceId);
  if (error) throw fromSupabaseError(error);

  const admin = createAdminClient();
  const { error: removeError } = await admin.storage.from(EVIDENCE_BUCKET).remove([row.storage_path]);
  if (removeError) console.error('[evidence] object removal failed:', removeError.message);
}
