// Supabase Edge Function: submit-match-result
// Runtime: Deno (Standard Supabase Edge Functions)
// Deskripsi: Menerima dan memvalidasi hasil kemenangan pertandingan ALGORITHM QUEST,
//            mencegah submit duplikat, dan menyimpan ke public.match_results menggunakan Service Role key.

import { createClient } from 'jsr:@supabase/supabase-js@2';

// Header CORS standar untuk komunikasi aman dengan browser client
const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Interface payload yang diharapkan dari game client
interface SubmitMatchPayload {
  match_id: string;
  player_id?: string | null;
  player_name: string;
  score: number;
  total_xp?: number;
  accuracy: number;
  max_combo: number;
  puzzles_solved: number;
  total_questions: number;
  grade: 'S' | 'A' | 'B' | 'C' | string;
}

// Helper respon JSON dengan CORS
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

// Sanitasi string teks dari karakter berbahaya & tag HTML
function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // hilangkan tag html kurung siku
    .trim();
}

// Validasi format UUID sederhana
function isValidUuid(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Validasi format match_id (UUID v4 atau prefix aq-match-...)
function isValidMatchId(id: string): boolean {
  if (typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (trimmed.length < 8 || trimmed.length > 64) return false;
  // Boleh format UUID standar atau format kustom game 'aq-match-...'
  const matchIdRegex = /^[a-zA-Z0-9_\-]+$/;
  return matchIdRegex.test(trimmed);
}

// Helper: Normalisasi match_id ke UUID v4 valid agar kompatibel dengan PostgreSQL
// kolom bertipe UUID maupun VARCHAR tanpa pernah memicu error 22P02
async function normalizeToUuid(input: string): Promise<string> {
  const trimmed = input.trim();
  if (isValidUuid(trimmed)) {
    return trimmed.toLowerCase();
  }

  // Jika input bukan UUID (misal format legacy 'aq-timestamp-random'),
  // buat UUID deterministik v4-compliant dari SHA-256 hash input
  // agar idempotensi tetap terjaga (input yang sama menghasilkan UUID yang sama).
  const encoder = new TextEncoder();
  const data = encoder.encode(`aq-match-id-v1-${trimmed}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  // Format sebagai UUID v4: 8-4-4-4-12
  const p1 = hex.substring(0, 8);
  const p2 = hex.substring(8, 12);
  const p3 = '4' + hex.substring(13, 16);
  const p4 = ((parseInt(hex.substring(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + hex.substring(18, 20);
  const p5 = hex.substring(20, 32);

  return `${p1}-${p2}-${p3}-${p4}-${p5}`.toLowerCase();
}

Deno.serve(async (req: Request) => {
  // 1. Tangani CORS Preflight (OPTIONS request)
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders,
    });
  }

  // 2. Validasi HTTP Method (hanya POST)
  if (req.method !== 'POST') {
    return jsonResponse(
      {
        success: false,
        error: 'METHOD_NOT_ALLOWED',
        message: `Metode ${req.method} tidak diizinkan. Gunakan POST.`,
      },
      405
    );
  }

  // 3. Verifikasi Content-Type JSON
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return jsonResponse(
      {
        success: false,
        error: 'INVALID_CONTENT_TYPE',
        message: 'Content-Type harus application/json.',
      },
      400
    );
  }

  // 4. Inisialisasi Supabase Admin Client menggunakan Service Role Key
  // Nilai ini diinjeksi secara otomatis oleh Supabase Edge Functions environment
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[submit-match-result] Konfigurasi SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan.');
    return jsonResponse(
      {
        success: false,
        error: 'SERVER_CONFIGURATION_ERROR',
        message: 'Konfigurasi backend database belum lengkap di server.',
      },
      500
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // 5. Parsing & Validasi Payload
  let body: Partial<SubmitMatchPayload>;
  try {
    body = await req.json();
  } catch (_e) {
    return jsonResponse(
      {
        success: false,
        error: 'MALFORMED_JSON',
        message: 'Format JSON payload tidak valid.',
      },
      400
    );
  }

  const validationErrors: string[] = [];

  // Validasi match_id
  const matchId = typeof body.match_id === 'string' ? body.match_id.trim() : '';
  if (!matchId || !isValidMatchId(matchId)) {
    validationErrors.push('match_id wajib diisi (8-64 karakter alphanumeric/hyphen/underscore).');
  }

  // Validasi player_name
  const rawPlayerName = sanitizeText(body.player_name);
  if (!rawPlayerName || rawPlayerName.length < 2 || rawPlayerName.length > 30) {
    validationErrors.push('player_name wajib 2 hingga 30 karakter.');
  }

  // Validasi score (integer non-negatif, batas atas wajar untuk 15-20 soal adalah 25.000)
  const score = Number(body.score);
  if (!Number.isInteger(score) || score < 0 || score > 25000) {
    validationErrors.push('score harus bilangan bulat antara 0 dan 25.000.');
  }

  // Validasi total_xp (opsional, jika tidak ada fallback ke score)
  const totalXp = body.total_xp !== undefined ? Number(body.total_xp) : score;
  if (!Number.isInteger(totalXp) || totalXp < 0 || totalXp > 25000) {
    validationErrors.push('total_xp harus bilangan bulat antara 0 dan 25.000.');
  }

  // Validasi accuracy (0 hingga 100)
  const accuracy = Number(body.accuracy);
  if (isNaN(accuracy) || accuracy < 0 || accuracy > 100) {
    validationErrors.push('accuracy harus bernilai antara 0 hingga 100.');
  }

  // Validasi max_combo (0 hingga 30)
  const maxCombo = Number(body.max_combo);
  if (!Number.isInteger(maxCombo) || maxCombo < 0 || maxCombo > 30) {
    validationErrors.push('max_combo harus bilangan bulat antara 0 dan 30.');
  }

  // Validasi puzzles_solved (syarat kemenangan game adalah tuntas minimal 15 soal)
  const puzzlesSolved = Number(body.puzzles_solved);
  if (!Number.isInteger(puzzlesSolved) || puzzlesSolved < 15 || puzzlesSolved > 100) {
    validationErrors.push('puzzles_solved minimal 15 (syarat kelulusan misi Algorithm Quest).');
  }

  // Validasi total_questions (minimal sama dengan puzzles_solved)
  const totalQuestions = Number(body.total_questions);
  if (!Number.isInteger(totalQuestions) || totalQuestions < puzzlesSolved || totalQuestions > 100) {
    validationErrors.push('total_questions harus bilangan bulat >= puzzles_solved.');
  }

  // Validasi grade (hanya S, A, B, atau C)
  const validGrades = ['S', 'A', 'B', 'C'];
  const grade = typeof body.grade === 'string' ? body.grade.toUpperCase().trim() : '';
  if (!validGrades.includes(grade)) {
    validationErrors.push("grade harus salah satu dari: 'S', 'A', 'B', 'C'.");
  }

  // Validasi player_id (opsional UUID)
  let playerId: string | null = null;
  if (body.player_id) {
    const rawPid = String(body.player_id).trim();
    if (isValidUuid(rawPid)) {
      playerId = rawPid;
    } else {
      validationErrors.push('player_id harus berupa format UUID yang valid jika disertakan.');
    }
  }

  // Jika ada kegagalan validasi, kembalikan 400 Bad Request dengan daftar kesalahan
  if (validationErrors.length > 0) {
    return jsonResponse(
      {
        success: false,
        error: 'VALIDATION_FAILED',
        message: 'Payload pertandingan tidak memenuhi validasi integritas.',
        errors: validationErrors,
      },
      400
    );
  }

  // 6. Normalisasi match_id ke format UUID valid
  // Menjamin kecocokan 100% baik pada kolom PostgreSQL bertipe UUID maupun VARCHAR/TEXT (Bebas Error 22P02)
  const safeMatchId = await normalizeToUuid(matchId);

  // 7. Cek Idempotency / Cegah Duplikasi Pengiriman Pertandingan yang Sama
  try {
    const { data: existingMatch, error: checkError } = await supabaseAdmin
      .from('match_results')
      .select('id, match_id, created_at')
      .eq('match_id', safeMatchId)
      .maybeSingle();

    if (checkError) {
      console.error('[submit-match-result] Error saat memeriksa match_id:', checkError);
      const isUuidMismatch =
        checkError.code === '22P02' ||
        checkError.message?.toLowerCase().includes('uuid');

      return jsonResponse(
        {
          success: false,
          error: isUuidMismatch ? 'DATABASE_SCHEMA_TYPE_MISMATCH' : 'DATABASE_QUERY_ERROR',
          message: isUuidMismatch
            ? 'Kolom match_id pada tabel database match_results masih bertipe UUID (Error 22P02). Jalankan migrasi SQL 002_alter_match_id_to_text.sql di Supabase SQL Editor.'
            : 'Gagal memverifikasi catatan pertandingan pada database.',
          details: checkError.message,
          code: checkError.code,
        },
        500
      );
    }

    if (existingMatch) {
      // Pertandingan dengan match_id ini sudah pernah disubmit
      return jsonResponse(
        {
          success: false,
          error: 'MATCH_ALREADY_RECORDED',
          message: 'Pertandingan dengan match_id ini sudah tercatat sebelumnya (duplikasi ditolak).',
          data: {
            existing_match_id: existingMatch.match_id,
            recorded_at: existingMatch.created_at,
          },
        },
        409 // Conflict
      );
    }

    // 8. Simpan Hasil Pertandingan ke public.match_results
    const insertPayload = {
      match_id: safeMatchId,
      player_id: playerId,
      player_name: rawPlayerName,
      score,
      total_xp: totalXp,
      accuracy: Math.round(accuracy),
      max_combo: maxCombo,
      puzzles_solved: puzzlesSolved,
      total_questions: totalQuestions,
      grade,
    };

    const { data: insertedRow, error: insertError } = await supabaseAdmin
      .from('match_results')
      .insert(insertPayload)
      .select('id, match_id, player_name, score, total_xp, accuracy, max_combo, grade, created_at')
      .single();

    if (insertError) {
      // Tangani kode error Postgres 23505 (unique_violation) jika terjadi race condition
      if (insertError.code === '23505') {
        return jsonResponse(
          {
            success: false,
            error: 'MATCH_ALREADY_RECORDED',
            message: 'Pertandingan sudah pernah dicatat oleh permintaan sebelumnya.',
          },
          409
        );
      }

      console.error('[submit-match-result] Gagal insert ke match_results:', insertError);
      const isUuidMismatch =
        insertError.code === '22P02' ||
        insertError.message?.toLowerCase().includes('uuid');

      const isConstraintCheckViolation =
        insertError.code === '23514' ||
        insertError.message?.toLowerCase().includes('check constraint') ||
        insertError.message?.toLowerCase().includes('chk_match');

      let customErrorMessage = 'Gagal menyimpan skor pertandingan ke leaderboard.';
      let customErrorKey = 'INSERT_FAILED';

      if (isConstraintCheckViolation) {
        customErrorKey = 'DATABASE_CONSTRAINT_VIOLATION';
        customErrorMessage =
          'Constraint database menolak data pertandingan (Error 23514). Jalankan migrasi SQL 003_fix_constraint_total_questions.sql di Supabase SQL Editor.';
      } else if (isUuidMismatch) {
        customErrorKey = 'DATABASE_SCHEMA_TYPE_MISMATCH';
        customErrorMessage =
          'Kolom match_id pada tabel database match_results masih bertipe UUID (Error 22P02). Jalankan migrasi SQL 002_alter_match_id_to_text.sql di Supabase SQL Editor.';
      }

      return jsonResponse(
        {
          success: false,
          error: customErrorKey,
          message: customErrorMessage,
          details: insertError.message,
          code: insertError.code,
        },
        500
      );
    }

    // 8. Berikan Respons Sukses Terstruktur (HTTP 201 Created)
    return jsonResponse(
      {
        success: true,
        message: 'Skor kemenangan berhasil diverifikasi dan disimpan ke leaderboard online.',
        data: insertedRow,
      },
      201
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[submit-match-result] Unexpected error:', errorMsg);
    return jsonResponse(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Terjadi kesalahan sistem saat memproses skor.',
      },
      500
    );
  }
});
