import React from 'react';

interface PlayerTokenProps {
  isMoving?: boolean;
}

export const PlayerToken: React.FC<PlayerTokenProps> = ({ isMoving = false }) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center transition-all ${
        isMoving ? 'scale-110' : 'animate-pulse'
      }`}
    >
      {/* Outer Glow Ring */}
      <span className="absolute -inset-1 rounded-full bg-cyan-400/40 blur-[3px]" />

      {/* Token Container */}
      <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-cyan-500 via-sky-400 to-blue-600 border-2 border-white flex items-center justify-center shadow-lg shadow-cyan-900/60 select-none">
        <span className="text-sm sm:text-base leading-none">🤖</span>
      </div>

      {/* Tiny active marker */}
      <span className="absolute -bottom-1 w-2 h-2 rounded-full bg-amber-400 border border-slate-900" />
    </div>
  );
};
