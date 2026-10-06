import {
  Question,
  QuestionDifficulty,
  UsedQuestionsMap,
  AntiRepeatState,
  MissionState,
} from '../types/game';
import {
  QUESTIONS_EASY,
  QUESTIONS_MEDIUM,
  QUESTIONS_HOTS,
  ALL_QUESTIONS,
} from '../data/questions';

export const INITIAL_USED_QUESTIONS: UsedQuestionsMap = {
  easy: [],
  medium: [],
  hots: [],
};

export const INITIAL_ANTI_REPEAT_STATE: AntiRepeatState = {
  usedQuestions: {
    easy: [],
    medium: [],
    hots: [],
  },
  lastQuestionId: null,
};

/**
 * Pemetaan tingkat kesulitan soal pada board 100 cell (Section 5):
 * Early (Cell 1 - 18, e.g. 6, 11, 16): EASY
 * Middle (Cell 19 - 50, e.g. 21, 27, 32, 37, 42, 47): MEDIUM
 * Late (Cell 51 - 100, e.g. 53, 58, 63, 68, 73, 78, 83, 87, 91, 95, 98): HOTS
 */
export const getDifficultyForCell = (cellNumber: number): QuestionDifficulty => {
  if (cellNumber <= 18) {
    return 'easy';
  }
  if (cellNumber <= 50) {
    return 'medium';
  }
  return 'hots';
};

export const getQuestionPool = (difficulty: QuestionDifficulty): Question[] => {
  switch (difficulty) {
    case 'easy':
      return QUESTIONS_EASY;
    case 'medium':
      return QUESTIONS_MEDIUM;
    case 'hots':
      return QUESTIONS_HOTS;
  }
};

/**
 * Cari pertanyaan berdasarkan ID dari database 100 soal
 */
export const getQuestionById = (id: string): Question | undefined => {
  return ALL_QUESTIONS.find((q) => q.id === id);
};

/**
 * Generate 15 Soal Mission per Permainan (Section 4):
 * 6 Easy + 5 Medium + 4 HOTS = 15 Soal
 */
export const generate15QuestionMission = (): string[] => {
  const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

  const pickedEasy = shuffle(QUESTIONS_EASY).slice(0, 6).map((q) => q.id);
  const pickedMedium = shuffle(QUESTIONS_MEDIUM).slice(0, 5).map((q) => q.id);
  const pickedHots = shuffle(QUESTIONS_HOTS).slice(0, 4).map((q) => q.id);

  // Return acak gabungan 15 soal
  return shuffle([...pickedEasy, ...pickedMedium, ...pickedHots]);
};

/**
 * Ambil soal misi berikutnya dari 15 soal yang belum diselesaikan (Section 5)
 */
export const getNextMissionQuestion = (
  difficulty: QuestionDifficulty,
  mission: MissionState,
  lastQuestionId: string | null = null
): Question | null => {
  // Saring ID yang belum selesai
  const remainingIds = mission.selectedQuestionIds.filter(
    (id) => !mission.clearedQuestionIds.includes(id)
  );

  if (remainingIds.length === 0) {
    return null; // Semua 15 soal sudah selesai!
  }

  // Cari soal yang cocok dengan difficulty kotak
  const remainingQuestions = remainingIds
    .map((id) => getQuestionById(id))
    .filter((q): q is Question => q !== undefined);

  let pool = remainingQuestions.filter((q) => q.difficulty === difficulty);

  // Jika difficulty tersebut sudah habis di 15 misi ini, ambil soal apa saja yang tersisa
  if (pool.length === 0) {
    pool = remainingQuestions;
  }

  // Anti-repeat: hindari soal yang baru saja dibuka jika masih ada opsi lain
  if (pool.length > 1 && lastQuestionId) {
    const withoutLast = pool.filter((q) => q.id !== lastQuestionId);
    if (withoutLast.length > 0) {
      pool = withoutLast;
    }
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
};

export interface GetRandomQuestionResult {
  question: Question;
  nextState: AntiRepeatState;
  nextUsedQuestions: UsedQuestionsMap;
  nextLastQuestionId: string;
}

/**
 * Random Question Engine dengan Anti-Repeat per Difficulty Pool & Anti-Repeat Terakhir
 */
export const getRandomQuestion = (
  difficulty: QuestionDifficulty,
  stateOrMap: AntiRepeatState | UsedQuestionsMap = INITIAL_ANTI_REPEAT_STATE,
  fallbackLastId: string | null = null
): GetRandomQuestionResult => {
  const pool = getQuestionPool(difficulty);

  // Normalize state
  let usedMap: UsedQuestionsMap;
  let lastId: string | null = fallbackLastId;

  if ('usedQuestions' in stateOrMap) {
    usedMap = stateOrMap.usedQuestions;
    lastId = stateOrMap.lastQuestionId ?? fallbackLastId;
  } else {
    usedMap = stateOrMap;
  }

  // Ambil daftar yang sudah dipakai untuk difficulty ini
  let currentUsedList = [...(usedMap[difficulty] || [])];

  // Saring soal yang belum terpakai di siklus ini
  let available = pool.filter((q) => !currentUsedList.includes(q.id));

  // Jika semua soal dalam difficulty ini sudah terpakai, reset HANYA pool difficulty ini
  if (available.length === 0) {
    currentUsedList = [];
    available = [...pool];
  }

  // Anti-repeat terakhir: hindari soal yang baru saja muncul jika masih ada pilihan lain
  if (available.length > 1 && lastId) {
    const withoutLast = available.filter((q) => q.id !== lastId);
    if (withoutLast.length > 0) {
      available = withoutLast;
    }
  }

  // Pilih secara acak dari yang tersedia
  const randomIndex = Math.floor(Math.random() * available.length);
  const selectedQuestion = available[randomIndex];

  const nextUsedList = [...currentUsedList, selectedQuestion.id];

  const nextUsedQuestions: UsedQuestionsMap = {
    ...usedMap,
    [difficulty]: nextUsedList,
  };

  const nextState: AntiRepeatState = {
    usedQuestions: nextUsedQuestions,
    lastQuestionId: selectedQuestion.id,
  };

  return {
    question: selectedQuestion,
    nextState,
    nextUsedQuestions,
    nextLastQuestionId: selectedQuestion.id,
  };
};
