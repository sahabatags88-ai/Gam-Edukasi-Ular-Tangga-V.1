import { PlayerProfile, GameStats } from '../types/game';

export const PROFILE_STORAGE_KEY = 'algorithmQuestPlayerProfile';

export interface LevelThreshold {
  level: number;
  xp: number;
}

export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, xp: 0 },
  { level: 2, xp: 500 },
  { level: 3, xp: 1000 },
  { level: 4, xp: 2000 },
  { level: 5, xp: 3500 },
  { level: 6, xp: 5000 },
  { level: 7, xp: 7000 },
  { level: 8, xp: 10000 },
  { level: 9, xp: 15000 },
  { level: 10, xp: 20000 },
];

export interface LevelInfo {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number | null;
  progressPercent: number;
  isMaxLevel: boolean;
}

/**
 * Menghitung level pemain berdasarkan totalXP kumulatif (Section 6 & 7)
 */
export const calculateLevel = (totalXP: number): LevelInfo => {
  const maxThreshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  if (totalXP >= maxThreshold.xp) {
    return {
      level: 10,
      currentLevelXp: maxThreshold.xp,
      nextLevelXp: null,
      progressPercent: 100,
      isMaxLevel: true,
    };
  }

  let currentLevel = 1;
  let currentXp = 0;
  let nextXp = 500;

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i].xp) {
      currentLevel = LEVEL_THRESHOLDS[i].level;
      currentXp = LEVEL_THRESHOLDS[i].xp;
      nextXp = LEVEL_THRESHOLDS[i + 1]?.xp ?? maxThreshold.xp;
      break;
    }
  }

  const span = nextXp - currentXp;
  const progressInLevel = Math.max(0, totalXP - currentXp);
  const progressPercent = span > 0 ? Math.min(100, Math.round((progressInLevel / span) * 100)) : 100;

  return {
    level: currentLevel,
    currentLevelXp: currentXp,
    nextLevelXp: nextXp,
    progressPercent,
    isMaxLevel: false,
  };
};

/**
 * Menghitung akurasi profil (angka bulat 0-100) (Section 8)
 */
export const calculateProfileAccuracy = (correct: number, total: number): number => {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
};

/**
 * Membuat profil awal pemain baru
 */
export const createDefaultProfile = (playerName: string): PlayerProfile => {
  return {
    playerName: playerName.trim(),
    totalXP: 0,
    level: 1,
    accuracy: 0,
    maxCombo: 0,
    totalGames: 0,
    totalQuestionsAnswered: 0,
    totalCorrectAnswers: 0,
    totalWrongAnswers: 0,
    completedQuestions: 0,
    completedMissions: 0,
    bestScore: 0,
    bestAccuracy: 0,
    bestCombo: 0,
    lastPlayedAt: new Date().toISOString(),
  };
};

/**
 * Memuat profil pemain dari localStorage
 */
export const loadPlayerProfile = (): PlayerProfile | null => {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed: PlayerProfile = JSON.parse(raw);
    if (typeof parsed.playerName === 'string' && typeof parsed.totalXP === 'number') {
      // Recalculate level & accuracy to guarantee data integrity
      const levelInfo = calculateLevel(parsed.totalXP);
      parsed.level = levelInfo.level;
      parsed.accuracy = calculateProfileAccuracy(
        parsed.totalCorrectAnswers,
        parsed.totalQuestionsAnswered
      );
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Menyimpan profil pemain ke localStorage
 */
export const savePlayerProfile = (profile: PlayerProfile): void => {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore storage quota error
  }
};

/**
 * Menyinkronkan statistik satu sesi permainan ke profil pemain (Sections 16 & 17)
 */
export const syncGameToProfile = (
  profile: PlayerProfile,
  gameStats: GameStats,
  questionsCleared: number,
  missionTotal: number
): PlayerProfile => {
  const newTotalXP = profile.totalXP + Math.max(0, gameStats.score);
  const newTotalQuestions = profile.totalQuestionsAnswered + gameStats.totalQuestionsAnswered;
  const newCorrectAnswers = profile.totalCorrectAnswers + gameStats.correctAnswers;
  const newWrongAnswers = profile.totalWrongAnswers + gameStats.wrongAnswers;

  const newCompletedQuestions = profile.completedQuestions + questionsCleared;
  const newCompletedMissions =
    profile.completedMissions + (questionsCleared >= missionTotal ? 1 : 0);

  const gameAccuracy =
    gameStats.totalQuestionsAnswered > 0
      ? Math.round((gameStats.correctAnswers / gameStats.totalQuestionsAnswered) * 100)
      : 0;

  const newMaxCombo = Math.max(profile.maxCombo, gameStats.maxCombo);
  const newBestScore = Math.max(profile.bestScore, gameStats.score);
  const newBestAccuracy = Math.max(profile.bestAccuracy, gameAccuracy);
  const newBestCombo = Math.max(profile.bestCombo, gameStats.maxCombo);

  const newLevelInfo = calculateLevel(newTotalXP);
  const overallAccuracy = calculateProfileAccuracy(newCorrectAnswers, newTotalQuestions);

  const updated: PlayerProfile = {
    ...profile,
    totalXP: newTotalXP,
    level: newLevelInfo.level,
    accuracy: overallAccuracy,
    maxCombo: newMaxCombo,
    totalGames: profile.totalGames + 1,
    totalQuestionsAnswered: newTotalQuestions,
    totalCorrectAnswers: newCorrectAnswers,
    totalWrongAnswers: newWrongAnswers,
    completedQuestions: newCompletedQuestions,
    completedMissions: newCompletedMissions,
    bestScore: newBestScore,
    bestAccuracy: newBestAccuracy,
    bestCombo: newBestCombo,
    lastPlayedAt: new Date().toISOString(),
  };

  savePlayerProfile(updated);
  return updated;
};

/**
 * Reset progress profil (Section 18)
 */
export const resetPlayerProfile = (playerName: string = ''): PlayerProfile => {
  const fresh = createDefaultProfile(playerName);
  savePlayerProfile(fresh);
  return fresh;
};
