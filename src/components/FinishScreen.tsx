import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameStats } from '../types/game';
import { calculateAccuracy, getPerformanceGrade } from '../utils/scoreEngine';
import {
  Trophy,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Flame,
  Percent,
  CloudCheck,
  CloudOff,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { audio } from '../utils/audio';
import { ScoreSubmissionStatus } from '../services/scoreSubmissionService';

interface FinishScreenProps {
  playerName: string;
  xp?: number;
  stats?: GameStats;
  puzzlesSolved?: number;
  missionTotal?: number;
  submissionStatus?: ScoreSubmissionStatus;
  submissionMessage?: string;
  onRetrySubmission?: () => void;
  onOpenLeaderboard?: () => void;
  onPlayAgain: () => void;
}

export const FinishScreen: React.FC<FinishScreenProps> = ({
  playerName,
  xp = 0,
  stats,
  puzzlesSolved = 15,
  missionTotal = 15,
  submissionStatus = 'idle',
  submissionMessage = '',
  onRetrySubmission,
  onOpenLeaderboard,
  onPlayAgain,
}) => {
  const finalXp = stats ? stats.score : xp;
  const totalAnswered = stats ? stats.totalQuestionsAnswered : puzzlesSolved;
  const correct = stats ? stats.correctAnswers : puzzlesSolved;
  const wrong = stats ? stats.wrongAnswers : 0;
  const maxCombo = stats ? stats.maxCombo : 0;
  const accuracyNum = totalAnswered > 0 ? Math.round((correct / totalAnswered) * 100) : 100;
  const accuracyStr = stats ? calculateAccuracy(stats.correctAnswers, stats.totalQuestionsAnswered) : '100%';

  const gradeInfo = getPerformanceGrade(finalXp, accuracyNum, maxCombo);

  useEffect(() => {
    try {
      audio.victory();
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center bg-slate-950 px-4 py-8 overflow-y-auto">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Victory Card */}
      <div className="relative z-10 w-full max-w-lg my-auto p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-amber-500/40 shadow-2xl backdrop-blur-md flex flex-col items-center text-center">
        {/* Trophy Icon */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4 animate-bounce">
          <Trophy className="w-10 h-10 text-slate-950" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
          🏆 ALGORITHM QUEST COMPLETE!
        </h1>

        <p className="text-base sm:text-lg font-bold text-amber-300 mb-3">
          🎉 SELAMAT! Kamu Berhasil Menyelesaikan Misi!
        </p>

        {/* Mission Checklist Highlights */}
        <div className="flex items-center justify-center gap-2 flex-wrap text-xs text-emerald-300 font-bold mb-4 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-full">
          <span>✓ Board 100 Cell</span>
          <span>•</span>
          <span>✓ {puzzlesSolved} / {missionTotal} Soal Tuntas</span>
          <span>•</span>
          <span>✓ Misi Sapu Bersih</span>
        </div>

        {/* Predikat Kelulusan Card (Grade S, A, B, C, Section 20 & 21) */}
        <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-yellow-500/15 border border-amber-500/30 mb-6 text-center">
          <div className="inline-block px-5 py-2 rounded-full font-black text-base sm:text-lg tracking-wider uppercase mb-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-xl shadow-amber-500/30 animate-bannerPop">
            🏆 PREDIKAT: {gradeInfo.title}
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-semibold">
            {gradeInfo.desc}
          </p>
        </div>

        {/* Player Result Summary Box */}
        <div className="w-full p-4 rounded-2xl bg-slate-950/70 border border-slate-800 mb-6 flex flex-col gap-2.5 text-left text-xs sm:text-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-400 font-medium">Nama Siswa:</span>
            <span className="font-extrabold text-white">{playerName}</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-400 font-medium">Posisi Kotak:</span>
            <span className="font-extrabold text-emerald-400">100 / 100 (FINISH)</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-400 font-medium">Misi Soal Terjawab:</span>
            <span className="font-extrabold text-cyan-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>{puzzlesSolved} / {missionTotal} Soal (Tuntas)</span>
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-400 font-medium">Total Skor XP:</span>
            <span className="font-black text-amber-400 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{finalXp} XP</span>
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-400 font-medium">Akurasi Jawaban:</span>
            <span className="font-extrabold text-cyan-400 flex items-center gap-1">
              <Percent className="w-3.5 h-3.5" />
              <span>{accuracyStr}</span>
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-400 font-medium">Rekor Combo Tertinggi:</span>
            <span className="font-extrabold text-orange-400 flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
              <span>{maxCombo > 0 ? `${maxCombo}x Berturut-turut` : '1x'}</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Statistik Hasil:</span>
            <span className="font-bold text-slate-300 flex items-center gap-2">
              <span className="text-emerald-400 flex items-center gap-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> {correct} Benar
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-rose-400 flex items-center gap-0.5">
                <XCircle className="w-3.5 h-3.5" /> {wrong} Salah
              </span>
            </span>
          </div>
        </div>

        {/* Status Sinkronisasi Leaderboard Online */}
        <div className="w-full mb-6">
          {submissionStatus === 'submitting' && (
            <div className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs sm:text-sm font-semibold animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Menyinkronkan skor ke Leaderboard Online...</span>
            </div>
          )}

          {(submissionStatus === 'synced' || submissionStatus === 'duplicate_ignored') && (
            <div className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold">
              <CloudCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {submissionStatus === 'duplicate_ignored'
                  ? '✓ Skor pertandingan ini sudah tercatat di Leaderboard Online'
                  : '✓ Skor berhasil tersimpan di Leaderboard Online!'}
              </span>
            </div>
          )}

          {submissionStatus === 'offline_unconfigured' && (
            <div className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-slate-900 border border-slate-700/60 text-slate-400 text-xs sm:text-sm font-medium">
              <CloudOff className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Tersimpan di Profil Lokal (Mode Offline).</span>
            </div>
          )}

          {submissionStatus === 'failed' && (
            <div className="flex flex-col gap-2 p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-rose-300 font-semibold">
                  <CloudOff className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{submissionMessage || 'Gagal tersambung ke leaderboard online'}</span>
                </div>
                {onRetrySubmission && (
                  <button
                    type="button"
                    onClick={() => {
                      audio.buttonClick();
                      onRetrySubmission();
                    }}
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white font-bold border border-rose-500/40 transition-colors cursor-pointer text-xs"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Coba Lagi</span>
                  </button>
                )}
              </div>
              <span className="text-[11px] text-slate-400 text-left">
                Skor tetap aman tersimpan di profil perangkat kamu.
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons: MAIN LAGI & LEADERBOARD */}
        <div className="flex flex-col gap-2.5 w-full">
          {onOpenLeaderboard && (
            <button
              type="button"
              onClick={() => {
                audio.buttonClick();
                onOpenLeaderboard();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 hover:border-amber-500 text-amber-300 font-bold text-sm shadow-md shadow-amber-950/30 hover:scale-102 active:scale-98 transition-all cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>LIHAT POSISI DI LEADERBOARD ONLINE</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              audio.buttonClick();
              onPlayAgain();
            }}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-extrabold text-base shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-102 active:scale-98 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>MAIN LAGI</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 w-full max-w-lg text-center text-xs text-slate-400 pt-4 border-t border-slate-800">
        Informatika Kelas IX SMP • Create By <span className="text-cyan-400 font-semibold">Andri Ganda Saputra</span>
      </div>
    </div>
  );
};
