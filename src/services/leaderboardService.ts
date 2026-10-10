import { getSupabase, getSupabaseConfigStatus } from '../lib/supabase';

export interface LeaderboardEntry {
  id: string;
  matchId: string;
  playerId?: string | null;
  playerName: string;
  score: number;
  totalXp: number;
  accuracy: number;
  maxCombo: number;
  puzzlesSolved: number;
  totalQuestions: number;
  grade: 'S' | 'A' | 'B' | 'C' | string;
  createdAt: string;
  rank?: number;
}

export interface LeaderboardResult {
  success: boolean;
  entries: LeaderboardEntry[];
  totalCount: number;
  errorMessage?: string;
  mode: 'online' | 'offline_unconfigured';
}

/**
 * Memetakan baris database match_results ke model data aplikasi LeaderboardEntry
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapRowToLeaderboardEntry = (row: any, index: number): LeaderboardEntry => ({
  id: String(row.id || ''),
  matchId: String(row.match_id || ''),
  playerId: row.player_id || null,
  playerName: String(row.player_name || 'Anonim'),
  score: Number(row.score ?? 0),
  totalXp: Number(row.total_xp ?? 0),
  accuracy: Number(row.accuracy ?? 0),
  maxCombo: Number(row.max_combo ?? 0),
  puzzlesSolved: Number(row.puzzles_solved ?? 15),
  totalQuestions: Number(row.total_questions ?? 15),
  grade: (row.grade as 'S' | 'A' | 'B' | 'C') || 'C',
  createdAt: String(row.created_at || new Date().toISOString()),
  rank: index + 1,
});

/**
 * Mengambil data Leaderboard publik dari tabel public.match_results
 * Urutan baku:
 * 1. score DESC (Skor tertinggi)
 * 2. accuracy DESC (Akurasi tertinggi)
 * 3. created_at ASC (Siapa yang mencapainya lebih dulu)
 *
 * @param limit Batas jumlah data yang diambil (default 10 atau 50)
 */
export const fetchLeaderboard = async (limit: number = 10): Promise<LeaderboardResult> => {
  const configStatus = getSupabaseConfigStatus();
  if (!configStatus.isConfigured) {
    return {
      success: true,
      entries: [],
      totalCount: 0,
      mode: 'offline_unconfigured',
      errorMessage: 'Koneksi Supabase belum dikonfigurasi di environment. Berjalan dalam mode lokal.',
    };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return {
      success: false,
      entries: [],
      totalCount: 0,
      mode: 'offline_unconfigured',
      errorMessage: 'Inisialisasi klien Supabase tidak dapat dilakukan.',
    };
  }

  try {
    const safeLimit = Math.max(1, Math.min(100, limit));

    // READ ONLY: Hanya menjalankan query SELECT dari public.match_results
    const { data, error, count } = await supabase
      .from('match_results')
      .select(
        'id, match_id, player_id, player_name, score, total_xp, accuracy, max_combo, puzzles_solved, total_questions, grade, created_at',
        { count: 'exact' }
      )
      .order('score', { ascending: false })
      .order('accuracy', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(safeLimit);

    if (error) {
      console.warn('[LeaderboardService] Query error:', error.message);
      return {
        success: false,
        entries: [],
        totalCount: 0,
        mode: 'online',
        errorMessage: `Gagal membaca leaderboard: ${error.message}`,
      };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        entries: [],
        totalCount: count ?? 0,
        mode: 'online',
      };
    }

    const entries: LeaderboardEntry[] = data.map((row, index) =>
      mapRowToLeaderboardEntry(row, index)
    );

    return {
      success: true,
      entries,
      totalCount: count ?? entries.length,
      mode: 'online',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gangguan koneksi jaringan ke database.';
    console.warn('[LeaderboardService] Network/Exception error:', errorMsg);
    return {
      success: false,
      entries: [],
      totalCount: 0,
      mode: 'online',
      errorMessage: errorMsg,
    };
  }
};

/**
 * Helper spesifik untuk mengambil Top 10 Skor Global
 */
export const fetchTop10Leaderboard = async (): Promise<LeaderboardResult> => {
  return fetchLeaderboard(10);
};

/**
 * Helper spesifik untuk mengambil Top 50 Skor Global
 */
export const fetchTop50Leaderboard = async (): Promise<LeaderboardResult> => {
  return fetchLeaderboard(50);
};
