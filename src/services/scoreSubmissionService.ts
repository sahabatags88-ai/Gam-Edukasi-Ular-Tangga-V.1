import { getSupabase, getSupabaseConfigStatus } from '../lib/supabase';
import { getPerformanceGrade } from '../utils/scoreEngine';
import { GameStats } from '../types/game';

export interface ScoreSubmissionPayload {
  match_id: string;
  player_id?: string | null;
  player_name: string;
  score: number;
  total_xp: number;
  accuracy: number;
  max_combo: number;
  puzzles_solved: number;
  total_questions: number;
  grade: 'S' | 'A' | 'B' | 'C' | string;
}

export type ScoreSubmissionStatus =
  | 'idle'
  | 'submitting'
  | 'synced'
  | 'failed'
  | 'offline_unconfigured'
  | 'duplicate_ignored';

export interface ScoreSubmissionResult {
  status: ScoreSubmissionStatus;
  success: boolean;
  message: string;
  matchId: string;
  error?: string;
  details?: unknown;
}

/**
 * Menghasilkan match_id unik yang terikat pada sesi pertandingan saat ini.
 * Format standar: `aq-<timestamp>-<random-hex>`
 * Jika matchId sudah ada, kembalikan yang sama agar bersifat idempoten saat retry.
 */
export const generateMatchId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `aq-${timestamp}-${randomPart}`;
};

/**
 * Mempersiapkan payload valid yang sesuai dengan kontrak backend submit-match-result
 */
export const buildSubmissionPayload = (
  matchId: string,
  playerName: string,
  stats: GameStats,
  puzzlesSolved: number,
  missionTotal: number = 15,
  playerId?: string | null
): ScoreSubmissionPayload => {
  const totalQuestions = stats.totalQuestionsAnswered > 0 ? stats.totalQuestionsAnswered : puzzlesSolved;
  const accuracyNum = totalQuestions > 0 ? Math.round((stats.correctAnswers / totalQuestions) * 100) : 100;
  const gradeInfo = getPerformanceGrade(stats.score, accuracyNum, stats.maxCombo);

  return {
    match_id: matchId,
    player_id: playerId || null,
    player_name: (playerName || 'Siswa').trim().slice(0, 30),
    score: Math.max(0, Math.min(25000, Math.round(stats.score))),
    total_xp: Math.max(0, Math.min(25000, Math.round(stats.score))),
    accuracy: Math.max(0, Math.min(100, accuracyNum)),
    max_combo: Math.max(0, Math.min(30, stats.maxCombo)),
    puzzles_solved: Math.max(15, puzzlesSolved),
    total_questions: Math.max(puzzlesSolved, totalQuestions),
    grade: gradeInfo.grade,
  };
};

/**
 * Mengirim hasil kemenangan pertandingan ke Supabase Edge Function `submit-match-result`
 * Menggunakan Supabase client yang sudah terkonfigurasi.
 * Jika offline / belum dikonfigurasi, fungsi gagal secara aman tanpa melempar unhandled exception.
 */
export const submitMatchResult = async (
  payload: ScoreSubmissionPayload
): Promise<ScoreSubmissionResult> => {
  const config = getSupabaseConfigStatus();

  // Mode offline atau kredensial Supabase belum disetup
  if (!config.isConfigured) {
    return {
      status: 'offline_unconfigured',
      success: false,
      matchId: payload.match_id,
      message: 'Mode offline (Koneksi Supabase belum terkonfigurasi). Skor disimpan secara lokal.',
    };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return {
      status: 'offline_unconfigured',
      success: false,
      matchId: payload.match_id,
      message: 'Klien Supabase tidak tersedia. Skor disimpan secara lokal.',
    };
  }

  try {
    // Panggil Edge Function submit-match-result
    const { data, error } = await supabase.functions.invoke('submit-match-result', {
      body: payload,
    });

    if (error) {
      // Periksa status code dan response body dari FunctionsHttpError
      let statusCode = 0;
      let responseBody: any = null;

      if (error && 'context' in (error as any) && (error as any).context) {
        try {
          const ctx = (error as any).context;
          statusCode = typeof ctx.status === 'number' ? ctx.status : 0;
          if (typeof ctx.json === 'function') {
            responseBody = await ctx.json();
          }
        } catch (_ctxErr) {
          // Response body might be empty or already consumed
        }
      }

      // 1. Tangani 409 Conflict / Duplikasi Pertandingan
      const isDuplicate =
        statusCode === 409 ||
        responseBody?.error === 'MATCH_ALREADY_RECORDED' ||
        error.message?.includes('409') ||
        error.message?.includes('MATCH_ALREADY_RECORDED');

      if (isDuplicate) {
        return {
          status: 'duplicate_ignored',
          success: true, // Idempotent sukses, skor sudah ada di leaderboard
          matchId: payload.match_id,
          message: 'Skor pertandingan ini telah tercatat di leaderboard.',
          details: responseBody || error,
        };
      }

      // 2. Tangani 404 Not Found (Fungsi belum di-deploy ke Supabase)
      if (statusCode === 404 || responseBody?.code === 'NOT_FOUND') {
        return {
          status: 'failed',
          success: false,
          matchId: payload.match_id,
          message: 'Layanan skor online belum aktif di cloud (HTTP 404). Skor tersimpan aman secara lokal.',
          error: 'EDGE_FUNCTION_NOT_DEPLOYED',
          details: responseBody || error,
        };
      }

      // 3. Tangani error lainnya dari backend
      const fallbackMsg = responseBody?.message || error.message || 'Gagal menghubungi server Edge Function';
      return {
        status: 'failed',
        success: false,
        matchId: payload.match_id,
        message: fallbackMsg,
        error: responseBody?.error || error.message,
        details: responseBody || error,
      };
    }

    // Periksa payload balasan sukses dari function
    if (data && data.success === false) {
      if (data.error === 'MATCH_ALREADY_RECORDED') {
        return {
          status: 'duplicate_ignored',
          success: true,
          matchId: payload.match_id,
          message: 'Skor pertandingan ini sudah tersimpan di leaderboard.',
          details: data,
        };
      }

      return {
        status: 'failed',
        success: false,
        matchId: payload.match_id,
        message: data.message || 'Gagal memvalidasi skor pertandingan.',
        error: data.error,
        details: data,
      };
    }

    return {
      status: 'synced',
      success: true,
      matchId: payload.match_id,
      message: 'Skor berhasil tersimpan di Leaderboard Online!',
      details: data,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('[scoreSubmissionService] Error submitMatchResult:', errorMsg);

    return {
      status: 'failed',
      success: false,
      matchId: payload.match_id,
      message: 'Koneksi jaringan gagal. Skor tetap aman tersimpan di profil lokal.',
      error: errorMsg,
    };
  }
};
