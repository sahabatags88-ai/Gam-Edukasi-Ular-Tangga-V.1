import React from 'react';
import {
  User,
  MapPin,
  Target,
  Dices,
  RotateCcw,
  Heart,
  Sparkles,
  Flame,
  Volume2,
  VolumeX,
  CheckCircle2,
  Percent,
  Trophy,
} from 'lucide-react';

interface GameHUDProps {
  playerName: string;
  playerPosition: number;
  diceValue: number | null;
  xp: number;
  lives: number;
  maxLives: number;
  questionsCleared?: number;
  missionTotal?: number;
  accuracy?: string;
  combo?: number;
  soundEnabled?: boolean;
  playerLevel?: number;
  onToggleSound?: () => void;
  onOpenProfile?: () => void;
  onOpenLeaderboard?: () => void;
  onRestart: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  playerName,
  playerPosition,
  diceValue,
  xp,
  lives,
  maxLives,
  questionsCleared = 0,
  missionTotal = 15,
  accuracy = '100%',
  combo = 0,
  soundEnabled = true,
  playerLevel,
  onToggleSound,
  onOpenProfile,
  onOpenLeaderboard,
  onRestart,
}) => {
  return (
    <div className="w-full bg-slate-900/90 border-b border-slate-800 px-3 sm:px-4 py-2.5 sticky top-0 z-30 backdrop-blur-md shadow-md">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2.5 sm:gap-4">
        {/* Left: Player Profile Badge & Lives (Section 20) */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-2.5 p-1 -ml-1 rounded-2xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700/80 transition-all cursor-pointer group text-left"
            title="Klik untuk membuka Profil & Progres Pemain"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 group-hover:border-cyan-400 group-hover:scale-105 flex items-center justify-center text-cyan-400 shrink-0 transition-all">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white leading-tight group-hover:text-cyan-300 transition-colors">
                  {playerName}
                </span>
                {typeof playerLevel === 'number' && (
                  <span className="px-1.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[10px] font-black text-amber-300">
                    LV {playerLevel}
                  </span>
                )}
              </div>

              {/* Lives Hearts Display */}
              <div className="flex items-center gap-1 mt-0.5" title={`${lives} dari ${maxLives} nyawa tersisa`}>
                {Array.from({ length: maxLives }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-3.5 h-3.5 transition-all duration-200 ${
                      i < lives
                        ? 'fill-rose-500 text-rose-500 drop-shadow-[0_0_4px_rgba(244,63,94,0.6)]'
                        : 'fill-slate-800 text-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </button>
        </div>

        {/* Center: Position (100 cell), Mission (15 soal), XP, Combo, Accuracy */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
          {/* Posisi (100 Cell) with Near Victory Tension (Section 21 & 30) */}
          <div className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold ${
            playerPosition >= 95
              ? 'bg-amber-950/80 border-amber-500/80 text-amber-300 animate-pulse'
              : 'bg-slate-950 border-slate-800'
          }`}>
            <span className="text-cyan-400">🏁</span>
            <span className="text-slate-400 hidden xs:inline">POSITION:</span>
            <span className="text-cyan-300 font-bold">{playerPosition} / 100</span>
            {playerPosition >= 95 && playerPosition < 100 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 font-black">
                {playerPosition >= 95 && questionsCleared === missionTotal - 1
                  ? '🔥 FINAL PUSH!'
                  : playerPosition === 99
                  ? 'TINGGAL 1!'
                  : 'HAMPIR SAMPAI!'}
              </span>
            )}
          </div>

          {/* XP Skor */}
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-300">
            <span>⭐</span>
            <span className="text-slate-400 hidden sm:inline">SCORE:</span>
            <span className="font-extrabold">{new Intl.NumberFormat('id-ID').format(xp)}</span>
          </div>

          {/* Combo Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all ${
              combo === 5
                ? 'bg-gradient-to-r from-red-500/30 via-orange-500/30 to-amber-500/30 border-orange-500 text-orange-200 animate-pulse shadow-md shadow-orange-500/30'
                : combo > 1
                ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/20 border-orange-500/50 text-orange-300 animate-pulse shadow-sm shadow-orange-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${combo > 1 ? 'text-orange-400 fill-orange-400' : 'text-slate-500'}`} />
            <span>COMBO x{combo > 0 ? combo : 1}</span>
            {combo === 5 && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-red-500 text-white font-black">MAX</span>
            )}
          </div>

          {/* Misi Soal (15 Questions, Section 19 & 20) with Progress Mini-Bar */}
          <div
            className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              questionsCleared >= missionTotal
                ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300 animate-pulse'
                : questionsCleared === missionTotal - 1
                ? 'bg-amber-950/70 border-amber-500/60 text-amber-300 animate-pulse'
                : 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300'
            }`}
            title="Misi Soal Algoritma yang harus disapu bersih"
          >
            <span>🧩</span>
            <span className="text-slate-400 hidden sm:inline">QUESTIONS:</span>
            <span className="font-bold">
              {questionsCleared} / {missionTotal}
            </span>
            {/* Progress Mini Bar */}
            <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
              <div
                className={`h-full transition-all duration-500 ${
                  questionsCleared >= missionTotal ? 'bg-emerald-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${Math.min(100, (questionsCleared / missionTotal) * 100)}%` }}
              />
            </div>
            {questionsCleared === missionTotal - 1 && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/30 text-amber-200 font-bold">
                1 LAGI!
              </span>
            )}
          </div>

          {/* Dadu */}
          <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
            <Dices className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 hidden sm:inline">Dadu:</span>
            <span className="text-amber-300 font-bold">
              {diceValue !== null ? diceValue : '-'}
            </span>
          </div>

          {/* Akurasi */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
            <Target className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-400">ACCURACY:</span>
            <span className="text-teal-300 font-bold">{accuracy}</span>
          </div>
        </div>

        {/* Right: Profile, Leaderboard, Sound Toggle & Quick Restart Button */}
        <div className="flex items-center gap-1.5">
          {onOpenProfile && (
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm shadow-cyan-500/10"
              title="Buka Profil Pemain"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PROFIL</span>
            </button>
          )}

          {onOpenLeaderboard && (
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm shadow-amber-500/10"
              title="Buka Leaderboard Online"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">RANKING</span>
            </button>
          )}

          {onToggleSound && (
            <button
              type="button"
              onClick={onToggleSound}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors cursor-pointer"
              title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onRestart}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
            title="Mulai Ulang Permainan Baru"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Ulangi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
