import React, { useState } from 'react';
import {
  User,
  X,
  Trophy,
  Sparkles,
  Flame,
  Target,
  Gamepad2,
  CheckCircle2,
  RotateCcw,
  BookOpen,
  Map,
  AlertTriangle,
} from 'lucide-react';
import { PlayerProfile } from '../types/game';
import { calculateLevel } from '../utils/profileEngine';
import { audio } from '../utils/audio';

interface ProfileModalProps {
  profile: PlayerProfile;
  isOpen: boolean;
  onClose: () => void;
  onResetProgress: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  isOpen,
  onClose,
  onResetProgress,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  if (!isOpen) return null;

  const levelInfo = calculateLevel(profile.totalXP);
  const formattedTotalXP = new Intl.NumberFormat('id-ID').format(profile.totalXP);
  const formattedNextXP = levelInfo.nextLevelXp
    ? new Intl.NumberFormat('id-ID').format(levelInfo.nextLevelXp)
    : 'MAX';

  const handleClose = () => {
    audio.buttonClick();
    setShowConfirmReset(false);
    onClose();
  };

  const handleConfirmReset = () => {
    audio.buttonClick();
    onResetProgress();
    setShowConfirmReset(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 text-slate-100 overflow-hidden my-auto max-h-[90vh] flex flex-col justify-between">
        {/* Glow corners */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
              PROFIL PEMAIN
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Tutup Profil"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="relative z-10 py-3 overflow-y-auto space-y-3.5 pr-1">
          {/* Player Identity Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/50 via-slate-900 to-indigo-950/50 border border-cyan-500/30 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider">
                Petualang Algoritma
              </div>
              <div className="text-base sm:text-lg font-black text-white truncate">
                {profile.playerName || 'Pemain'}
              </div>
            </div>
            <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-black text-amber-300 shrink-0 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>LV {levelInfo.level}</span>
            </div>
          </div>

          {/* Level Progress Section (Section 6 & 7) */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-extrabold text-amber-300">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>{levelInfo.isMaxLevel ? '🏆 MAX LEVEL' : `LEVEL ${levelInfo.level}`}</span>
              </div>
              <div className="font-mono text-slate-300 text-[11px] font-bold">
                ⭐ {formattedTotalXP} {levelInfo.isMaxLevel ? 'XP' : `/ ${formattedNextXP} XP`}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500 shadow-sm shadow-amber-500/50"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>{levelInfo.isMaxLevel ? 'Tingkat Maksimal Tercapai' : `${levelInfo.progressPercent}% Menuju Level ${levelInfo.level + 1}`}</span>
              <span>Total Kumulatif: {formattedTotalXP} XP</span>
            </div>
          </div>

          {/* Key Game Statistics Cards (Section 8-12) */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Akurasi */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">AKURASI</span>
                <span className="text-sm font-black text-teal-300">{profile.accuracy}%</span>
              </div>
            </div>

            {/* Max Combo */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">MAX COMBO</span>
                <span className="text-sm font-black text-orange-300">
                  {profile.maxCombo > 0 ? `x${profile.maxCombo}` : '-'}
                </span>
              </div>
            </div>

            {/* Total Permainan */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">PERMAINAN</span>
                <span className="text-sm font-black text-indigo-300">
                  {profile.totalGames} Kali
                </span>
              </div>
            </div>

            {/* Soal Selesai */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">SOAL SELESAI</span>
                <span className="text-sm font-black text-cyan-300">
                  {profile.completedQuestions} Soal
                </span>
              </div>
            </div>
          </div>

          {/* Rekor Tambahan */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px] grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-slate-400 block text-[10px]">Skor Terbaik</span>
              <strong className="text-amber-300 font-mono text-xs">
                {new Intl.NumberFormat('id-ID').format(profile.bestScore)}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Akurasi Terbaik</span>
              <strong className="text-teal-300 font-mono text-xs">
                {profile.bestAccuracy}%
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Misi Selesai</span>
              <strong className="text-emerald-300 font-mono text-xs">
                {profile.completedMissions} Misi
              </strong>
            </div>
          </div>

          {/* Materi Aktif & World (Sections 13 & 14) */}
          <div className="space-y-2">
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">MATERI AKTIF</span>
                  <span className="font-bold text-white">Mengenal Algoritma</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                {profile.completedMissions > 0 ? '✅ MISI SELESAI' : 'AKTIF'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">WORLD AKTIF</span>
                  <span className="font-bold text-white">🗺️ World 1 — Mengenal Algoritma</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                AKTIF
              </span>
            </div>
          </div>

          {/* Reset Confirmation Box (Section 18) */}
          {showConfirmReset && (
            <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/60 animate-fadeIn space-y-2.5">
              <div className="flex items-start gap-2 text-xs text-rose-300 font-semibold leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>Semua progress pemain akan dihapus dari browser. Lanjutkan?</span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black cursor-pointer shadow-md shadow-rose-600/30"
                >
                  RESET PROGRESS
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="relative z-10 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
          {!showConfirmReset ? (
            <button
              type="button"
              onClick={() => {
                audio.buttonClick();
                setShowConfirmReset(true);
              }}
              className="text-[11px] text-slate-500 hover:text-rose-400 font-semibold transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Progress</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs shadow-md transition-colors cursor-pointer"
          >
            TUTUP
          </button>
        </div>
      </div>
    </div>
  );
};
