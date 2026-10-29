import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { HARD_MAX_FILE_MB } from '@/lib/constants';
import { fromSupabaseError } from './errors';
import type { AppSettings, Category } from '@/types';

export const getSettings = cache(async (): Promise<AppSettings> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from('app_settings').select('key, value');
  if (error) throw fromSupabaseError(error);

  const map = new Map((data ?? []).map((r: { key: string; value: unknown }) => [r.key, r.value]));
  const max = Number(map.get('max_file_size_mb') ?? 10);
  return {
    adminEvidenceAccess: map.get('admin_evidence_access') === true,
    maxFileSizeMb: Number.isFinite(max) ? Math.min(Math.max(max, 1), HARD_MAX_FILE_MB) : 10,
  };
});

export const getCategories = cache(async (opts: { includeInactive?: boolean } = {}): Promise<Category[]> => {
  const supabase = await createClient();
  let query = supabase.from('incident_categories').select('*').order('sort_order');
  if (!opts.includeInactive) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) throw fromSupabaseError(error);
  return (data ?? []) as Category[];
});

export async function updateSettings(userId: string, input: AppSettings): Promise<void> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const rows = [
    { key: 'admin_evidence_access', value: input.adminEvidenceAccess },
    { key: 'max_file_size_mb', value: input.maxFileSizeMb },
  ];
  for (const row of rows) {
    const { error } = await supabase
      .from('app_settings')
      .update({ value: row.value, updated_by: userId, updated_at: now })
      .eq('key', row.key);
    if (error) throw fromSupabaseError(error);
  }
}

export async function setCategoryActive(key: string, active: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('incident_categories').update({ is_active: active }).eq('key', key);
  if (error) throw fromSupabaseError(error);
}
