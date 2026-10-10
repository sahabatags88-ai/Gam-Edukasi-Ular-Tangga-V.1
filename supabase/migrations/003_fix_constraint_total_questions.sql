-- ============================================================================
-- MIGRATION: 003_fix_constraint_total_questions.sql
-- PROYEK: ALGORITHM QUEST — ULAR TANGGA ALGORITMA
-- SUPABASE REF: hzmrozhjsrjpxlnpdkws
--
-- MASALAH:
-- Error PostgreSQL: code 23514 (check_violation)
-- violates check constraint "chk_match_total_questions_fixed"
--
-- PENYEBAB:
-- Pada skema awal terdapat check constraint yang mematok secara kaku
-- `total_questions = 15`. Padahal pemain game menjawab total_questions aktual
-- (misal: 19 soal karena ada jawaban salah atau percobaan ulang),
-- sementara puzzles_solved adalah jumlah misi unik yang berhasil dituntaskan (15).
--
-- SOLUSI:
-- 1. Drop check constraint statis yang membatasi total_questions = 15.
-- 2. Pertahankan dan perbarui constraint agar dinamis & valid:
--    - puzzles_solved >= 15 (syarat mutlak tuntas misi kelulusan game)
--    - total_questions >= puzzles_solved (total soal yang dijawab selalu >= soal benar)
--    - total_questions <= 100 (batas rasional batas atas permainan)
-- 3. Memastikan kolom match_id aman (VARCHAR(64) / TEXT) dan memiliki UNIQUE constraint.
-- ============================================================================

BEGIN;

-- 1. Identifikasi dan Hapus Constraint statis kaku pada total_questions jika ada
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
          AND table_name = 'match_results' 
          AND constraint_type = 'CHECK'
          AND (
            constraint_name ILIKE '%chk_match_total_questions%' 
            OR constraint_name ILIKE '%total_questions_fixed%'
            OR constraint_name ILIKE '%chk_match_total_questions_fixed%'
          )
    ) LOOP
        EXECUTE 'ALTER TABLE public.match_results DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
        RAISE NOTICE 'Constraint lama di-drop: %', r.constraint_name;
    END LOOP;
END $$;

-- Drop eksplisit untuk variasi nama constraint umum
ALTER TABLE public.match_results 
  DROP CONSTRAINT IF EXISTS chk_match_total_questions_fixed;

ALTER TABLE public.match_results 
  DROP CONSTRAINT IF EXISTS chk_match_puzzles_not_over_total;

ALTER TABLE public.match_results 
  DROP CONSTRAINT IF EXISTS chk_match_mission_cleared;

-- 2. Pasang Constraint Baru yang Fleksibel, Akurat, dan Konsisten
-- A. puzzles_solved harus >= 15 (syarat kemenangan Algorithm Quest)
ALTER TABLE public.match_results
  ADD CONSTRAINT chk_match_puzzles_solved_min
  CHECK (puzzles_solved >= 15);

-- B. total_questions harus minimal sama dengan puzzles_solved dan dalam batas wajar (15-100)
ALTER TABLE public.match_results
  ADD CONSTRAINT chk_match_total_questions_range
  CHECK (total_questions >= puzzles_solved AND total_questions <= 100);

-- C. Pastikan score dan total_xp non-negatif
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'match_results' AND constraint_name = 'chk_match_score_positive'
  ) THEN
    ALTER TABLE public.match_results
      ADD CONSTRAINT chk_match_score_positive
      CHECK (score >= 0);
  END IF;
END $$;

-- 3. Jamin match_id berformat VARCHAR(64) / TEXT untuk mencegah error 22P02
ALTER TABLE public.match_results 
  ALTER COLUMN match_id DROP DEFAULT;

ALTER TABLE public.match_results 
  ALTER COLUMN match_id TYPE VARCHAR(64) 
  USING match_id::text;

ALTER TABLE public.match_results 
  ALTER COLUMN match_id SET NOT NULL;

-- 4. Jamin Unique Constraint pada match_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints tc 
    JOIN information_schema.constraint_column_usage ccu 
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'match_results' 
      AND ccu.column_name = 'match_id' 
      AND tc.constraint_type = 'UNIQUE'
  ) THEN
    ALTER TABLE public.match_results 
      ADD CONSTRAINT match_results_match_id_key UNIQUE (match_id);
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- QUERY VERIFIKASI (Jalankan untuk memeriksa status constraints yang aktif)
-- ============================================================================
-- SELECT 
--     conname AS constraint_name, 
--     pg_get_constraintdef(c.oid) AS constraint_definition
-- FROM pg_constraint c
-- JOIN pg_namespace n ON n.oid = c.connamespace
-- WHERE conrelid = 'public.match_results'::regclass;
