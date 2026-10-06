import React from 'react';
import { RotateCcw, Heart, ShieldAlert } from 'lucide-react';

interface LivesOverModalProps {
  onRetry: () => void;
}

export const LivesOverModal: React.FC<LivesOverModalProps> = ({ onRetry }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm bg-slate-900 border border-rose-500/50 rounded-3xl shadow-2xl p-6 sm:p-7 text-center overflow-hidden my-auto text-slate-100">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Broken Heart Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-500/60 flex items-center justify-center text-3xl shadow-lg shadow-rose-950/60 mx-auto mb-3">
          <span>💔</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-black uppercase tracking-wider mb-2">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Nyawa Habis</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
          Kesempatanmu habis.
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
          Jangan menyerah! Kesalahan adalah bagian alami dari proses belajar algoritma dan berpikir komputasional.
        </p>

        {/* Retry Button */}
        <button
          type="button"
          onClick={onRetry}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-rose-500/30 hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>COBA LAGI</span>
        </button>
      </div>
    </div>
  );
};
