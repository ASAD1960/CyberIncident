import 'server-only';
import { randomUUID } from 'node:crypto';
import { ALLOWED_EVIDENCE_TYPES, HARD_MAX_FILE_MB } from '@/lib/constants';
import { ServiceError } from '@/lib/services/errors';

export interface ValidatedFile {
  bytes: Buffer;
  mimeType: string;
  extension: string;
  displayName: string;
}

const SIGNATURES: Record<string, number[]> = {
  '.pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
  '.png': [0x89, 0x50, 0x4e, 0x47],
  '.jpg': [0xff, 0xd8, 0xff],
  '.jpeg': [0xff, 0xd8, 0xff],
};
const TEXT_TYPES = new Set(['.txt', '.log', '.csv', '.json', '.eml']);

/** Strip path components and control characters from a user-supplied filename (display only). */
export function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'file';
  // eslint-disable-next-line no-control-regex
  const cleaned = base.replace(/[\u0000-\u001f\u007f<>:"|?*]/g, '').trim();
  return (cleaned || 'file').slice(0, 200);
}

/** Server-generated storage key. User-provided names are never used as paths (SRD 8.2). */
export function generateStoragePath(incidentId: string, extension: string): string {
  return `incidents/${incidentId}/${randomUUID()}${extension}`;
}

/**
 * Validates size, extension allow-list and content signature. Files are treated as
 * untrusted: they are stored privately, never executed, and served as attachments only.
 */
export async function validateEvidenceFile(file: File, maxMb: number): Promise<ValidatedFile> {
  const limitMb = Math.min(maxMb, HARD_MAX_FILE_MB);
  const displayName = sanitizeFilename(file.name);
  const dot = displayName.lastIndexOf('.');
  const extension = dot >= 0 ? displayName.slice(dot).toLowerCase() : '';

  if (file.size === 0) throw new ServiceError('VALIDATION', `"${displayName}" is empty.`);
  if (file.size > limitMb * 1024 * 1024) {
    throw new ServiceError('VALIDATION', `"${displayName}" is larger than the ${limitMb} MB limit.`);
  }
  const mimeType = ALLOWED_EVIDENCE_TYPES[extension];
  if (!mimeType) {
    throw new ServiceError(
      'VALIDATION',
      `"${displayName}" has an unsupported file type. Allowed: ${Object.keys(ALLOWED_EVIDENCE_TYPES).join(', ')}.`,
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  const signature = SIGNATURES[extension];
  if (signature && !signature.every((b, i) => bytes[i] === b)) {
    throw new ServiceError('VALIDATION', `"${displayName}" does not match its file extension.`);
  }
  if (TEXT_TYPES.has(extension) && bytes.subarray(0, 8192).includes(0)) {
    throw new ServiceError('VALIDATION', `"${displayName}" contains binary data and is not a valid text file.`);
  }

  return { bytes, mimeType, extension, displayName };
}
