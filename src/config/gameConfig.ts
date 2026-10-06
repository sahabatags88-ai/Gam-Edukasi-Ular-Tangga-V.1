import { LadderConfig, SnakeConfig, BoardCellData, CellType } from '../types/game';

export const TOTAL_CELLS = 100;
export const BOARD_COLS = 10;
export const BOARD_ROWS = 10;
export const MISSION_TOTAL_QUESTIONS = 15;

// Konfigurasi Tangga (Ladders)
export const LADDERS: LadderConfig[] = [
  { from: 4, to: 18 },
  { from: 9, to: 27 }, // Tujuan 27 adalah Puzzle Cell!
  { from: 15, to: 36 },
  { from: 22, to: 45 },
  { from: 31, to: 55 },
  { from: 40, to: 68 }, // Tujuan 68 adalah Puzzle Cell!
  { from: 52, to: 74 },
  { from: 64, to: 86 },
  { from: 71, to: 94 },
];

// Konfigurasi Ular (Snakes)
export const SNAKES: SnakeConfig[] = [
  { from: 17, to: 7 },
  { from: 29, to: 13 },
  { from: 38, to: 21 }, // Tujuan 21 adalah Puzzle Cell!
  { from: 49, to: 33 },
  { from: 57, to: 42 }, // Tujuan 42 adalah Puzzle Cell!
  { from: 66, to: 51 },
  { from: 77, to: 60 },
  { from: 88, to: 69 },
  { from: 97, to: 80 },
];

// Posisi 20 Kotak Puzzle terdistribusi (Section 4 & 5)
// Early (EASY): 6, 11, 16
// Middle (MEDIUM): 21, 27, 32, 37, 42, 47
// Late (HOTS): 53, 58, 63, 68, 73, 78, 83, 87, 91, 95, 98
export const PUZZLE_CELLS_EASY: number[] = [6, 11, 16];
export const PUZZLE_CELLS_MEDIUM: number[] = [21, 27, 32, 37, 42, 47];
export const PUZZLE_CELLS_HOTS: number[] = [53, 58, 63, 68, 73, 78, 83, 87, 91, 95, 98];

export const PUZZLE_CELLS: number[] = [
  ...PUZZLE_CELLS_EASY,
  ...PUZZLE_CELLS_MEDIUM,
  ...PUZZLE_CELLS_HOTS,
];

// Posisi Kotak Khusus Lainnya
export const BONUS_CELLS: number[] = [8, 25, 50, 75, 90];
export const CHALLENGE_CELLS: number[] = [19, 44, 70, 85, 96];

// Helper untuk menyusun data 100 kotak
export const getBoardCellsData = (): BoardCellData[] => {
  const cells: BoardCellData[] = [];

  for (let i = 1; i <= TOTAL_CELLS; i++) {
    let type: CellType = 'normal';
    let target: number | undefined = undefined;

    const ladder = LADDERS.find((l) => l.from === i);
    const snake = SNAKES.find((s) => s.from === i);

    if (i === 1) {
      type = 'start';
    } else if (i === 100) {
      type = 'finish';
    } else if (ladder) {
      type = 'ladder';
      target = ladder.to;
    } else if (snake) {
      type = 'snake';
      target = snake.to;
    } else if (PUZZLE_CELLS.includes(i)) {
      type = 'puzzle';
    } else if (BONUS_CELLS.includes(i)) {
      type = 'bonus';
    } else if (CHALLENGE_CELLS.includes(i)) {
      type = 'challenge';
    }

    cells.push({
      number: i,
      type,
      target,
    });
  }

  return cells;
};

// Pola Ular Tangga Klasik 10x10 (Baris 10 di atas, Baris 1 di bawah)
export const BOARD_GRID_ROWS: number[][] = [
  [100, 99, 98, 97, 96, 95, 94, 93, 92, 91], // Baris 10 (Paling Atas, kanan ke kiri)
  [81, 82, 83, 84, 85, 86, 87, 88, 89, 90],   // Baris 9 (kiri ke kanan)
  [80, 79, 78, 77, 76, 75, 74, 73, 72, 71],   // Baris 8 (kanan ke kiri)
  [61, 62, 63, 64, 65, 66, 67, 68, 69, 70],   // Baris 7 (kiri ke kanan)
  [60, 59, 58, 57, 56, 55, 54, 53, 52, 51],   // Baris 6 (kanan ke kiri)
  [41, 42, 43, 44, 45, 46, 47, 48, 49, 50],   // Baris 5 (kiri ke kanan)
  [40, 39, 38, 37, 36, 35, 34, 33, 32, 31],   // Baris 4 (kanan ke kiri)
  [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],   // Baris 3 (kiri ke kanan)
  [20, 19, 18, 17, 16, 15, 14, 13, 12, 11],   // Baris 2 (kanan ke kiri)
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],            // Baris 1 (Paling Bawah, kiri ke kanan)
];
