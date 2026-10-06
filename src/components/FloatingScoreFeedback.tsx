import React, { useEffect, useState } from 'react';
import { Sparkles, Flame, Zap } from 'lucide-react';

export interface FloatingFeedbackData {
  id: number;
  type: 'correct' | 'incorrect';
  xpChange: number;
  comboLevel?: number;
  comboBonus?: number;
  comboBroken?: boolean;
  isNewStreak?: number | null;
}

interface FloatingScoreFeedbackProps {
  feedback: FloatingFeedbackData | null;
  onDismiss: () => void;
}

export const FloatingScoreFeedback: React.FC<FloatingScoreFeedbackProps> = ({
  feedback,
  onDismiss,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!feedback) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 2400);

    return () => clearTimeout(timer);
  }, [feedback, onDismiss]);

  if (!feedback || !visible) return null;

  const isCorrect = feedback.type === 'correct';
  const isComboMax = feedback.comboLevel === 5;

  return (
    <aside
      aria-label="Feedback Skor"
      aria-live="polite"
      className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none transition-all duration-300 transform scale-100 opacity-100"
    >
      <div
        className={`animate-floatScore flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border text-sm sm:text-base font-black ${
          isCorrect
            ? isComboMax
              ? 'bg-gradient-to-r from-amber-950/95 via-orange-900/95 to-rose-950/95 border-amber-400 text-amber-200 shadow-orange-500/50 ring-2 ring-amber-400/50 animate-comboMax'
              : 'bg-slate-900/95 border-emerald-500/80 text-emerald-300 shadow-emerald-500/30'
            : 'bg-slate-900/95 border-rose-500/80 text-rose-300 shadow-rose-500/30'
        }`}
      >
        {isCorrect ? (
          <>
            {/* XP Burst Animation (Section 12 & 13) */}
            <span className="flex items-center gap-1.5 text-amber-300 scale-105">
              <Sparkles className="w-5 h-5 fill-amber-300 animate-spin" />
              <span>+{feedback.xpChange} XP</span>
            </span>

            {/* Combo Bonus Display (Section 7: x2=+25, x3=+50, x4=+75, x5=+100) */}
            {feedback.comboBonus && feedback.comboBonus > 0 && (
              <span className="px-2 py-0.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                +{feedback.comboBonus} COMBO BONUS
              </span>
            )}

            {/* Combo Level Badge */}
            {feedback.comboLevel && feedback.comboLevel > 1 && (
              <span
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-xl border text-xs font-black ${
                  isComboMax
                    ? 'bg-gradient-to-r from-red-500/40 to-orange-500/40 text-white border-orange-400 animate-pulse'
                    : 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                }`}
              >
                <Flame className={`w-4 h-4 ${isComboMax ? 'fill-red-400 text-yellow-300' : 'fill-orange-400 text-orange-400'}`} />
                <span>{isComboMax ? '🔥 COMBO MAX! (x5)' : `COMBO x${feedback.comboLevel}`}</span>
              </span>
            )}

            {feedback.isNewStreak && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-xl bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-xs">
                <Zap className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span>Streak {feedback.isNewStreak}!</span>
              </span>
            )}
          </>
        ) : (
          <>
            {/* Penalty Display (Section 12: -25, -50, -100) */}
            <span className="flex items-center gap-1.5 text-rose-400 font-extrabold">
              <span>💥</span>
              <span>{feedback.xpChange} XP</span>
            </span>

            {/* Combo Broken Visual (Section 9) */}
            {feedback.comboBroken && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-950/80 text-rose-300 border border-rose-500/60 text-xs font-black animate-shake">
                <span>💥</span>
                <span>COMBO TERPUTUS! (x0)</span>
              </span>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
