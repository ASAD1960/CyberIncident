import { Download, FileText, Trash2 } from 'lucide-react';
import { deleteEvidenceAction } from '@/actions/evidence';
import { formatBytes, formatDateTime } from '@/lib/utils';
import { EvidenceUploadForm } from './evidence-upload-form';
import type { EvidenceItem } from '@/types';

export function EvidencePanel({
  incidentId,
  items,
  canUpload,
  canDelete,
  maxFileSizeMb,
}: {
  incidentId: string;
  items: EvidenceItem[];
  canUpload: boolean;
  canDelete: boolean;
  maxFileSizeMb: number;
}) {
  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-sm text-muted">No files attached.</p>
      ) : (
        <ul className="divide-y divide-line rounded-md border border-line">
          {items.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-3 p-3">
              <FileText className="h-5 w-5 shrink-0 text-muted" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{e.original_filename}</p>
                <p className="text-xs text-muted">
                  {formatBytes(e.file_size)} · {e.uploader?.full_name ?? 'Unknown'} · {formatDateTime(e.uploaded_at)}
                </p>
                <p className="truncate font-mono text-[11px] text-muted" title={e.sha256_hash}>
                  SHA-256 {e.sha256_hash}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Plain link: the route authorizes, audits, and redirects to a 60-second signed URL. */}
                <a
                  href={`/api/evidence/${e.id}/download`}
                  className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-xs font-semibold hover:bg-paper"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden /> Download
                </a>
                {canDelete && (
                  <form action={deleteEvidenceAction}>
                    <input type="hidden" name="evidenceId" value={e.id} />
                    <input type="hidden" name="incidentId" value={incidentId} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-md border border-danger/40 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger-soft"
                      aria-label={`Delete ${e.original_filename}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {canUpload && <EvidenceUploadForm incidentId={incidentId} maxFileSizeMb={maxFileSizeMb} />}
      <p className="text-xs text-muted">
        Files are untrusted. They are stored privately, never opened by the system, and always download as attachments.
      </p>
    </div>
  );
}
