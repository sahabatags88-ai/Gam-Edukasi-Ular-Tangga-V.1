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

export const getSupabaseUrl = (): string => supabaseUrl;

export type SupabaseConfigDetail =
  | 'not_configured'
  | 'missing_url'
  | 'missing_key'
  | 'invalid_url_format'
  | 'configured';

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasKey: boolean;
  urlHost?: string;
  detail: SupabaseConfigDetail;
  message: string;
}

/**
 * Memeriksa apakah konfigurasi Supabase tersedia di environment dan valid secara format
 */
export const getSupabaseConfigStatus = (): SupabaseConfigStatus => {
  const hasUrlRaw = Boolean(supabaseUrl && supabaseUrl.length > 0);
  const isHttpsUrl = Boolean(supabaseUrl && (supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://localhost')));
  const hasKey = Boolean(supabaseKey && supabaseKey.length > 10);
  let urlHost: string | undefined;

  if (isHttpsUrl) {
    try {
      urlHost = new URL(supabaseUrl).host;
    } catch {
      urlHost = undefined;
    }
  }

  if (!hasUrlRaw && !hasKey) {
    return {
      isConfigured: false,
      hasUrl: false,
      hasKey: false,
      detail: 'not_configured',
      message: 'Variabel lingkungan Supabase (VITE_SUPABASE_URL & VITE_SUPABASE_PUBLISHABLE_KEY) belum terpasang.',
    };
  }

  if (!hasUrlRaw) {
    return {
      isConfigured: false,
      hasUrl: false,
      hasKey: true,
      detail: 'missing_url',
      message: 'VITE_SUPABASE_URL belum terpasang di environment.',
    };
  }

  if (!isHttpsUrl) {
    return {
      isConfigured: false,
      hasUrl: true,
      hasKey,
      detail: 'invalid_url_format',
      message: 'Format VITE_SUPABASE_URL tidak valid (harus dimulai dengan https://).',
    };
  }

  if (!hasKey) {
    return {
      isConfigured: false,
      hasUrl: true,
      hasKey: false,
      urlHost,
      detail: 'missing_key',
      message: 'VITE_SUPABASE_PUBLISHABLE_KEY belum terpasang atau terlalu pendek.',
    };
  }

  return {
    isConfigured: true,
    hasUrl: true,
    hasKey: true,
    urlHost,
    detail: 'configured',
    message: 'Konfigurasi environment Supabase tersedia.',
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
