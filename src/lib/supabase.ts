import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Baca konfigurasi melalui import.meta.env (Vite) atau process.env (fallback/test)
// Mendukung VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY atau VITE_SUPABASE_ANON_KEY
const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta && import.meta.env) {
    const val = import.meta.env[key];
    if (val) return String(val);
  }
  if (typeof process !== 'undefined' && process && process.env) {
    const val = process.env[key];
    if (val) return String(val);
  }
  return '';
};

const supabaseUrl = (getEnvVar('VITE_SUPABASE_URL') || '').trim();
const supabaseKey = (
  getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY') ||
  getEnvVar('VITE_SUPABASE_ANON_KEY') ||
  ''
).trim();

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasKey: boolean;
  urlHost?: string;
}

/**
 * Memeriksa apakah konfigurasi Supabase tersedia di environment
 */
export const getSupabaseConfigStatus = (): SupabaseConfigStatus => {
  const hasUrl = Boolean(supabaseUrl && supabaseUrl.startsWith('https://'));
  const hasKey = Boolean(supabaseKey && supabaseKey.length > 10);
  let urlHost: string | undefined;

  if (hasUrl) {
    try {
      urlHost = new URL(supabaseUrl).host;
    } catch {
      urlHost = undefined;
    }
  }

  return {
    isConfigured: hasUrl && hasKey,
    hasUrl,
    hasKey,
    urlHost,
  };
};

let clientInstance: SupabaseClient | null = null;

/**
 * Mendapatkan instance SupabaseClient jika konfigurasi tersedia.
 * Mengembalikan null jika konfigurasi belum diisi, sehingga aplikasi aman berjalan luring (mode lokal).
 */
export const getSupabase = (): SupabaseClient | null => {
  if (clientInstance) {
    return clientInstance;
  }

  const { isConfigured } = getSupabaseConfigStatus();
  if (!isConfigured) {
    return null;
  }

  try {
    clientInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return clientInstance;
  } catch (err) {
    console.warn('[Supabase] Gagal menginisialisasi klien Supabase:', err);
    return null;
  }
};
