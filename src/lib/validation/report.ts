import { z } from 'zod';
import { SEVERITIES, STATUSES } from '@/lib/constants';
import { dateInput, emptyToUndefined, optionalText } from './common';

export const reportFilterSchema = z.object({
  from: dateInput,
  to: dateInput,
  category: optionalText(40),
  severity: z.preprocess(emptyToUndefined, z.enum(SEVERITIES as [string, ...string[]]).optional()),
  status: z.preprocess(emptyToUndefined, z.enum(STATUSES as [string, ...string[]]).optional()),
});
export type ReportFilters = z.infer<typeof reportFilterSchema>;
