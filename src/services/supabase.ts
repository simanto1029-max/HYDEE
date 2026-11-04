import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'hydee_supabase_url';
const STORAGE_KEY_ANON = 'hydee_supabase_anon_key';

export const getSupabaseConfig = () => {
  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null;
  const storedAnon = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ANON) : null;

  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envAnon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  const url = (storedUrl && storedUrl.trim()) || envUrl || '';
  const anonKey = (storedAnon && storedAnon.trim()) || envAnon || '';

  const isConfigured = Boolean(
    url &&
    anonKey &&
    url !== 'https://your-project.supabase.co' &&
    !url.includes('placeholder')
  );

  return {
    url,
    anonKey,
    isConfigured,
    source: (storedUrl && storedAnon) ? ('admin_saved' as const) : envUrl ? ('env' as const) : ('none' as const),
  };
};

const initialConfig = getSupabaseConfig();

export let isSupabaseConfigured = initialConfig.isConfigured;
export let supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(initialConfig.url, initialConfig.anonKey)
  : null;

export const saveSupabaseConfig = (url: string, anonKey: string): boolean => {
  if (typeof window !== 'undefined') {
    const cleanUrl = url.trim();
    const cleanAnon = anonKey.trim();

    if (cleanUrl) {
      localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
    } else {
      localStorage.removeItem(STORAGE_KEY_URL);
    }

    if (cleanAnon) {
      localStorage.setItem(STORAGE_KEY_ANON, cleanAnon);
    } else {
      localStorage.removeItem(STORAGE_KEY_ANON);
    }

    const cfg = getSupabaseConfig();
    isSupabaseConfigured = cfg.isConfigured;
    supabase = cfg.isConfigured ? createClient(cfg.url, cfg.anonKey) : null;
    return cfg.isConfigured;
  }
  return false;
};

export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, message: 'Supabase URL or Anon Public Key is missing or invalid.' };
  }
  try {
    const { data, error } = await supabase.from('categories').select('id, name').limit(1);
    if (error) {
      return { success: false, message: `Database query failed: ${error.message}` };
    }
    return {
      success: true,
      message: `Connection verified successfully! Found ${data ? data.length : 0} category row(s).`,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Unknown network error connecting to Supabase.' };
  }
};
