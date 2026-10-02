import { createClient } from '@supabase/supabase-js';
import { UserCloudData } from '../types.ts';

// Supabase configuration provided by the user
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xlslxcdevxjxenywenll.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_MZdHY7zSyGZ1akXzI-2Ckg_qnhGvj5L';

// Initialize the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Save user's egg arat dataset snapshot directly into Supabase
 */
export async function saveToSupabaseCloud(userId: string, data: UserCloudData): Promise<boolean> {
  try {
    const totalRecords = (data.parties?.length || 0) + (data.memos?.length || 0) + (data.suppliers?.length || 0) + (data.supplierChalans?.length || 0) + (data.expenses?.length || 0);

    const { error } = await supabase
      .from('arat_backups')
      .upsert({
        user_id: userId,
        data_json: JSON.stringify(data),
        total_records: totalRecords,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      // If arat_backups table doesn't exist yet, we catch gracefully
      console.warn('Supabase upsert notice:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Supabase save error:', err);
    return false;
  }
}

/**
 * Fetch latest dataset from Supabase
 */
export async function fetchFromSupabaseCloud(userId: string): Promise<UserCloudData | null> {
  try {
    const { data, error } = await supabase
      .from('arat_backups')
      .select('data_json')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data || !data.data_json) {
      return null;
    }

    return JSON.parse(data.data_json) as UserCloudData;
  } catch (err) {
    console.warn('Supabase fetch error:', err);
    return null;
  }
}
