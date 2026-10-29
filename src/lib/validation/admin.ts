import { z } from 'zod';
import { ROLES } from '@/lib/constants';
import { uuid } from './common';

export const updateUserSchema = z.object({
  userId: uuid,
  role: z.enum(ROLES as [string, ...string[]], { errorMap: () => ({ message: 'Choose a role.' }) }),
  status: z.enum(['active', 'inactive']),
});

export const settingsSchema = z.object({
  adminEvidenceAccess: z.preprocess((v) => v === 'on' || v === 'true', z.boolean()),
  maxFileSizeMb: z.coerce.number().int('Enter a whole number.').min(1, 'Minimum is 1 MB.').max(10, 'Maximum is 10 MB.'),
});

export const categoryToggleSchema = z.object({
  key: z.string().regex(/^[a-z_]{2,40}$/),
  active: z.enum(['true', 'false']).transform((v) => v === 'true'),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(1, 'Enter your name.').max(120, 'Keep your name to 120 characters or fewer.'),
  notifyStatusUpdates: z.preprocess((v) => v === 'on' || v === 'true', z.boolean()),
});

export const auditFilterSchema = z.object({
  action: z.preprocess((v) => (v === '' ? undefined : v), z.string().max(60).optional()),
  outcome: z.preprocess((v) => (v === '' ? undefined : v), z.enum(['success', 'failure', 'denied']).optional()),
  from: z.preprocess((v) => (v === '' ? undefined : v), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  to: z.preprocess((v) => (v === '' ? undefined : v), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  page: z.preprocess((v) => (v === '' ? undefined : v), z.coerce.number().int().min(1).max(10000).default(1)),
});
export type AuditFilters = z.infer<typeof auditFilterSchema>;
