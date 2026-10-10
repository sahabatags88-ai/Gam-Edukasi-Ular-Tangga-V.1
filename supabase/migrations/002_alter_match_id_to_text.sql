-- ============================================================================
-- MIGRATION: 002_alter_match_id_to_text.sql
-- PROYEK: ALGORITHM QUEST — ULAR TANGGA ALGORITMA
-- SUPABASE REF: hzmrozhjsrjpxlnpdkws
--
-- TUJUAN:
-- Memperbaiki error PostgreSQL "code: 22P02, invalid input syntax for type uuid"
-- dengan mengubah tipe kolom match_id dari UUID menjadi VARCHAR(64).
--
-- KEAMANAN:
-- 1. Menggunakan USING match_id::text agar seluruh data lama (jika ada) tetap aman.
-- 2. Menghapus default UUID (karena ID dibuat oleh frontend format 'aq-...').
-- 3. Mempertahankan constraint UNIQUE agar tidak ada duplikasi pertandingan.
-- 4. Mempertahankan index performa pencarian match_id dan leaderboard.
-- ============================================================================

BEGIN;

-- 1. Hapus nilai default UUID jika sebelumnya terpasang
ALTER TABLE public.match_results 
  ALTER COLUMN match_id DROP DEFAULT;

-- 2. Ubah tipe data kolom match_id dari UUID ke VARCHAR(64)
-- USING match_id::text memastikan konversi aman untuk data yang sudah ada
ALTER TABLE public.match_results 
  ALTER COLUMN match_id TYPE VARCHAR(64) 
  USING match_id::text;

-- 3. Pastikan kolom match_id bersifat NOT NULL
ALTER TABLE public.match_results 
  ALTER COLUMN match_id SET NOT NULL;

-- 4. Pastikan constraint UNIQUE aktif untuk mencegah submit ganda (Idempotensi)
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

-- 5. Optimasi Index: Index pencarian match_id untuk Edge Function
DROP INDEX IF EXISTS public.idx_match_results_match_id;
CREATE INDEX idx_match_results_match_id 
  ON public.match_results (match_id);

-- 6. Index gabungan performa Leaderboard (Score DESC, Accuracy DESC, Created_at ASC)
CREATE INDEX IF NOT EXISTS idx_match_results_leaderboard 
  ON public.match_results (score DESC, accuracy DESC, created_at ASC);

COMMIT;

-- ============================================================================
-- QUERY VERIFIKASI (Jalankan setelah menjalankan migrasi di atas)
-- ============================================================================
-- SELECT 
--     table_name, 
--     column_name, 
--     data_type, 
--     character_maximum_length, 
--     is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'match_results' 
--   AND column_name = 'match_id';
