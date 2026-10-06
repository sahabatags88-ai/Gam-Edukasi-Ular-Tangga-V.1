import React from 'react';
import { Play, Sparkles, Terminal, User } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
  onOpenProfile?: () => void;
  playerName?: string;
  playerLevel?: number;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  onOpenProfile,
  playerName,
  playerLevel = 1,
}) => {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center bg-slate-950 px-4 py-8 overflow-hidden select-none">
      {/* Background Decorative Tech Grid & Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="relative z-10 w-full max-w-3xl flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-cyan-400 block">
              Informatika Kelas IX SMP
            </span>
            <span className="text-xs text-slate-400">
              Bab 6 — Algoritma dan Pemrograman
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {playerName && onOpenProfile && (
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-xs text-cyan-300 font-bold transition-all cursor-pointer shadow-sm shadow-cyan-500/10"
              title="Buka Profil Pemain"
            >
              <User className="w-3.5 h-3.5" />
              <span>{playerName}</span>
              <span className="text-[10px] px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded font-black">
                LV {playerLevel}
              </span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Materi: Mengenal Algoritma</span>
          </div>
        </div>
      </div>

      {/* Main Hero Card */}
      <div className="relative z-10 max-w-xl text-center my-auto py-8 flex flex-col items-center">
        {/* Game Icon Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-semibold mb-6 shadow-lg shadow-indigo-950/50">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Game Edukasi Informatika</span>
        </div>

        {/* Title */}
        <div className="flex items-center justify-center gap-3 text-4xl sm:text-6xl font-black tracking-tight text-white mb-2">
          <span>🎮</span>
          <h1 className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
            ALGORITHM QUEST
          </h1>
        </div>

        {/* Subtitle */}
        <div className="text-xl sm:text-2xl font-extrabold text-amber-300 tracking-wide mb-3 flex items-center justify-center gap-2">
          <span>🎲</span>
          <span>ULAR TANGGA ALGORITMA</span>
          <span>🪜</span>
        </div>

        <p className="text-base sm:text-lg text-slate-300 font-medium italic mb-8">
          "Belajar Algoritma Sambil Bermain"
        </p>

        {/* Visual Teaser Cards (Computer, Robot, Algorithm, Puzzle, Board) */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3 w-full mb-10 text-center">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center gap-1.5">
            <span className="text-2xl">🤖</span>
            <span className="text-[11px] font-semibold text-slate-300">Robotika</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center gap-1.5">
            <span className="text-2xl">🧩</span>
            <span className="text-[11px] font-semibold text-slate-300">Logika</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center gap-1.5">
            <span className="text-2xl">🪜</span>
            <span className="text-[11px] font-semibold text-slate-300">Tangga Kode</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center gap-1.5">
            <span className="text-2xl">🏆</span>
            <span className="text-[11px] font-semibold text-slate-300">100 Kotak</span>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={onStart}
          className="group relative inline-flex items-center gap-3 px-8 sm:px-10 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-extrabold text-lg sm:text-xl shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Play className="w-4 h-4 fill-white" />
          </div>
          <span>MULAI BERMAIN</span>
        </button>
      </div>

      {/* Footer Info & Creator Credit */}
      <div className="relative z-10 w-full max-w-3xl pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 text-center sm:text-left">
        <div>
          Informatika Kelas IX SMP • Bab 6 Algoritma dan Pemrograman
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 font-semibold text-slate-300">
          <span>Create By</span>
          <span className="text-cyan-400 font-bold">Andri Ganda Saputra</span>
        </div>
      </div>
    </div>
  );
};
