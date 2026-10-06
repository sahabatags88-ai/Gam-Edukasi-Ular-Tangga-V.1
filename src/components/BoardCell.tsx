import React from 'react';
import { BoardCellData } from '../types/game';
import { PlayerToken } from './PlayerToken';

interface BoardCellProps {
  cell: BoardCellData;
  isPlayerHere: boolean;
  isMoving: boolean;
}

export const BoardCell: React.FC<BoardCellProps> = ({
  cell,
  isPlayerHere,
  isMoving,
}) => {
  const getCellVisual = () => {
    switch (cell.type) {
      case 'start':
        return {
          bg: 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300',
          icon: '🚩',
          subLabel: 'START',
          badgeColor: 'text-emerald-400 bg-emerald-950/90 border-emerald-500/60',
        };
      case 'finish':
        return {
          bg: 'bg-amber-950/90 border-amber-400 text-amber-200 animate-pulse',
          icon: '🏆',
          subLabel: 'FINISH',
          badgeColor: 'text-amber-300 bg-amber-950/90 border-amber-400/80',
        };
      case 'ladder':
        return {
          bg: 'bg-teal-950/70 border-teal-500/70 text-teal-300',
          icon: '🪜',
          subLabel: `▲${cell.target}`,
          badgeColor: 'text-teal-300 bg-teal-950/90 border-teal-500/50',
        };
      case 'snake':
        return {
          bg: 'bg-rose-950/70 border-rose-500/70 text-rose-300',
          icon: '🐍',
          subLabel: `▼${cell.target}`,
          badgeColor: 'text-rose-300 bg-rose-950/90 border-rose-500/50',
        };
      case 'puzzle':
        return {
          bg: 'bg-indigo-950/70 border-indigo-500/60 text-indigo-300',
          icon: '🧩',
          subLabel: 'Puzzle',
          badgeColor: 'text-indigo-300 bg-indigo-950/90 border-indigo-500/50',
        };
      case 'bonus':
        return {
          bg: 'bg-amber-950/60 border-amber-500/60 text-amber-300',
          icon: '⭐',
          subLabel: 'Bonus',
          badgeColor: 'text-amber-300 bg-amber-950/90 border-amber-500/50',
        };
      case 'challenge':
        return {
          bg: 'bg-purple-950/70 border-purple-500/60 text-purple-300',
          icon: '🔥',
          subLabel: 'Challenge',
          badgeColor: 'text-purple-300 bg-purple-950/90 border-purple-500/50',
        };
      case 'normal':
      default:
        return {
          bg: 'bg-slate-900/80 border-slate-800 text-slate-300',
          icon: null,
          subLabel: '',
          badgeColor: 'text-slate-400',
        };
    }
  };

  const visual = getCellVisual();
  const isPuzzleTile = cell.type === 'puzzle';

  return (
    <div
      className={`relative aspect-square flex flex-col justify-between p-1 sm:p-1.5 rounded-xl border transition-all duration-200 select-none overflow-hidden ${
        visual.bg
      } ${
        isPlayerHere
          ? 'ring-2 sm:ring-4 ring-cyan-400 ring-offset-1 sm:ring-offset-2 ring-offset-slate-950 z-20 shadow-lg shadow-cyan-500/40 scale-105'
          : 'hover:brightness-110'
      } ${isPuzzleTile && !isPlayerHere ? 'hover:scale-102 hover:border-indigo-400' : ''}`}
    >
      {/* Top Header: Cell Number and Sub-Badge */}
      <div className="flex items-center justify-between w-full leading-none">
        <span className="font-extrabold text-[10px] sm:text-xs text-white/90 font-mono tracking-tight">
          {cell.number}
        </span>

        {visual.subLabel && (
          <span
            className={`text-[8px] sm:text-[9px] font-bold px-1 py-0.5 rounded border leading-none ${visual.badgeColor}`}
          >
            {visual.subLabel}
          </span>
        )}
      </div>

      {/* Center: Tile Icon */}
      <div className="my-auto flex items-center justify-center">
        {visual.icon && (
          <span
            className={`text-sm sm:text-lg md:text-xl drop-shadow select-none ${
              isPuzzleTile ? 'hover:scale-110 transition-transform' : ''
            }`}
          >
            {visual.icon}
          </span>
        )}
      </div>

      {/* Bottom Area: Reserved for Player Token */}
      <div className="h-4 sm:h-5 flex items-center justify-center relative">
        {isPlayerHere && (
          <div className="absolute -top-2 sm:-top-3 z-30">
            <PlayerToken isMoving={isMoving} />
          </div>
        )}
      </div>
    </div>
  );
};
