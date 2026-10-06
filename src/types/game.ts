export type CellType =
  | 'normal'
  | 'ladder'
  | 'snake'
  | 'puzzle'
  | 'bonus'
  | 'challenge'
  | 'start'
  | 'finish';

export interface LadderConfig {
  from: number;
  to: number;
}

export interface SnakeConfig {
  from: number;
  to: number;
}

export interface BoardCellData {
  number: number;
  type: CellType;
  label?: string;
  target?: number;
}

export type GameScreen = 'landing' | 'name-input' | 'playing' | 'finish';

export type QuestionDifficulty = 'easy' | 'medium' | 'hots';

export type QuestionType =
  | 'multipleChoice'
  | 'trueFalse'
  | 'ordering'
  | 'findError'
  | 'bestAlgorithm'
  | 'consequence';

export interface Question {
  id: string;
  difficulty: QuestionDifficulty;
  type: QuestionType;
  topic: string;
  skill: string;
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  correctFeedback: string;
  incorrectFeedback: string;
  xp: number;
  context?: string;
  // Optional helpers for interactive UI & visual puzzles
  title?: string;
  prompt?: string;
  scenario?: string;
  conceptSummary?: string;
  items?: { id: number; text: string }[];
  correctOrder?: number[];
  steps?: { id: number; text: string }[];
  correctStepId?: number;
  isTrue?: boolean;
  visual?: {
    type: 'robotGrid';
    grid: {
      rows: number;
      cols: number;
      robot: { r: number; c: number };
      target: { r: number; c: number };
      obstacles?: { r: number; c: number }[];
    };
  };
}

// Compatibility alias
export type PuzzleQuestion = Question;
export type PuzzleDifficulty = QuestionDifficulty;
export type PuzzleType = QuestionType;

export interface UsedQuestionsMap {
  easy: string[];
  medium: string[];
  hots: string[];
}

export interface AntiRepeatState {
  usedQuestions: UsedQuestionsMap;
  lastQuestionId: string | null;
}

export interface ScoreCalculationResult {
  nextStats: GameStats;
  baseXpChange: number;
  comboBonusXp: number;
  streakBonusXp: number;
  totalXpChange: number;
  comboLevel: number;
  isNewStreak: 3 | 5 | 10 | null;
  comboBroken: boolean;
  attemptNumber?: number;
  rewardRate?: number;
}

export interface GameStats {
  score: number; // XP
  combo: number;
  maxCombo: number;
  streak: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalQuestionsAnswered: number;
}

export type PerformanceGrade = 'S' | 'A' | 'B' | 'C';

export interface MissionState {
  missionTotal: number;
  questionsCleared: number;
  selectedQuestionIds: string[];
  clearedQuestionIds: string[];
}

export interface SavedGameState {
  boardSize: number;
  missionTotal: number;
  questionsCleared: number;
  selectedQuestionIds: string[];
  clearedQuestionIds: string[];
  playerName: string;
  position: number;
  score: number;
  combo: number;
  maxCombo: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalQuestionsAnswered: number;
  soundEnabled: boolean;
  gameStatus: string;
  sessionId?: string;
  profileSynced?: boolean;
}

export interface PlayerProfile {
  playerName: string;
  totalXP: number;
  level: number;
  accuracy: number;
  maxCombo: number;
  totalGames: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  totalWrongAnswers: number;
  completedQuestions: number;
  completedMissions: number;
  bestScore: number;
  bestAccuracy: number;
  bestCombo: number;
  lastPlayedAt: string;
}
