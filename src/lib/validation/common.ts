import { z } from 'zod';

/** Empty strings from HTML forms become undefined so optional() works as expected. */
export const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

export const optionalText = (max: number, label = 'This field') =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max, `${label} must be ${max} characters or fewer.`).optional());

export const uuid = z.string().uuid('Invalid identifier.');

export const dateInput = z.preprocess(
  emptyToUndefined,
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD.').optional(),
);
