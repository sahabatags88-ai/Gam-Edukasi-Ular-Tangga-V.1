import { getSupabase, getSupabaseConfigStatus, getSupabaseUrl } from '../lib/supabase';
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
    // Panggil Edge Function submit-match-result melalui supabase.functions.invoke
    const { data, error } = await supabase.functions.invoke('submit-match-result', {
      body: payload,
    });

    if (error) {
      let statusCode = 0;
      let responseBody: any = null;

      // Cek apakah error membawa objek Response (FunctionsHttpError)
      if (error && 'context' in (error as any) && (error as any).context) {
        try {
          const ctx = (error as any).context;
          if (typeof ctx?.status === 'number') {
            statusCode = ctx.status;
          }
          if (typeof ctx?.json === 'function') {
            responseBody = await (ctx.clone?.().json?.() ?? ctx.json());
          }
        } catch (_ctxErr) {
          // Response stream might be consumed or unparseable
        }
      }

      // Jika statusCode belum diketahui (misal FunctionsFetchError akibat browser CORS preflight menolak 404)
      if (statusCode === 0) {
        // A. Cek status offline browser
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          console.warn('[scoreSubmissionService] Perangkat sedang offline (navigator.onLine === false).');
          return {
            status: 'failed',
            success: false,
            matchId: payload.match_id,
            message: 'Perangkat sedang offline (tidak ada koneksi internet). Skor tersimpan aman di profil lokal.',
            error: 'NETWORK_OFFLINE',
          };
        }

        // B. Lakukan probe GET sederhana ke endpoint functions tanpa custom headers
        // untuk mendeteksi apakah gateway Supabase merespons dengan HTTP 404 (NOT_FOUND)
        const baseUrl = getSupabaseUrl();
        if (baseUrl) {
          try {
            const probeRes = await fetch(`${baseUrl}/functions/v1/submit-match-result`, {
              method: 'GET',
            });
            statusCode = probeRes.status;
            const sbErrorCode = probeRes.headers.get('sb-error-code');
            try {
              responseBody = await probeRes.json();
            } catch {
              // ignore body json
            }

            if (statusCode === 404 && (sbErrorCode === 'NOT_FOUND' || responseBody?.code === 'NOT_FOUND')) {
              console.warn(
                '[scoreSubmissionService] Diagnosis: Edge Function submit-match-result belum di-deploy ke Supabase (HTTP 404 / NOT_FOUND).'
              );
              return {
                status: 'failed',
                success: false,
                matchId: payload.match_id,
                message:
                  'Layanan skor online belum aktif di cloud (Fungsi submit-match-result belum di-deploy / HTTP 404). Skor tersimpan aman di profil lokal.',
                error: 'HTTP_404_FUNCTION_NOT_DEPLOYED',
                details: { statusCode, sbErrorCode, responseBody },
              };
            }
          } catch (probeErr) {
            console.warn(
              '[scoreSubmissionService] Probe endpoint gagal:',
              probeErr instanceof Error ? probeErr.message : String(probeErr)
            );
          }
        }
      }

      // 1. Penanganan HTTP 409 Conflict / Duplikasi Pertandingan (Idempotensi)
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
          message: 'Skor pertandingan ini telah tercatat di Leaderboard Online.',
          details: responseBody || error,
        };
      }

      // 2. Penanganan HTTP 404 Not Found (Fungsi belum di-deploy)
      if (statusCode === 404 || responseBody?.code === 'NOT_FOUND') {
        console.warn('[scoreSubmissionService] HTTP 404: Edge Function submit-match-result tidak ditemukan / belum di-deploy.');
        return {
          status: 'failed',
          success: false,
          matchId: payload.match_id,
          message:
            'Layanan skor online belum aktif di cloud (Fungsi submit-match-result belum di-deploy / HTTP 404). Skor tersimpan aman di profil lokal.',
          error: 'HTTP_404_FUNCTION_NOT_DEPLOYED',
          details: responseBody || error,
        };
      }

      // 3. Penanganan HTTP 401 / 403 (Autentikasi atau Izin Ditolak)
      if (statusCode === 401 || statusCode === 403) {
        console.warn(`[scoreSubmissionService] HTTP ${statusCode}: Izin akses ke Edge Function ditolak.`);
        return {
          status: 'failed',
          success: false,
          matchId: payload.match_id,
          message: `Akses ke server leaderboard ditolak (Autentikasi / HTTP ${statusCode}). Skor tersimpan aman di profil lokal.`,
          error: `HTTP_${statusCode}_UNAUTHORIZED_OR_FORBIDDEN`,
          details: responseBody || error,
        };
      }

      // 4. Penanganan HTTP 400 Bad Request (Validasi Payload Gagal)
      if (statusCode === 400) {
        const validationMsg = Array.isArray(responseBody?.errors)
          ? responseBody.errors.join('; ')
          : responseBody?.message || 'Data hasil pertandingan tidak memenuhi validasi server';
        console.warn('[scoreSubmissionService] HTTP 400: Validasi payload gagal:', responseBody);
        return {
          status: 'failed',
          success: false,
          matchId: payload.match_id,
          message: `Format data pertandingan tidak valid (HTTP 400): ${validationMsg}. Skor tersimpan aman di profil lokal.`,
          error: 'HTTP_400_BAD_REQUEST',
          details: responseBody || error,
        };
      }

      // 5. Penanganan HTTP 5xx Server Error
      if (statusCode >= 500) {
        console.warn(`[scoreSubmissionService] HTTP ${statusCode}: Kesalahan server cloud:`, responseBody);
        return {
          status: 'failed',
          success: false,
          matchId: payload.match_id,
          message: `Server leaderboard sedang mengalami gangguan (HTTP ${statusCode}). Skor tersimpan aman di profil lokal.`,
          error: `HTTP_${statusCode}_SERVER_ERROR`,
          details: responseBody || error,
        };
      }

      // 6. Penanganan Gangguan Jaringan / CORS / Relay Error
      console.warn('[scoreSubmissionService] Network / Relay error:', error.message || error);
      return {
        status: 'failed',
        success: false,
        matchId: payload.match_id,
        message: 'Gangguan koneksi jaringan atau CORS ke server leaderboard. Skor tersimpan aman di profil lokal.',
        error: error.name || 'NETWORK_CONNECTION_ERROR',
        details: responseBody || error,
      };
    }

    // Periksa payload balasan sukses dari function (2xx)
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
    console.warn('[scoreSubmissionService] Exception submitMatchResult:', errorMsg);

    return {
      status: 'failed',
      success: false,
      matchId: payload.match_id,
      message: 'Koneksi jaringan gagal terhubung ke server. Skor tetap aman tersimpan di profil lokal.',
      error: errorMsg,
    };
  }
};
