import React, { useMemo } from 'react';
import { BOARD_GRID_ROWS, getBoardCellsData } from '../config/gameConfig';
import { BoardCell } from './BoardCell';
import { BoardConnectors } from './BoardConnectors';

interface GameBoardProps {
  playerPosition: number;
  isMoving: boolean;
  activeSnakeCell?: number | null;
  activeLadderCell?: number | null;
  isShaking?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  playerPosition,
  isMoving,
  activeSnakeCell = null,
  activeLadderCell = null,
  isShaking = false,
}) => {
  const cellsMap = useMemo(() => {
    const list = getBoardCellsData();
    const map = new Map<number, (typeof list)[0]>();
    list.forEach((c) => map.set(c.number, c));
    return map;
  }, []);

  return (
    <div className={`w-full max-w-4xl mx-auto flex flex-col items-center transition-transform ${isShaking ? 'animate-screenShake' : ''}`}>
      {/* Board Shell Container */}
      <div className={`relative w-full p-2 sm:p-4 rounded-3xl bg-slate-900 border-2 transition-colors duration-300 shadow-2xl backdrop-blur-md overflow-hidden ${
        activeSnakeCell ? 'border-rose-600/80 shadow-rose-950/60' : activeLadderCell ? 'border-emerald-500/80 shadow-emerald-950/60' : 'border-slate-800'
      }`}>
        {/* Subtle background tech pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415510_1px,transparent_1px),linear-gradient(to_bottom,#33415510_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

        {/* Board Cells Grid (10 Columns x 10 Rows) */}
        <div className="relative flex flex-col gap-1 sm:gap-1.5">
          {BOARD_GRID_ROWS.map((rowNumbers, rowIdx) => (
            <div key={`row-${rowIdx}`} className="grid grid-cols-10 gap-1 sm:gap-1.5">
              {rowNumbers.map((num) => {
                const cell = cellsMap.get(num)!;
                const isPlayerHere = playerPosition === num;

                return (
                  <BoardCell
                    key={`cell-${num}`}
                    cell={cell}
                    isPlayerHere={isPlayerHere}
                    isMoving={isMoving}
                  />
                );
              })}
            </div>
          ))}

          {/* SVG Overlay connecting Ladders and Snakes with Lifelike Snakes */}
          <BoardConnectors
            activeSnakeCell={activeSnakeCell}
            activeLadderCell={activeLadderCell}
          />
        </div>
      </div>

      {/* Quick Visual Legend below the board */}
      <div className="mt-3 w-full flex flex-wrap items-center justify-center gap-2 sm:gap-4 px-3 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] sm:text-xs text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700" />
          <span className="text-slate-400">Normal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>🪜</span>
          <span className="text-emerald-400 font-semibold">Tangga (Naik)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>🐍</span>
          <span className="text-rose-400 font-semibold">Ular (Turun)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>🧩</span>
          <span className="text-indigo-400 font-semibold">Misi Puzzle</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>⭐</span>
          <span className="text-amber-400">Bonus</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>🔥</span>
          <span className="text-purple-400">Challenge</span>
        </div>
      </div>
    </div>
  );
};
