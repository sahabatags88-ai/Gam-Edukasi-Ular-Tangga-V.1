import React, { useState, useEffect, useRef } from 'react';
import {
  PuzzleQuestion,
  QuestionDifficulty,
  ScoreCalculationResult,
} from '../types/game';
import {
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Flame,
  Heart,
  Zap,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { audio } from '../utils/audio';

interface PuzzleModalProps {
  puzzle: PuzzleQuestion;
  livesRemaining: number;
  missionNumber?: number;
  missionTotal?: number;
  currentCombo?: number;
  onAnswerSubmit?: (
    isCorrect: boolean,
    difficulty: QuestionDifficulty,
    attempt: number
  ) => ScoreCalculationResult;
  onSuccess?: (xp: number) => void;
  onFailAttempt?: () => void;
  onContinue: (isCleared: boolean) => void;
}

export const PuzzleModal: React.FC<PuzzleModalProps> = ({
  puzzle,
  livesRemaining,
  missionNumber = 1,
  missionTotal = 15,
  currentCombo = 0,
  onAnswerSubmit,
  onSuccess,
  onFailAttempt,
  onContinue,
}) => {
  // Local interaction states
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedBool, setSelectedBool] = useState<boolean | null>(null);
  const [orderedItems, setOrderedItems] = useState<{ id: number; text: string }[]>(() =>
    puzzle.items ? [...puzzle.items] : []
  );
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);

  // 3-Attempts & State Management (Sections 7-10)
  const [attempts, setAttempts] = useState<number>(0);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [scoreResult, setScoreResult] = useState<ScoreCalculationResult | null>(null);

  // 2-Minute Timer State (120 seconds, Sections 11-14)
  const [timeRemaining, setTimeRemaining] = useState<number>(120);
  const [isTimeout, setIsTimeout] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer Countdown Effect
  useEffect(() => {
    // Only run when not submitted and not timed out and not finished
    if (submitted && (isCorrect || attempts >= 3)) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (isTimeout) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeExpired();
          return 0;
        }

        // Warning tick in last 10 seconds (Section 12)
        if (prev <= 11 && prev > 1) {
          audio.timerTick();
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [submitted, isCorrect, attempts, isTimeout]);

  // Handle Timeout (Section 13)
  const handleTimeExpired = () => {
    audio.timeout();
    audio.attemptsExhausted();
    setIsTimeout(true);
    setAttempts(3);
    setIsCorrect(false);
    setSubmitted(true);

    if (onAnswerSubmit) {
      const res = onAnswerSubmit(false, puzzle.difficulty, 3);
      setScoreResult(res);
    } else {
      onFailAttempt?.();
    }
  };

  // Format time mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Ordering controls: Move Up / Down
  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (submitted && (isCorrect || attempts >= 3 || isTimeout)) return;
    audio.buttonClick();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedItems.length) return;

    const updated = [...orderedItems];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setOrderedItems(updated);
  };

  // Helper to normalize answer (e.g. 'A' -> 0, 'B' -> 1, 'C' -> 2, 'D' -> 3, or number)
  const getTargetIndex = (ans: string | number): number => {
    if (typeof ans === 'number') return ans;
    const trimmed = String(ans).trim().toUpperCase();
    if (trimmed === 'A') return 0;
    if (trimmed === 'B') return 1;
    if (trimmed === 'C') return 2;
    if (trimmed === 'D') return 3;
    const parsed = parseInt(trimmed, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Evaluate Answer Submission
  const handleSubmitAnswer = () => {
    if (submitted && (isCorrect || attempts >= 3 || isTimeout)) return;

    let correct = false;

    if (puzzle.type === 'trueFalse') {
      if (selectedBool === null && selectedOption === null) return;
      const chosen = selectedBool !== null ? selectedBool : selectedOption === 0;
      const expected =
        typeof puzzle.isTrue === 'boolean'
          ? puzzle.isTrue
          : puzzle.correctAnswer === 'A' ||
            puzzle.correctAnswer === 0 ||
            String(puzzle.correctAnswer).toLowerCase() === 'benar';
      correct = chosen === expected;
    } else if (puzzle.options && puzzle.options.length > 0) {
      if (selectedOption === null) return;
      const targetIdx = getTargetIndex(puzzle.correctAnswer);
      correct = selectedOption === targetIdx;
    } else if (puzzle.type === 'ordering' && puzzle.correctOrder) {
      const currentIds = orderedItems.map((item) => item.id);
      correct = currentIds.every((id, idx) => id === puzzle.correctOrder![idx]);
    } else if (puzzle.type === 'findError' && puzzle.correctStepId !== undefined) {
      if (selectedStepId === null) return;
      correct = selectedStepId === puzzle.correctStepId;
    }

    const currentAttempts = attempts + 1;
    setAttempts(currentAttempts);
    setIsCorrect(correct);
    setSubmitted(true);

    let res: ScoreCalculationResult | null = null;
    if (onAnswerSubmit) {
      res = onAnswerSubmit(correct, puzzle.difficulty, currentAttempts);
      setScoreResult(res);
    } else {
      if (correct) {
        onSuccess?.(puzzle.xp);
      } else {
        onFailAttempt?.();
      }
    }

    if (correct) {
      // Clear timer on victory
      if (timerRef.current) clearInterval(timerRef.current);

      if (res?.isNewStreak) {
        audio.streak();
      } else if (res && res.comboLevel > 1) {
        audio.combo();
      } else {
        audio.correct();
      }
    } else {
      if (currentAttempts >= 3) {
        if (timerRef.current) clearInterval(timerRef.current);
        audio.attemptsExhausted();
      } else {
        audio.incorrect();
      }
    }
  };

  // Retry when wrong on Attempt 1 or Attempt 2 (Section 7)
  const handleRetry = () => {
    audio.buttonClick();
    setSubmitted(false);
    // Keep answers available to change, reset previous choice state if desired
    setSelectedOption(null);
    setSelectedBool(null);
    setSelectedStepId(null);
    setScoreResult(null);
  };

  // Handle continuing game (cleared question)
  const handleFinalContinue = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    audio.buttonClick();
    onContinue(isCorrect || attempts >= 3 || isTimeout);
  };

  const isHots = puzzle.difficulty === 'hots';

  const getDifficultyBadge = () => {
    switch (puzzle.difficulty) {
      case 'easy':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
            🟢 EASY (+{puzzle.xp} XP)
          </span>
        );
      case 'medium':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider">
            🟡 MEDIUM (+{puzzle.xp} XP)
          </span>
        );
      case 'hots':
        return (
          <span className="px-3 py-1 rounded-full bg-rose-500/30 text-rose-200 border-2 border-rose-500 text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5 shadow-lg shadow-rose-600/30">
            <Flame className="w-4 h-4 text-rose-400 fill-rose-400 animate-bounce" />
            <span>🔥 HOTS (+{puzzle.xp} XP)</span>
          </span>
        );
    }
  };

  // Text representation of the correct answer for the final reveal (Attempt 3 / Timeout)
  const getCorrectAnswerText = (): string => {
    if (puzzle.type === 'trueFalse') {
      const expected =
        typeof puzzle.isTrue === 'boolean'
          ? puzzle.isTrue
          : puzzle.correctAnswer === 'A' ||
            puzzle.correctAnswer === 0 ||
            String(puzzle.correctAnswer).toLowerCase() === 'benar';
      return expected ? 'BENAR (Pernyataan benar sesuai konsep)' : 'SALAH (Pernyataan tidak tepat)';
    }

    if (puzzle.options && puzzle.options.length > 0) {
      const idx = getTargetIndex(puzzle.correctAnswer);
      if (idx >= 0 && idx < puzzle.options.length) {
        return `${String.fromCharCode(65 + idx)}. ${puzzle.options[idx]}`;
      }
    }

    if (puzzle.type === 'ordering' && puzzle.items && puzzle.correctOrder) {
      return puzzle.correctOrder
        .map((stepId, i) => {
          const itm = puzzle.items!.find((it) => it.id === stepId);
          return `${i + 1}. ${itm ? itm.text : ''}`;
        })
        .join(' ➔ ');
    }
    if (puzzle.type === 'findError' && puzzle.steps) {
      const faulty = puzzle.steps.find((st) => st.id === puzzle.correctStepId);
      return faulty ? faulty.text : 'Langkah bermasalah';
    }
    return String(puzzle.correctAnswer);
  };

  // Determine if form is ready to submit
  const isFormValid = () => {
    if (submitted) return false;
    if (isTimeout) return false;
    if (puzzle.type === 'trueFalse') {
      return selectedBool !== null || selectedOption !== null;
    }
    if (puzzle.options && puzzle.options.length > 0) {
      return selectedOption !== null;
    }
    if (puzzle.type === 'ordering') {
      return true;
    }
    if (puzzle.type === 'findError') {
      return selectedStepId !== null;
    }
    return false;
  };

  // Feedback Title & Text based on attempt (Section 7, 8, 15)
  const getFeedbackDetails = () => {
    if (isCorrect) {
      if (attempts === 1) {
        return {
          title: '🔥 FAST ANSWER! TEPAT SEKALI!',
          subtitle: 'Jawaban sempurna pada percobaan pertama! Reward 100% penuh.',
        };
      }
      if (attempts === 2) {
        return {
          title: '👍 GOOD ANSWER! BERHASIL!',
          subtitle: 'Analisis diperbaiki dengan baik pada percobaan kedua (Reward 75%).',
        };
      }
      return {
        title: '✅ NICE RECOVERY! BERHASIL!',
        subtitle: 'Bagus, kamu pantang menyerah dan berhasil di percobaan ketiga (Reward 50%).',
      };
    }

    // Wrong Answers
    if (isTimeout) {
      return {
        title: '⏰ WAKTU HABIS!',
        subtitle: 'Waktu 2 menit telah berakhir. Perhatikan pembahasan di bawah ini untuk belajar.',
      };
    }
    if (attempts === 1) {
      return {
        title: '❌ BELUM TEPAT (Percobaan 1/3)',
        subtitle: 'Coba lagi. Perhatikan kata kunci pada soal.',
      };
    }
    if (attempts === 2) {
      return {
        title: '❌ MASIH BELUM TEPAT (Percobaan 2/3)',
        subtitle: 'Periksa kembali urutan atau logika algoritmanya.',
      };
    }
    return {
      title: '❌ 3 PERCOBAAN HABIS',
      subtitle: 'Jangan khawatir, ini bagian dari proses belajar. Simak kunci jawaban & pembahasan berikut:',
    };
  };

  const feedback = getFeedbackDetails();

  // ONLY show green correct answer highlights if user was correct OR 3 attempts were exhausted / timeout
  const canRevealAnswers = isCorrect || attempts >= 3 || isTimeout;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className={`relative w-full max-w-lg bg-slate-900 border rounded-3xl shadow-2xl p-5 sm:p-7 overflow-hidden my-auto text-slate-100 transition-all ${
        isHots ? 'border-rose-500/80 shadow-rose-950/60 ring-1 ring-rose-500/40' : 'border-slate-800'
      }`}>
        {/* Glow corners */}
        <div className={`absolute top-0 right-0 w-44 h-44 rounded-full blur-2xl pointer-events-none ${isHots ? 'bg-rose-500/20' : 'bg-cyan-500/10'}`} />
        <div className="absolute bottom-0 left-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* HOTS Challenge Top Banner (Section 10 & 11) */}
        {isHots && (
          <div className="relative z-10 mb-3 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 border border-rose-500/60 flex items-center justify-between text-xs font-black text-rose-200 shadow-md">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
              <span>⚡ CHALLENGE: BUKTIKAN ANALISIS ALGORITMAMU!</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300">
              HIGH ORDER THINKING
            </span>
          </div>
        )}

        {/* Modal Header: Mission Counter + Timer + Difficulty */}
        <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-800 mb-4 gap-2">
          {/* Mission Counter Badge */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧩</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                  MISI SOAL
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-black">
                  {missionNumber} / {missionTotal}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                Pahami dan selesaikan tantangan logika.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 2-Minute Timer Display (Sections 11-14) */}
            <div
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl border text-xs font-mono font-black transition-all ${
                timeRemaining <= 10
                  ? 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse ring-2 ring-rose-500/50'
                  : timeRemaining <= 30
                  ? 'bg-amber-950/80 border-amber-500/80 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-cyan-300'
              }`}
              title="Waktu pengerjaan soal (Maksimal 2 menit)"
            >
              <Clock className={`w-3.5 h-3.5 ${timeRemaining <= 10 ? 'animate-spin' : ''}`} />
              <span>{formatTime(timeRemaining)}</span>
            </div>

            {getDifficultyBadge()}
          </div>
        </div>

        {/* Timer Progress Bar */}
        <div className="relative z-10 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full transition-all duration-1000 ${
              timeRemaining <= 10
                ? 'bg-rose-500'
                : timeRemaining <= 30
                ? 'bg-amber-500'
                : 'bg-cyan-500'
            }`}
            style={{ width: `${(timeRemaining / 120) * 100}%` }}
          />
        </div>

        {/* Timer Warnings (Section 12) */}
        {!submitted && timeRemaining <= 30 && timeRemaining > 10 && (
          <div className="relative z-10 mb-3 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>⚠️ WAKTU TINGGAL 30 DETIK! Segera tentukan jawabanmu.</span>
          </div>
        )}

        {!submitted && timeRemaining <= 10 && timeRemaining > 0 && (
          <div className="relative z-10 mb-3 px-3 py-1.5 rounded-xl bg-rose-500/25 border border-rose-500/60 text-rose-200 text-xs font-extrabold flex items-center gap-1.5 animate-pulse">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>⚠️ WAKTU KRITIS: {timeRemaining} DETIK TERSISA!</span>
          </div>
        )}

        {/* Puzzle Context & Prompt */}
        <div className="relative z-10 mb-4">
          <h3 className="text-base sm:text-lg font-bold text-white mb-2">
            {puzzle.title || puzzle.topic}
          </h3>

          {(puzzle.context || puzzle.scenario) && (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-300 whitespace-pre-line leading-relaxed mb-3 font-mono">
              {puzzle.context || puzzle.scenario}
            </div>
          )}

          <p className="text-sm sm:text-base text-slate-200 font-semibold leading-relaxed">
            {puzzle.prompt || puzzle.question}
          </p>
        </div>

        {/* Interactive Input Form */}
        <div className="relative z-10 mb-5">
          {/* Option-based questions: Multiple Choice, Ordering with options, Find Error with options, etc. */}
          {puzzle.type !== 'trueFalse' && puzzle.options && puzzle.options.length > 0 && (
            <div className="flex flex-col gap-2">
              {puzzle.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const targetIdx = getTargetIndex(puzzle.correctAnswer);
                const isCorrectAnswer = idx === targetIdx;

                let style = 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-200';

                if (submitted) {
                  if (canRevealAnswers) {
                    // Only highlight green if question is cleared or attempts exhausted
                    if (isCorrectAnswer) {
                      style = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-semibold';
                    } else if (isSelected && !isCorrectAnswer) {
                      style = 'bg-rose-950/80 border-rose-500 text-rose-200';
                    } else {
                      style = 'bg-slate-950/30 border-slate-900 text-slate-600 opacity-60';
                    }
                  } else {
                    // Attempt 1 or 2 failed: NO SPOILER. Only mark the wrongly selected one red.
                    if (isSelected) {
                      style = 'bg-rose-950/80 border-rose-500 text-rose-200 font-medium';
                    }
                  }
                } else if (isSelected) {
                  style = 'bg-cyan-950/80 border-cyan-400 text-white font-semibold ring-2 ring-cyan-500/40';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={submitted && (canRevealAnswers || isCorrect)}
                    onClick={() => {
                      audio.buttonClick();
                      setSelectedOption(idx);
                    }}
                    className={`flex items-start gap-3 p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${style}`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-xs sm:text-sm leading-relaxed flex-1">{opt}</span>

                    {submitted && canRevealAnswers && isCorrectAnswer && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    {submitted && isSelected && !isCorrectAnswer && (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* TYPE 2: True / False */}
          {puzzle.type === 'trueFalse' && (() => {
            const isTrueExpected =
              typeof puzzle.isTrue === 'boolean'
                ? puzzle.isTrue
                : puzzle.correctAnswer === 'A' ||
                  puzzle.correctAnswer === 0 ||
                  String(puzzle.correctAnswer).toLowerCase() === 'benar';
            return (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  disabled={submitted && (canRevealAnswers || isCorrect)}
                  onClick={() => {
                    audio.buttonClick();
                    setSelectedBool(true);
                  }}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 font-black text-sm sm:text-base transition-all cursor-pointer ${
                    submitted
                      ? canRevealAnswers
                        ? isTrueExpected
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                          : selectedBool === true
                          ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                          : 'bg-slate-950/40 border-slate-900 text-slate-600'
                        : selectedBool === true && !isTrueExpected
                        ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300'
                      : selectedBool === true
                      ? 'bg-cyan-950/80 border-cyan-400 text-white ring-2 ring-cyan-500/40'
                      : 'bg-slate-950/70 hover:bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="text-3xl">👍</span>
                  <span>BENAR</span>
                </button>

                <button
                  type="button"
                  disabled={submitted && (canRevealAnswers || isCorrect)}
                  onClick={() => {
                    audio.buttonClick();
                    setSelectedBool(false);
                  }}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 font-black text-sm sm:text-base transition-all cursor-pointer ${
                    submitted
                      ? canRevealAnswers
                        ? !isTrueExpected
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                          : selectedBool === false
                          ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                          : 'bg-slate-950/40 border-slate-900 text-slate-600'
                        : selectedBool === false && isTrueExpected
                        ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300'
                      : selectedBool === false
                      ? 'bg-cyan-950/80 border-cyan-400 text-white ring-2 ring-cyan-500/40'
                      : 'bg-slate-950/70 hover:bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="text-3xl">👎</span>
                  <span>SALAH</span>
                </button>
              </div>
            );
          })()}

          {/* TYPE 3: Ordering with Up / Down buttons */}
          {puzzle.type === 'ordering' && (
            <div className="flex flex-col gap-2">
              <span className="text-xs text-slate-400 font-medium mb-1">
                Gunakan tombol ⬆️ dan ⬇️ untuk menyusun urutan langkah dari awal:
              </span>
              {orderedItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-slate-950/80 border border-slate-800 gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-200">{item.text}</span>
                  </div>

                  {(!submitted || (!canRevealAnswers && !isCorrect)) && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveItem(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Geser ke Atas"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveItem(idx, 'down')}
                        disabled={idx === orderedItems.length - 1}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Geser ke Bawah"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TYPE 4: findError (Click the faulty or misplaced step) */}
          {puzzle.type === 'findError' && puzzle.steps && (
            <div className="flex flex-col gap-2">
              <span className="text-xs text-slate-400 font-medium mb-1">
                Pilih salah satu langkah yang salah atau tidak pada urutan yang benar:
              </span>
              {puzzle.steps.map((st) => {
                const isSelected = selectedStepId === st.id;
                const isCorrectWrongStep = st.id === puzzle.correctStepId;

                let style = 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-200';

                if (submitted) {
                  if (canRevealAnswers) {
                    if (isCorrectWrongStep) {
                      style = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-semibold';
                    } else if (isSelected && !isCorrectWrongStep) {
                      style = 'bg-rose-950/80 border-rose-500 text-rose-200';
                    } else {
                      style = 'bg-slate-950/30 border-slate-900 text-slate-600 opacity-60';
                    }
                  } else if (isSelected) {
                    style = 'bg-rose-950/80 border-rose-500 text-rose-200';
                  }
                } else if (isSelected) {
                  style = 'bg-cyan-950/80 border-cyan-400 text-white font-semibold ring-2 ring-cyan-500/40';
                }

                return (
                  <button
                    key={st.id}
                    type="button"
                    disabled={submitted && (canRevealAnswers || isCorrect)}
                    onClick={() => {
                      audio.buttonClick();
                      setSelectedStepId(st.id);
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${style}`}
                  >
                    <span className="text-xs sm:text-sm">{st.text}</span>
                    {submitted && canRevealAnswers && isCorrectWrongStep && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 ml-2" />
                    )}
                    {submitted && isSelected && !isCorrectWrongStep && (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* FEEDBACK SECTION (Sections 7-10, 15) */}
        {submitted && (
          <div
            className={`p-4 rounded-2xl border mb-5 animate-fadeIn ${
              isCorrect
                ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200'
                : 'bg-rose-950/50 border-rose-500/60 text-rose-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2 font-black text-sm sm:text-base">
                <span>{isCorrect ? '🎉' : '💡'}</span>
                <span className={isCorrect ? 'text-emerald-300' : 'text-amber-300'}>
                  {feedback.title}
                </span>
              </div>

              {/* Reward / Penalty Badges */}
              {isCorrect ? (
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {scoreResult && scoreResult.comboBonusXp > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[11px] font-extrabold flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                      <span>Combo x{scoreResult.comboLevel} (+{scoreResult.comboBonusXp} XP)</span>
                    </span>
                  )}
                  {scoreResult && scoreResult.streakBonusXp > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[11px] font-extrabold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span>Streak {scoreResult.isNewStreak}! (+{scoreResult.streakBonusXp} XP)</span>
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold">
                    +{scoreResult ? scoreResult.totalXpChange : puzzle.xp} XP
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {scoreResult && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-extrabold">
                      {scoreResult.baseXpChange} XP
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Subtitle / Clue feedback */}
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-2 font-medium">
              {feedback.subtitle}
            </p>

            {/* Combo Broken Alert */}
            {!isCorrect && scoreResult && scoreResult.comboBroken && (
              <div className="mb-2 px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-500/50 flex items-center gap-2 text-xs font-bold text-rose-300">
                <span>💥</span>
                <span>COMBO TERPUTUS! Runtutan jawaban benar di-reset ke 0.</span>
              </div>
            )}

            {/* Answer & Explanation: ONLY REVEALED ON ATTEMPT 3 OR CORRECT OR TIMEOUT (Section 7) */}
            {canRevealAnswers && (
              <div className="mt-3 pt-3 border-t border-slate-700/60 flex flex-col gap-2">
                {!isCorrect && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/40 text-xs sm:text-sm">
                    <strong className="text-emerald-300 block mb-1">✅ KUNCI JAWABAN BENAR:</strong>
                    <span className="text-slate-100 font-semibold">{getCorrectAnswerText()}</span>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <strong className="text-slate-100 block mb-1">💡 PENJELASAN LENGKAP:</strong>
                  {puzzle.explanation}
                </div>

                {puzzle.conceptSummary && (
                  <div className="flex items-start gap-1.5 text-xs text-cyan-300 font-medium">
                    <Lightbulb className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
                    <span>{puzzle.conceptSummary}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal Action Footer */}
        <div className="relative z-10 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          {/* Attempts counter indicator */}
          <div className="text-xs text-slate-400 font-medium">
            {!submitted && `Percobaan: ${attempts + 1} / 3`}
            {submitted && isCorrect && `🎉 Selesai di percobaan ${attempts} (Sapu Bersih!)`}
            {submitted && !isCorrect && attempts < 3 && !isTimeout && (
              <span className="text-amber-400 font-bold">
                Percobaan tersisa: {3 - attempts} (Tanpa Spoiler)
              </span>
            )}
            {submitted && !isCorrect && (attempts >= 3 || isTimeout) && (
              <span className="text-slate-400">Soal dituntaskan (3/3 Percobaan)</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* If not submitted yet: JAWAB MISI */}
            {!submitted && !isTimeout && (
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={!isFormValid()}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-102 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {puzzle.type === 'ordering' ? 'PERIKSA URUTAN' : 'JAWAB MISI'}
              </button>
            )}

            {/* If answered wrong on attempt 1 or 2: COBA LAGI (No Spoiler) */}
            {submitted && !isCorrect && attempts < 3 && !isTimeout && (
              <button
                type="button"
                onClick={handleRetry}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 hover:scale-102 active:scale-98 transition-all cursor-pointer"
              >
                COBA LAGI (Percobaan {attempts + 1}/3)
              </button>
            )}

            {/* If answered correctly OR failed all 3 attempts OR timed out: LANJUTKAN PERMAINAN */}
            {submitted && (isCorrect || attempts >= 3 || isTimeout) && (
              <button
                type="button"
                onClick={handleFinalContinue}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-102 active:scale-98 transition-all cursor-pointer"
              >
                LANJUTKAN PERMAINAN
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
