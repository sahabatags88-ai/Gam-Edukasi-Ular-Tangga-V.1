import React from 'react';

interface GameMessageProps {
  status: string;
}

export const GameMessage: React.FC<GameMessageProps> = ({ status }) => {
  return (
    <div className="w-full max-w-md py-3 px-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md text-center text-sm sm:text-base font-semibold text-slate-200 animate-fadeIn">
      <span>{status}</span>
    </div>
  );
};
