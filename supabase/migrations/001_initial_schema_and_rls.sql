-- Migration: 001_initial_schema_and_rls.sql
-- ALGORITHM QUEST: Schema & Security Hardening
-- Menyiapkan tabel public.player_profiles dan public.match_results
-- Beserta RLS dan pembatasan hak akses (GRANT/REVOKE)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL: player_profiles
CREATE TABLE IF NOT EXISTS public.player_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT UNIQUE NOT NULL,
    player_name VARCHAR(50) NOT NULL,
    total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
    accuracy NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (accuracy >= 0 AND accuracy <= 100),
    max_combo INTEGER NOT NULL DEFAULT 0 CHECK (max_combo >= 0),
    total_games INTEGER NOT NULL DEFAULT 0 CHECK (total_games >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3. TABEL: match_results
CREATE TABLE IF NOT EXISTS public.match_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id VARCHAR(64) UNIQUE NOT NULL,
    player_id UUID REFERENCES public.player_profiles(id) ON DELETE SET NULL,
    player_name VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0),
    total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
    accuracy NUMERIC(5, 2) NOT NULL CHECK (accuracy >= 0 AND accuracy <= 100),
    max_combo INTEGER NOT NULL DEFAULT 0 CHECK (max_combo >= 0),
    puzzles_solved INTEGER NOT NULL DEFAULT 15 CHECK (puzzles_solved >= 15),
    total_questions INTEGER NOT NULL DEFAULT 15 CHECK (total_questions >= puzzles_solved),
    grade VARCHAR(5) NOT NULL CHECK (grade IN ('S', 'A', 'B', 'C')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. INDEX PERFORMA LEADERBOARD
CREATE INDEX IF NOT EXISTS idx_match_results_leaderboard 
ON public.match_results (score DESC, accuracy DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_match_results_match_id 
ON public.match_results (match_id);

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

-- 6. POLICIES UNTUK match_results
-- Kebijakan baca publik (Leaderboard dapat dibaca semua orang, termasuk anonim)
DROP POLICY IF EXISTS "Public can view leaderboard" ON public.match_results;
CREATE POLICY "Public can view leaderboard"
ON public.match_results
FOR SELECT
TO anon, authenticated
USING (true);

-- CATATAN KEAMANAN TAHAP 01A:
-- Browser (anon / authenticated) TIDAK DIIZINKAN melakukan INSERT langsung ke match_results.
-- Insert hanya diperbolehkan melalui Service Role key (Backend Edge Function).
DROP POLICY IF EXISTS "No direct insert from client" ON public.match_results;

-- 7. CABUT DAN BATASI HAK AKSES (GRANT & REVOKE)
REVOKE ALL ON public.match_results FROM anon, authenticated;
GRANT SELECT ON public.match_results TO anon, authenticated;

-- Service role memiliki akses penuh untuk Edge Function
GRANT ALL ON public.match_results TO service_role;
