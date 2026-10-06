import React, { useState } from 'react';
import { Dices } from 'lucide-react';
import { audio } from '../utils/audio';

interface DiceProps {
  onRoll: (value: number) => void;
  disabled: boolean;
  lastValue: number | null;
}

export const Dice: React.FC<DiceProps> = ({ onRoll, disabled, lastValue }) => {
  const [displayValue, setDisplayValue] = useState<number>(lastValue || 1);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  const handleRollClick = () => {
    if (disabled || isRolling) return;

    audio.diceRoll();
    setIsRolling(true);

    // Short rolling animation cycling numbers
    let count = 0;
    const interval = setInterval(() => {
      const rand = Math.floor(Math.random() * 6) + 1;
      setDisplayValue(rand);
      count++;

      if (count >= 8) {
        clearInterval(interval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDisplayValue(finalValue);
        setIsRolling(false);
        onRoll(finalValue);
      }
    }, 75);
  };

  // Render dots on the digital dice face
  const renderDiceFace = (val: number) => {
    // 3x3 grid dot positions: [row, col]
    const dotsMap: Record<number, number[][]> = {
      1: [[1, 1]],
      2: [[0, 0], [2, 2]],
      3: [[0, 0], [1, 1], [2, 2]],
      4: [[0, 0], [0, 2], [2, 0], [2, 2]],
      5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
      6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
    };

    const activeDots = dotsMap[val] || dotsMap[1];

    return (
      <div className="w-16 h-16 sm:w-18 sm:h-18 p-2 rounded-2xl bg-white border-2 border-slate-300 shadow-xl shadow-slate-950/50 flex flex-col justify-between">
        {[0, 1, 2].map((r) => (
          <div key={`r-${r}`} className="flex justify-between h-3">
            {[0, 1, 2].map((c) => {
              const hasDot = activeDots.some(([dotR, dotC]) => dotR === r && dotC === c);
              return (
                <div key={`c-${c}`} className="w-3 h-3 flex items-center justify-center">
                  {hasDot ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-900 shadow-inner" />
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const isButtonDisabled = disabled || isRolling;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      {/* Dice Face Box with Dynamic Rolling Animation (Section 14) */}
      <div
        className={`transition-all duration-150 select-none ${
          isRolling
            ? 'rotate-12 scale-110 shadow-2xl ring-4 ring-amber-400/80 animate-bounce'
            : 'hover:scale-105'
        }`}
      >
        {renderDiceFace(displayValue)}
      </div>

      {/* Button: LEMPAR DADU */}
      <button
        type="button"
        onClick={handleRollClick}
        disabled={isButtonDisabled}
        className={`flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl font-black text-base sm:text-lg transition-all duration-200 shadow-xl cursor-pointer ${
          isButtonDisabled
            ? 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed shadow-none'
            : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 active:scale-95'
        }`}
      >
        <Dices className={`w-5 h-5 ${isRolling ? 'animate-spin text-slate-900' : ''}`} />
        <span>{isRolling ? 'Mengocok Dadu...' : '🎲 LEMPAR DADU'}</span>
      </button>
    </div>
  );
};
