import { QuestionDifficulty, GameStats, ScoreCalculationResult, PerformanceGrade } from '../types/game';

export const BASE_XP_MAP: Record<QuestionDifficulty, number> = {
  easy: 100,
  medium: 250,
  hots: 500,
};

// Penalti Jawaban Salah sesuai Section 10
export const PENALTY_XP_MAP: Record<QuestionDifficulty, number> = {
  easy: 25,
  medium: 50,
  hots: 100,
};

export const COMBO_BONUS_MAP: Record<number, number> = {
  1: 0,
  2: 25,
  3: 50,
  4: 75,
  5: 100, // 5 or higher
};

export const getComboBonus = (comboCount: number): number => {
  if (comboCount <= 1) return 0;
  if (comboCount === 2) return 25;
  if (comboCount === 3) return 50;
  if (comboCount === 4) return 75;
  return 100; // max x5
};

export const getStreakBonus = (streakCount: number): { bonus: number; milestone: 3 | 5 | 10 | null } => {
  if (streakCount === 3) return { bonus: 50, milestone: 3 };
  if (streakCount === 5) return { bonus: 100, milestone: 5 };
  if (streakCount === 10) return { bonus: 250, milestone: 10 };
  return { bonus: 0, milestone: null };
};

export const calculateAnswerScore = (
  isCorrect: boolean,
  difficulty: QuestionDifficulty,
  currentStats: GameStats,
  attempt: number = 1
): ScoreCalculationResult => {
  if (isCorrect) {
    const nextCombo = Math.min(5, currentStats.combo + 1);
    const nextStreak = currentStats.streak + 1;
    const nextMaxCombo = Math.max(currentStats.maxCombo, nextCombo);

    // Multiplier XP berdasarkan Attempt (Section 9):
    // Attempt 1: 100%, Attempt 2: 75%, Attempt 3: 50%
    const rate = attempt === 1 ? 1 : attempt === 2 ? 0.75 : 0.5;
    const baseXp = Math.round(BASE_XP_MAP[difficulty] * rate);

    const comboBonus = getComboBonus(nextCombo);
    const { bonus: streakBonus, milestone: isNewStreak } = getStreakBonus(nextStreak);

    const totalGain = baseXp + comboBonus + streakBonus;
    const nextScore = currentStats.score + totalGain;

    const nextStats: GameStats = {
      score: nextScore,
      combo: nextCombo,
      maxCombo: nextMaxCombo,
      streak: nextStreak,
      correctAnswers: currentStats.correctAnswers + 1,
      wrongAnswers: currentStats.wrongAnswers,
      totalQuestionsAnswered: currentStats.totalQuestionsAnswered + 1,
    };

    return {
      nextStats,
      baseXpChange: baseXp,
      comboBonusXp: comboBonus,
      streakBonusXp: streakBonus,
      totalXpChange: totalGain,
      comboLevel: nextCombo,
      isNewStreak,
      comboBroken: false,
      attemptNumber: attempt,
      rewardRate: rate,
    };
  } else {
    // Jawaban Salah: penalti Easy: -25, Medium: -50, HOTS: -100 (Score min: 0)
    const penalty = PENALTY_XP_MAP[difficulty];
    const nextScore = Math.max(0, currentStats.score - penalty);
    const wasComboActive = currentStats.combo > 1;

    const nextStats: GameStats = {
      score: nextScore,
      combo: 0, // reset combo
      maxCombo: currentStats.maxCombo,
      streak: 0, // reset streak
      correctAnswers: currentStats.correctAnswers,
      wrongAnswers: currentStats.wrongAnswers + 1,
      totalQuestionsAnswered: currentStats.totalQuestionsAnswered + 1,
    };

    return {
      nextStats,
      baseXpChange: -penalty,
      comboBonusXp: 0,
      streakBonusXp: 0,
      totalXpChange: -penalty,
      comboLevel: 0,
      isNewStreak: null,
      comboBroken: wasComboActive,
      attemptNumber: attempt,
      rewardRate: 0,
    };
  }
};

export const calculateAccuracy = (correct: number, total: number): string => {
  if (total <= 0) return '--%';
  const percent = Math.round((correct / total) * 100);
  return `${percent}%`;
};

export const getPerformanceGrade = (
  score: number,
  accuracyPercent: number,
  maxCombo: number
): { grade: PerformanceGrade; title: string; desc: string; color: string } => {
  if (score >= 2500 || (accuracyPercent >= 85 && maxCombo >= 4)) {
    return {
      grade: 'S',
      title: 'GRADE S — ALGORITMA MASTER',
      desc: 'Luar Biasa! Pemahaman materi Bab 6 sempurna dengan logika dan analisis tingkat tinggi.',
      color: 'from-amber-400 to-yellow-500 text-slate-950',
    };
  }
  if (score >= 1800 || accuracyPercent >= 75) {
    return {
      grade: 'A',
      title: 'GRADE A — PEMIKIR SISTEMATIS',
      desc: 'Sangat Baik! Pemikiran logis runtut dan berhasil menyelesaikan misi dengan akurasi tinggi.',
      color: 'from-cyan-400 to-blue-500 text-slate-950',
    };
  }
  if (score >= 1200 || accuracyPercent >= 60) {
    return {
      grade: 'B',
      title: 'GRADE B — PEMIKIR KOMPUTASIONAL',
      desc: 'Baik! Konsep algoritma sudah dipahami dengan baik, siap untuk materi pemrograman.',
      color: 'from-emerald-400 to-teal-500 text-slate-950',
    };
  }
  return {
    grade: 'C',
    title: 'GRADE C — PEMULA LOGIKA TANGGUH',
    desc: 'Tuntas! Berhasil menyelesaikan seluruh tantangan. Terus berlatih agar semakin cepat dan presisi.',
    color: 'from-indigo-400 to-purple-500 text-slate-950',
  };
};
