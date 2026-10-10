import React, { useEffect, useState, useCallback } from 'react';
import {
  Trophy,
  X,
  RefreshCw,
  Medal,
  Crown,
  Flame,
  Target,
  Sparkles,
  AlertCircle,
  WifiOff,
  Calendar,
} from 'lucide-react';
import {
  fetchLeaderboard,
  LeaderboardEntry,
  LeaderboardResult,
} from '../services/leaderboardService';
import { getSupabaseConfigStatus } from '../lib/supabase';
import { audio } from '../utils/audio';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayerName?: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentPlayerName,
}) => {
  const [tabLimit, setTabLimit] = useState<10 | 50>(10);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<'online' | 'offline_unconfigured'>('online');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async (limit: 10 | 50) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result: LeaderboardResult = await fetchLeaderboard(limit);
      setMode(result.mode);

      if (result.success) {
        setEntries(result.entries);
        setLastUpdated(new Date());
      } else {
        setErrorMessage(result.errorMessage || 'Gagal memuat papan peringkat.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi gangguan jaringan.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadData(tabLimit);
    }
  }, [isOpen, tabLimit, loadData]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        audio.buttonClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    audio.buttonClick();
    onClose();
  };

  const handleTabChange = (limit: 10 | 50) => {
    if (limit === tabLimit) return;
    audio.buttonClick();
    setTabLimit(limit);
  };

  const handleRefresh = () => {
    audio.buttonClick();
    loadData(tabLimit);
  };

  const configStatus = getSupabaseConfigStatus();

  // Format Helper: Number
  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num);

  // Format Helper: Date
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '-';
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Grade color badges
  const renderGradeBadge = (grade: string) => {
    const g = grade.toUpperCase();
    if (g === 'S') {
      return (
        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-xs">
          Rank S
        </span>
      );
    }
    if (g === 'A') {
      return (
        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black text-xs">
          Rank A
        </span>
      );
    }
    if (g === 'B') {
      return (
        <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/40 font-black text-xs">
          Rank B
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 border border-slate-600 font-bold text-xs">
        Rank {g || 'C'}
      </span>
    );
  };

  // Rank Badge (1, 2, 3 special highlight)
  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center gap-1 font-black text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
          <Crown className="w-4 h-4 fill-amber-400" />
          <span className="text-sm">#1</span>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center gap-1 font-black text-slate-300">
          <Medal className="w-4 h-4 text-slate-300 fill-slate-300/30" />
          <span className="text-sm">#2</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center gap-1 font-black text-amber-600">
          <Medal className="w-4 h-4 text-amber-600 fill-amber-600/30" />
          <span className="text-sm">#3</span>
        </div>
      );
    }
    return (
      <span className="text-xs font-bold text-slate-400 pl-2">
        #{rank}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="leaderboard-modal-title"
    >
      <div
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow corner decorations */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 px-5 sm:px-6 pt-5 pb-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  LEADERBOARD ONLINE
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Global
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Peringkat skor petualang terbaik Algorithm Quest
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Perbarui data peringkat"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Tutup Leaderboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar (Top 10 / Top 50 Tabs & Status) */}
        <div className="relative z-10 px-5 sm:px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleTabChange(10)}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                tabLimit === 10
                  ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Top 10
            </button>
            <button
              type="button"
              onClick={() => handleTabChange(50)}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                tabLimit === 50
                  ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Top 50
            </button>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            {mode === 'offline_unconfigured' ? (
              <span className="flex items-center gap-1 text-amber-400/90 font-medium bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                <WifiOff className="w-3 h-3" />
                Mode Lokal (Supabase belum terhubung)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Database Online Terkoneksi
              </span>
            )}
            {lastUpdated && !isLoading && (
              <span className="hidden sm:inline text-slate-500">
                • {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* Content Body: Table / Cards */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {/* Offline / Unconfigured Notice */}
          {!configStatus.isConfigured && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Konfigurasi Database Belum Aktif di Lingkungan Ini</p>
                <p className="text-amber-300/80 mt-0.5">
                  Variabel environment Supabase (<code className="font-mono">VITE_SUPABASE_URL</code>) belum tersedia. Permainan tetap berjalan lancar dalam mode lokal, dan leaderboard online akan aktif otomatis setelah kunci dipasang.
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
              </div>
              <p className="text-sm font-bold text-slate-200">Memuat Papan Peringkat...</p>
              <p className="text-xs text-slate-400">Menghubungkan ke Supabase database</p>
            </div>
          )}

          {/* Error State */}
          {!isLoading && errorMessage && (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-3 p-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-rose-300">Gagal Mengambil Data</p>
              <p className="text-xs text-slate-400 max-w-sm">{errorMessage}</p>
              <button
                type="button"
                onClick={handleRefresh}
                className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Coba Lagi</span>
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !errorMessage && entries.length === 0 && (
            <div className="py-14 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
                <Trophy className="w-7 h-7 text-amber-400/60" />
              </div>
              <h3 className="text-base font-bold text-slate-200">Belum Ada Rekor Pertandingan</h3>
              <p className="text-xs text-slate-400 max-w-md">
                Jadilah pemain pertama yang menuntaskan Misi 15 Soal dan mencapai Kotak 100 untuk menorehkan nama di papan peringkat global!
              </p>
            </div>
          )}

          {/* Data List (Table on Desktop, Cards on Mobile) */}
          {!isLoading && !errorMessage && entries.length > 0 && (
            <div className="space-y-2">
              {/* Desktop Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/40 rounded-xl border border-slate-800/60">
                <div className="col-span-1 text-center">Rank</div>
                <div className="col-span-4">Pemain</div>
                <div className="col-span-2 text-right">Skor (XP)</div>
                <div className="col-span-2 text-center">Akurasi</div>
                <div className="col-span-1 text-center">Combo</div>
                <div className="col-span-2 text-right">Tanggal</div>
              </div>

              {/* Rows */}
              {entries.map((entry) => {
                const rank = entry.rank || 1;
                const isTop3 = rank <= 3;
                const isMe =
                  currentPlayerName &&
                  entry.playerName.trim().toLowerCase() === currentPlayerName.trim().toLowerCase();

                return (
                  <div
                    key={entry.id || `${entry.playerName}-${rank}`}
                    className={`rounded-2xl p-3 sm:px-4 sm:py-3 transition-all ${
                      rank === 1
                        ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 border-2 border-amber-500/60 shadow-lg shadow-amber-500/10'
                        : rank === 2
                        ? 'bg-gradient-to-r from-slate-800/60 via-slate-900 to-slate-800/40 border border-slate-600'
                        : rank === 3
                        ? 'bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 border border-amber-700/50'
                        : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
                    } ${isMe ? 'ring-2 ring-cyan-400/80 bg-cyan-950/20' : ''}`}
                  >
                    {/* Desktop View */}
                    <div className="hidden md:grid grid-cols-12 gap-2 items-center text-xs">
                      {/* Rank */}
                      <div className="col-span-1 flex items-center justify-center">
                        {renderRankBadge(rank)}
                      </div>

                      {/* Player Name & Grade */}
                      <div className="col-span-4 flex items-center gap-2 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black ${
                            rank === 1
                              ? 'bg-amber-500 text-slate-950'
                              : rank === 2
                              ? 'bg-slate-300 text-slate-950'
                              : rank === 3
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {entry.playerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate flex items-center gap-1.5">
                          <span
                            className={`font-black truncate ${
                              isTop3 ? 'text-white' : 'text-slate-200'
                            }`}
                          >
                            {entry.playerName}
                          </span>
                          {isMe && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/30 text-cyan-300 font-bold">
                              Kamu
                            </span>
                          )}
                        </div>
                        {renderGradeBadge(entry.grade)}
                      </div>

                      {/* Score */}
                      <div className="col-span-2 text-right font-black text-amber-400 flex items-center justify-end gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{formatNumber(entry.score)}</span>
                      </div>

                      {/* Accuracy */}
                      <div className="col-span-2 flex items-center justify-center gap-1 text-cyan-300 font-bold">
                        <Target className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{Math.round(entry.accuracy)}%</span>
                      </div>

                      {/* Max Combo */}
                      <div className="col-span-1 flex items-center justify-center gap-1 text-orange-400 font-bold">
                        <Flame className="w-3.5 h-3.5 fill-orange-400" />
                        <span>{entry.maxCombo}x</span>
                      </div>

                      {/* Date */}
                      <div className="col-span-2 text-right text-[11px] text-slate-400">
                        {formatDate(entry.createdAt)}
                      </div>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          {renderRankBadge(rank)}
                          <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-xs font-black text-slate-300 shrink-0">
                            {entry.playerName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-black text-sm text-white truncate">
                            {entry.playerName}
                          </span>
                          {isMe && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/30 text-cyan-300 font-bold shrink-0">
                              Kamu
                            </span>
                          )}
                        </div>
                        <div className="shrink-0 font-black text-sm text-amber-400 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{formatNumber(entry.score)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-cyan-300">
                            <Target className="w-3 h-3 text-cyan-400" />
                            {Math.round(entry.accuracy)}%
                          </span>
                          <span className="flex items-center gap-1 text-orange-300">
                            <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                            Combo {entry.maxCombo}x
                          </span>
                          {renderGradeBadge(entry.grade)}
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(entry.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-10 px-5 sm:px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Bab 6: Algoritma dan Pemrograman</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
