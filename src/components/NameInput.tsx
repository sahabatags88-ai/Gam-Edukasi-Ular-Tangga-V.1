import React, { useState } from 'react';
import { User, ArrowRight, Sparkles } from 'lucide-react';

interface NameInputProps {
  onSubmit: (name: string) => void;
  onCancel?: () => void;
}

export const NameInput: React.FC<NameInputProps> = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError('Nama tidak boleh kosong.');
      return;
    }
    if (trimmed.length < 2) {
      setError('Nama harus memiliki minimal 2 karakter.');
      return;
    }

    setError(null);
    onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-center overflow-hidden my-auto">
        {/* Glow corner decorations */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Character Avatar Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/20 mx-auto mb-4">
          <span>🤖</span>
        </div>

        {/* Question Header */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-400 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Profil Pemain</span>
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight mb-2">
          Siapa nama kamu?
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mb-6">
          Masukkan nama kamu untuk memulai petualangan ular tangga algoritma.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Nama Pemain:
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                autoFocus
                maxLength={25}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Contoh: Andi, Budi, Siti..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white font-medium text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
            {error && (
              <span className="text-xs text-rose-400 font-semibold block mt-1.5">
                ⚠️ {error}
              </span>
            )}
          </div>

          <div className="flex gap-2.5 pt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-1/3 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all cursor-pointer"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold text-sm sm:text-base shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>MULAI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
