import { z } from 'zod';
import { SEVERITIES, STATUSES, MAX_FILES_PER_UPLOAD } from '@/lib/constants';
import { dateInput, emptyToUndefined, optionalText, uuid } from './common';

export const createIncidentSchema = z.object({
  title: z.string().trim().min(5, 'Enter at least 5 characters.').max(150, 'Keep the title to 150 characters or fewer.'),
  description: z
    .string()
    .trim()
    .min(20, 'Describe what happened in at least 20 characters.')
    .max(5000, 'Keep the description to 5,000 characters or fewer.'),
  category: z.string().trim().min(1, 'Choose a category.').max(40),
  severity: z.enum(SEVERITIES as [string, ...string[]], { errorMap: () => ({ message: 'Choose an urgency level.' }) }),
  affectedAsset: optionalText(200, 'Affected system'),
  occurredAt: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Enter a valid date and time.')
      .refine((v) => !Number.isNaN(Date.parse(`${v}:00Z`)), 'Enter a valid date and time.')
      .refine((v) => Date.parse(`${v}:00Z`) <= Date.now() + 5 * 60_000, 'The incident cannot have occurred in the future.')
      .optional(),
  ),
  idempotencyKey: uuid,
});
export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;

export const transitionSchema = z.object({
  incidentId: uuid,
  toStatus: z.enum(STATUSES as [string, ...string[]], { errorMap: () => ({ message: 'Choose a status.' }) }),
  summary: optionalText(3000, 'Resolution summary'),
  reason: optionalText(500, 'Reason'),
});

export const assignSchema = z.object({
  incidentId: uuid,
  assigneeId: z.string().uuid('Choose an investigator.'),
});

export const severitySchema = z.object({
  incidentId: uuid,
  severity: z.enum(SEVERITIES as [string, ...string[]], { errorMap: () => ({ message: 'Choose a severity.' }) }),
  reason: optionalText(500, 'Reason'),
});

export const noteSchema = z.object({
  incidentId: uuid,
  kind: z.enum(['note', 'finding', 'remediation', 'info_request', 'reporter_reply']),
  content: z.string().trim().min(1, 'Enter some text.').max(5000, 'Keep notes to 5,000 characters or fewer.'),
});

export const evidenceUploadSchema = z.object({
  incidentId: uuid,
});
export { MAX_FILES_PER_UPLOAD };

export const incidentFilterSchema = z.object({
  q: optionalText(100),
  category: optionalText(40),
  severity: z.preprocess(emptyToUndefined, z.enum(SEVERITIES as [string, ...string[]]).optional()),
  status: z.preprocess(emptyToUndefined, z.enum(STATUSES as [string, ...string[]]).optional()),
  assignee: z.preprocess(emptyToUndefined, z.union([uuid, z.literal('unassigned')]).optional()),
  from: dateInput,
  to: dateInput,
  sort: z.preprocess(emptyToUndefined, z.enum(['created_at', 'updated_at', 'severity', 'status']).default('created_at')),
  dir: z.preprocess(emptyToUndefined, z.enum(['asc', 'desc']).default('desc')),
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(10000).default(1)),
});
export type IncidentFilters = z.infer<typeof incidentFilterSchema>;
