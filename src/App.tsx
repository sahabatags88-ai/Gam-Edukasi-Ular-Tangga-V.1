import React, { useState, useEffect } from 'react';
import {
  GameScreen,
  PuzzleQuestion,
  GameStats,
  QuestionDifficulty,
  ScoreCalculationResult,
  MissionState,
  SavedGameState,
  PlayerProfile,
} from './types/game';
import {
  LADDERS,
  SNAKES,
  PUZZLE_CELLS,
  TOTAL_CELLS,
  MISSION_TOTAL_QUESTIONS,
} from './config/gameConfig';
import {
  getDifficultyForCell,
  generate15QuestionMission,
  getNextMissionQuestion,
  getQuestionById,
  calculateAnswerScore,
  calculateAccuracy,
} from './utils/puzzleEngine';
import {
  loadPlayerProfile,
  savePlayerProfile,
  createDefaultProfile,
  syncGameToProfile,
  resetPlayerProfile,
} from './utils/profileEngine';
import { audio } from './utils/audio';

// Components
import { StartScreen } from './components/StartScreen';
import { NameInput } from './components/NameInput';
import { GameHUD } from './components/GameHUD';
import { GameBoard } from './components/GameBoard';
import { Dice } from './components/Dice';
import { GameMessage } from './components/GameMessage';
import { FinishScreen } from './components/FinishScreen';
import { PuzzleModal } from './components/PuzzleModal';
import { LivesOverModal } from './components/LivesOverModal';
import { FloatingScoreFeedback, FloatingFeedbackData } from './components/FloatingScoreFeedback';
import { ProfileModal } from './components/ProfileModal';
import { EventBanner, EventBannerData } from './components/EventBanner';

const STORAGE_KEY = 'algorithmQuestGame';

const INITIAL_STATS: GameStats = {
  score: 0,
  combo: 0,
  maxCombo: 0,
  streak: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  totalQuestionsAnswered: 0,
};

export default function App() {
  // Game Navigation Screen
  const [screen, setScreen] = useState<GameScreen>('landing');

  // Player & Gameplay State
  const [playerName, setPlayerName] = useState<string>('');
  const [playerPosition, setPlayerPosition] = useState<number>(1);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [gameStatus, setGameStatus] = useState<string>('Giliran kamu. Lempar dadu!');

  // Stats, Score, Combo & Lives State
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [lives, setLives] = useState<number>(3);
  const maxLives = 3;
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => audio.isEnabled());

  // 15-Question Mission State (Sections 2, 4, 20)
  const [mission, setMission] = useState<MissionState>(() => ({
    missionTotal: MISSION_TOTAL_QUESTIONS,
    questionsCleared: 0,
    selectedQuestionIds: generate15QuestionMission(),
    clearedQuestionIds: [],
  }));

  // Puzzle Modal & Dialog States
  const [activePuzzle, setActivePuzzle] = useState<PuzzleQuestion | null>(null);
  const [lastQuestionId, setLastQuestionId] = useState<string | null>(null);
  const [isLivesOver, setIsLivesOver] = useState<boolean>(false);
  const [floatingFeedback, setFloatingFeedback] = useState<FloatingFeedbackData | null>(null);

  // Dynamic Event Banner & Tension States (PROMPT 08)
  const [eventBanner, setEventBanner] = useState<EventBannerData | null>(null);
  const [activeSnakeCell, setActiveSnakeCell] = useState<number | null>(null);
  const [activeLadderCell, setActiveLadderCell] = useState<number | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Player Profile State (PROMPT 07)
  const [profile, setProfile] = useState<PlayerProfile | null>(() => loadPlayerProfile());
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [syncedSessionId, setSyncedSessionId] = useState<string | null>(null);

  // Initialize & Restore from LocalStorage (Section 25)
  useEffect(() => {
    // If profile exists in localStorage, set initial playerName
    const existingProfile = loadPlayerProfile();
    if (existingProfile && existingProfile.playerName) {
      setPlayerName(existingProfile.playerName);
      setProfile(existingProfile);
    }

    try {
      const savedRaw = localStorage.getItem(STORAGE_KEY);
      if (savedRaw) {
        const saved: SavedGameState = JSON.parse(savedRaw);
        if (
          saved.boardSize === 100 &&
          saved.missionTotal === MISSION_TOTAL_QUESTIONS &&
          Array.isArray(saved.selectedQuestionIds) &&
          saved.selectedQuestionIds.length === 15
        ) {
          const areAllIdsValid = saved.selectedQuestionIds.every(
            (id) => getQuestionById(id) !== undefined
          );
          const finalMissionIds = areAllIdsValid
            ? saved.selectedQuestionIds
            : generate15QuestionMission();
          const finalClearedIds = areAllIdsValid ? saved.clearedQuestionIds || [] : [];
          const finalClearedCount = areAllIdsValid ? saved.questionsCleared || 0 : 0;

          setPlayerName(saved.playerName || '');
          setPlayerPosition(saved.position || 1);
          setStats({
            score: saved.score || 0,
            combo: saved.combo || 0,
            maxCombo: saved.maxCombo || 0,
            streak: 0,
            correctAnswers: saved.correctAnswers || 0,
            wrongAnswers: saved.wrongAnswers || 0,
            totalQuestionsAnswered: saved.totalQuestionsAnswered || 0,
          });
          setMission({
            missionTotal: MISSION_TOTAL_QUESTIONS,
            questionsCleared: finalClearedCount,
            selectedQuestionIds: finalMissionIds,
            clearedQuestionIds: finalClearedIds,
          });
          if (typeof saved.soundEnabled === 'boolean') {
            audio.setEnabled(saved.soundEnabled);
            setSoundEnabled(saved.soundEnabled);
          }
          if (saved.gameStatus) {
            setGameStatus(saved.gameStatus);
          }
        }
      }
    } catch {
      // Ignore parse error
    }
  }, []);

  // Save State to LocalStorage (Section 25)
  useEffect(() => {
    if (!playerName) return;

    try {
      const stateToSave: SavedGameState = {
        boardSize: 100,
        missionTotal: MISSION_TOTAL_QUESTIONS,
        questionsCleared: mission.questionsCleared,
        selectedQuestionIds: mission.selectedQuestionIds,
        clearedQuestionIds: mission.clearedQuestionIds,
        playerName,
        position: playerPosition,
        score: stats.score,
        combo: stats.combo,
        maxCombo: stats.maxCombo,
        correctAnswers: stats.correctAnswers,
        wrongAnswers: stats.wrongAnswers,
        totalQuestionsAnswered: stats.totalQuestionsAnswered,
        soundEnabled,
        gameStatus,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // Ignore storage errors
    }
  }, [playerName, playerPosition, stats, mission, soundEnabled, gameStatus]);

  const handleToggleSound = () => {
    const next = audio.toggleSound();
    setSoundEnabled(next);
  };

  // Handle starting game from Landing
  const handleStartGame = () => {
    audio.buttonClick();
    if (!playerName) {
      setScreen('name-input');
    } else {
      setScreen('playing');
    }
  };

  // Handle name submission (Section 26: New Game setup & Profile setup)
  const handleNameSubmit = (enteredName: string) => {
    audio.buttonClick();
    const newMissionQuestions = generate15QuestionMission();

    const trimmed = enteredName.trim();
    setPlayerName(trimmed);

    // Profile handling: create if not exists or if name changed
    let currentProf = profile;
    if (!currentProf || currentProf.playerName !== trimmed) {
      currentProf = createDefaultProfile(trimmed);
      savePlayerProfile(currentProf);
      setProfile(currentProf);
    }

    setPlayerPosition(1);
    setDiceValue(null);
    setStats(INITIAL_STATS);
    setLives(3);
    setMission({
      missionTotal: MISSION_TOTAL_QUESTIONS,
      questionsCleared: 0,
      selectedQuestionIds: newMissionQuestions,
      clearedQuestionIds: [],
    });
    setLastQuestionId(null);
    setGameStatus('Permainan dimulai! Target: Capai Kotak 100 & sapu bersih 15 soal!');
    setScreen('playing');
  };

  // Profile modal controls
  const handleOpenProfile = () => {
    audio.buttonClick();
    setIsProfileOpen(true);
  };

  const handleCloseProfile = () => {
    setIsProfileOpen(false);
  };

  const handleResetProfile = () => {
    const fresh = resetPlayerProfile(playerName);
    setProfile(fresh);
  };

  // Open Puzzle immediately with Entrance Feedback when landing on a puzzle tile (Section 16)
  const triggerPuzzleForCell = (pos: number) => {
    setIsMoving(false);
    if (mission.questionsCleared >= MISSION_TOTAL_QUESTIONS) {
      setGameStatus('🎉 Semua 15 Misi Soal sudah diselesaikan! Teruskan langkah menuju Kotak 100.');
      return;
    }

    const diff = getDifficultyForCell(pos);
    const nextQ = getNextMissionQuestion(diff, mission, lastQuestionId);

    if (nextQ) {
      setLastQuestionId(nextQ.id);

      // Section 16: Puzzle Entrance Sequence (Banner -> Sound -> Modal)
      setEventBanner({
        id: Date.now(),
        type: diff === 'hots' ? 'challenge' : 'puzzle-entrance',
        title: diff === 'hots' ? '⚡ HOTS CHALLENGE!' : '🧠 PUZZLE TIME!',
        subtitle: `Kotak ${pos} • Uji Logika Algoritma (${diff.toUpperCase()})`,
        badge: diff.toUpperCase(),
        duration: 1200,
      });

      audio.puzzleOpen();

      // Show puzzle modal smoothly after subtle entrance
      setTimeout(() => {
        setGameStatus(`🧩 Kotak ${pos}: Soal Puzzle (${diff.toUpperCase()}) terbuka langsung!`);
        setActivePuzzle(nextQ);
      }, 400);
    } else {
      setGameStatus('✓ Lanjutkan perjalanan menuju Kotak 100.');
    }
  };

  // Trigger Victory: sync game stats to profile, play victory audio, transition to finish screen
  const triggerVictory = () => {
    audio.victory();
    setGameStatus('🏆 SELAMAT! Kamu mencapai Kotak 100 dan menuntaskan 15 soal!');

    // Sync to PlayerProfile in localStorage (PROMPT 07)
    if (playerName) {
      let currentProf = profile || loadPlayerProfile() || createDefaultProfile(playerName);
      const updatedProfile = syncGameToProfile(
        currentProf,
        stats,
        mission.questionsCleared,
        mission.missionTotal
      );
      setProfile(updatedProfile);
    }

    setTimeout(() => {
      setScreen('finish');
    }, 500);
  };

  // Check destination cell after Ladder or Snake movement (Sections 23 & 24)
  const handleDestinationCheck = (destPos: number, sourceAction: 'ladder' | 'snake') => {
    setIsMoving(false);
    if (destPos === TOTAL_CELLS) {
      if (mission.questionsCleared >= MISSION_TOTAL_QUESTIONS) {
        triggerVictory();
      } else {
        setGameStatus(
          `🏁 KOTAK 100 TERCAPAI! Selesaikan ${MISSION_TOTAL_QUESTIONS - mission.questionsCleared} soal lagi untuk menang.`
        );
      }
      return;
    }

    if (PUZZLE_CELLS.includes(destPos)) {
      setGameStatus(
        sourceAction === 'ladder'
          ? `🪜 Naik tangga ke Kotak ${destPos} (Kotak Puzzle)! Soal terbuka langsung.`
          : `🐍 Turun ular ke Kotak ${destPos} (Kotak Puzzle)! Soal terbuka langsung.`
      );
      setTimeout(() => {
        triggerPuzzleForCell(destPos);
      }, 400);
      return;
    }

    setGameStatus(
      sourceAction === 'ladder'
        ? '✓ Naik tangga selesai! Giliran kamu. Lempar dadu!'
        : '✓ Turun ular selesai! Giliran kamu. Lempar dadu!'
    );
  };

  // Handle Dice Roll & Player Movement with Generic Bounce-Back System (PROMPT 08 Sections 20-28)
  const handleDiceRoll = (roll: number) => {
    if (isMoving || isRolling || activePuzzle !== null || isLivesOver) return;

    setDiceValue(roll);
    setIsRolling(false);
    setGameStatus(`Kamu mendapatkan angka ${roll}.`);

    const startPos = playerPosition;

    // Build exact cell-by-cell step path with generic Bounce-Back
    // If movement passes 100, 100 is turning point and remaining steps bounce backward
    const stepPath: number[] = [];
    let currentCell = startPos;
    let direction: 'forward' | 'backward' = 'forward';

    for (let step = 1; step <= roll; step++) {
      if (direction === 'forward') {
        if (currentCell < TOTAL_CELLS) {
          currentCell++;
        } else {
          // At 100, switch to backward
          direction = 'backward';
          currentCell--;
        }
      } else {
        currentCell--;
      }
      stepPath.push(currentCell);
    }

    const finalTargetPos = stepPath[stepPath.length - 1];
    const willBounce = stepPath.some((pos, idx) => pos === TOTAL_CELLS && idx < stepPath.length - 1);

    // Step-by-step player movement
    setIsMoving(true);

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const stepDelay = prefersReducedMotion ? 40 : 160;

    let pathIndex = 0;
    const moveInterval = setInterval(() => {
      const currentStepPos = stepPath[pathIndex];
      setPlayerPosition(currentStepPos);

      // Section 24 & 26: If player reaches cell 100 as turning point (not final step)
      if (currentStepPos === TOTAL_CELLS && pathIndex < stepPath.length - 1) {
        audio.buttonClick();
        setEventBanner({
          id: Date.now(),
          type: 'bounce-100',
          title: '💯 100! TITIK BALIK',
          subtitle: 'Kelebihan langkah! Memantul kembali...',
          badge: 'BOUNCE',
          duration: 1200,
        });
        setGameStatus('💯 100! Kelebihan langkah! 🔄 MEMANTUL kembali!');
      }

      // Check if finished entire path
      if (pathIndex === stepPath.length - 1) {
        clearInterval(moveInterval);

        if (willBounce) {
          setEventBanner({
            id: Date.now(),
            type: 'bounce',
            title: '🔄 MEMANTUL!',
            subtitle: `Mendarat di Kotak ${finalTargetPos}. Perjalanan berlanjut!`,
            badge: `KOTAK ${finalTargetPos}`,
            duration: 1500,
          });
        }

        // Section 28: Events (Snake/Ladder/Puzzle/Victory) ONLY checked AFTER movement finishes
        setTimeout(() => {
          handleLanded(finalTargetPos);
        }, willBounce ? 250 : 50);
      } else {
        pathIndex++;
      }
    }, stepDelay);
  };

  // Handle Landing on a Tile (Sections 3, 23, 24, 25)
  const handleLanded = (pos: number) => {
    // 1. Check if reached Finish (Kotak 100) (Sections 3, 21, 22, 26)
    if (pos === TOTAL_CELLS) {
      setIsMoving(false);

      if (mission.questionsCleared >= MISSION_TOTAL_QUESTIONS) {
        // VICTORY: Reach 100 + Clear 15 Questions = Victory (Section 3 & 26)
        triggerVictory();
      } else {
        // Reach 100 but questions remaining (Section 26)
        setGameStatus(
          `🏁 KOTAK 100 TERCAPAI! Selesaikan ${MISSION_TOTAL_QUESTIONS - mission.questionsCleared} soal lagi untuk menang.`
        );
      }
      return;
    }

    // 2. Check if landed on a PUZZLE CELL (Sections 3, 7: SHOW QUESTION IMMEDIATELY)
    if (PUZZLE_CELLS.includes(pos)) {
      triggerPuzzleForCell(pos);
      return;
    }

    // 3. Check if landed on a Ladder (Section 5: LADDER SEQUENCE DENGAN EVENT BANNER, GLOW, & BOUNCE)
    const ladder = LADDERS.find((l) => l.from === pos);
    if (ladder) {
      setActiveLadderCell(pos);
      audio.ladder();

      // STEP 1 & 2: Highlight cell & event banner
      setEventBanner({
        id: Date.now(),
        type: 'ladder',
        title: '🪜 NAIK TANGGA!',
        subtitle: `Dari Kotak ${pos} melesat naik ke Kotak ${ladder.to}! Bonus langkah!`,
        badge: 'JALAN PINTAS',
        duration: 1600,
      });

      setGameStatus(`🪜 TANGGA! Naik dari Kotak ${pos} ke Kotak ${ladder.to}! Jalan pintas kode.`);

      // STEP 3 & 4: Player moving up gradually with sparkle
      setTimeout(() => {
        setPlayerPosition(ladder.to);
        setTimeout(() => {
          setActiveLadderCell(null);
          handleDestinationCheck(ladder.to, 'ladder');
        }, 400);
      }, 900);
      return;
    }

    // 4. Check if landed on a Snake (Sections 3 & 4: SNAKE SEQUENCE DENGAN TENSION, SHAKE, & BANNER)
    const snake = SNAKES.find((s) => s.from === pos);
    if (snake) {
      setActiveSnakeCell(pos);
      setIsShaking(true);
      audio.snake();

      // STEP 1, 2, 5: Warning banner & tension screen shake
      setEventBanner({
        id: Date.now(),
        type: 'snake',
        title: '🐍 KENA ULAR!',
        subtitle: `Awas! Tergelincir turun dari Kotak ${pos} ke Kotak ${snake.to}!`,
        badge: 'TERGELINCIR',
        duration: 1800,
      });

      setGameStatus(`🐍 ULAR! Tergelincir dari Kotak ${pos} turun ke Kotak ${snake.to}.`);

      // Screen shake stops after 500ms
      setTimeout(() => {
        setIsShaking(false);
      }, 500);

      // STEP 6 & 7: Player sliding downward with impact
      setTimeout(() => {
        setPlayerPosition(snake.to);
        setTimeout(() => {
          setActiveSnakeCell(null);
          handleDestinationCheck(snake.to, 'snake');
        }, 400);
      }, 1000);
      return;
    }

    // 5. Normal tile (Section 3: Lanjutkan permainan, lempar dadu)
    setIsMoving(false);
    setGameStatus('✓ Lanjutkan perjalanan. Giliran kamu. Lempar dadu!');
  };

  // Puzzle Answer Evaluation with 3-Attempts & Score Engine (Sections 7-10, 13-17)
  const handlePuzzleAnswerSubmit = (
    isCorrect: boolean,
    difficulty: QuestionDifficulty,
    attempt: number
  ): ScoreCalculationResult => {
    const result = calculateAnswerScore(isCorrect, difficulty, stats, attempt);
    setStats(result.nextStats);

    // Visual Score Feedback di atas board (Section 17)
    setFloatingFeedback({
      id: Date.now(),
      type: isCorrect ? 'correct' : 'incorrect',
      xpChange: result.totalXpChange,
      comboLevel: result.comboLevel,
      comboBonus: result.comboBonusXp,
      comboBroken: result.comboBroken,
      isNewStreak: result.isNewStreak,
    });

    // Dynamic Event Banner for Combo & Break (Sections 7, 8, 9, 10)
    if (isCorrect) {
      if (result.comboLevel >= 2) {
        setEventBanner({
          id: Date.now(),
          type: 'combo',
          title: result.comboLevel === 5 ? '🔥 COMBO MAX!' : `🔥 COMBO x${result.comboLevel}!`,
          subtitle: `+${result.comboBonusXp} COMBO BONUS! Teruskan streak logika!`,
          badge: `x${result.comboLevel}`,
          duration: 1800,
        });
      } else if (difficulty === 'hots') {
        setEventBanner({
          id: Date.now(),
          type: 'challenge',
          title: '🔥 CHALLENGE CLEAR!',
          subtitle: `+${result.totalXpChange} XP! Soal HOTS ditaklukkan dengan sempurna!`,
          badge: 'HOTS',
          duration: 1800,
        });
      }
    } else if (result.comboBroken) {
      setEventBanner({
        id: Date.now(),
        type: 'combo-break',
        title: '💥 COMBO TERPUTUS!',
        subtitle: 'Combo kembali ke x0. Tetap fokus dan coba lagi!',
        badge: 'RESET',
        duration: 1600,
      });
    }

    if (!isCorrect && attempt >= 3) {
      // Failed all 3 attempts: deduct 1 life
      setLives((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0) {
          setIsLivesOver(true);
        }
        return next;
      });
    }

    return result;
  };

  // Puzzle Continuation (Section 8, 20, 21, 26)
  const handlePuzzleContinue = (isCleared: boolean) => {
    const currentQ = activePuzzle;
    setActivePuzzle(null);

    if (isCleared && currentQ) {
      const alreadyCleared = mission.clearedQuestionIds.includes(currentQ.id);
      const nextClearedIds = alreadyCleared
        ? mission.clearedQuestionIds
        : [...mission.clearedQuestionIds, currentQ.id];
      const nextClearedCount = nextClearedIds.length;

      setMission((prev) => ({
        ...prev,
        questionsCleared: nextClearedCount,
        clearedQuestionIds: nextClearedIds,
      }));

      // Check if all 15 questions are now cleared (Sections 20 & 26)
      if (nextClearedCount >= MISSION_TOTAL_QUESTIONS) {
        audio.missionComplete();

        // Section 19: Mission Complete Visual Banner
        setEventBanner({
          id: Date.now(),
          type: 'mission',
          title: '🎯 SEMUA MISI SOAL SELESAI!',
          subtitle: '15 / 15 Soal Tuntas! Capai Kotak 100 untuk mengklaim kemenangan!',
          badge: '15/15',
          duration: 2200,
        });

        if (playerPosition === TOTAL_CELLS) {
          // Both conditions met: VICTORY!
          triggerVictory();
          return;
        } else {
          setGameStatus(
            '🔥 SEMUA 15 SOAL MISI SELESAI! Sekarang: 🏁 CAPAI KOTAK 100 UNTUK MENANG!'
          );
        }
      } else {
        if (playerPosition === TOTAL_CELLS) {
          setGameStatus(
            `🏁 Kotak 100! Selesaikan ${MISSION_TOTAL_QUESTIONS - nextClearedCount} soal lagi untuk menang.`
          );
        } else {
          setGameStatus(
            `Misi Soal ${nextClearedCount}/${MISSION_TOTAL_QUESTIONS} Tuntas! Giliran kamu. Lempar dadu!`
          );
        }
      }
    } else {
      setGameStatus('Giliran kamu. Lempar dadu!');
    }
  };

  // Continue mission from cell 100 when questions remain (Section 26)
  const handleContinueMissionFrom100 = () => {
    // Pick next remaining mission question
    const diff = 'hots'; // prioritize HOTS at endgame
    let nextQ = getNextMissionQuestion(diff, mission, lastQuestionId);
    if (!nextQ) {
      nextQ = getNextMissionQuestion('medium', mission, lastQuestionId);
    }
    if (!nextQ) {
      nextQ = getNextMissionQuestion('easy', mission, lastQuestionId);
    }

    if (nextQ) {
      audio.puzzleOpen();
      setLastQuestionId(nextQ.id);
      setActivePuzzle(nextQ);
    } else {
      // All done!
      triggerVictory();
    }
  };

  // Handle retry when all lives are depleted
  const handleLivesRetry = () => {
    audio.buttonClick();
    setLives(maxLives);
    setIsLivesOver(false);
    setActivePuzzle(null);
    setGameStatus('Nyawa dipulihkan! Giliran kamu. Lempar dadu!');
  };

  // Restart / New Game Handler (Sections 26 & AB)
  const handleRestart = () => {
    audio.buttonClick();
    const newMissionQuestions = generate15QuestionMission();

    setPlayerPosition(1);
    setDiceValue(null);
    setIsMoving(false);
    setIsRolling(false);
    setActivePuzzle(null);
    setFloatingFeedback(null);
    setIsLivesOver(false);
    setStats(INITIAL_STATS);
    setLives(3);
    setMission({
      missionTotal: MISSION_TOTAL_QUESTIONS,
      questionsCleared: 0,
      selectedQuestionIds: newMissionQuestions,
      clearedQuestionIds: [],
    });
    setLastQuestionId(null);
    setGameStatus('Permainan baru dimulai! Lempar dadu.');
    setScreen('playing');
  };

  const accuracy = calculateAccuracy(stats.correctAnswers, stats.totalQuestionsAnswered);

  return (
    <main className="min-h-screen w-full bg-slate-950 font-sans text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950">
      {/* 1. Landing Screen */}
      {screen === 'landing' && (
        <StartScreen
          onStart={handleStartGame}
          onOpenProfile={handleOpenProfile}
          playerName={playerName}
          playerLevel={profile?.level ?? 1}
        />
      )}

      {/* 2. Name Input Dialog */}
      {screen === 'name-input' && (
        <NameInput
          onSubmit={handleNameSubmit}
          onCancel={() => setScreen('landing')}
        />
      )}

      {/* 3. Game Board Screen */}
      {screen === 'playing' && (
        <div className="flex-1 flex flex-col justify-between">
          {/* Top HUD with 100-cell & 15-question Mission Counter */}
          <GameHUD
            playerName={playerName}
            playerPosition={playerPosition}
            diceValue={diceValue}
            xp={stats.score}
            lives={lives}
            maxLives={maxLives}
            questionsCleared={mission.questionsCleared}
            missionTotal={mission.missionTotal}
            accuracy={accuracy}
            combo={stats.combo}
            soundEnabled={soundEnabled}
            playerLevel={profile?.level ?? 1}
            onOpenProfile={handleOpenProfile}
            onToggleSound={handleToggleSound}
            onRestart={handleRestart}
          />

          {/* Main Board & Action Area */}
          <div className="flex-1 max-w-5xl w-full mx-auto px-2 sm:px-4 py-2 sm:py-3 flex flex-col justify-between items-center gap-3">
            {/* The 100-Cell Game Board with Floating Score Overlay */}
            <div className="relative w-full max-w-4xl flex flex-col items-center">
              <FloatingScoreFeedback
                feedback={floatingFeedback}
                onDismiss={() => setFloatingFeedback(null)}
              />
              <GameBoard
                playerPosition={playerPosition}
                isMoving={isMoving}
                activeSnakeCell={activeSnakeCell}
                activeLadderCell={activeLadderCell}
                isShaking={isShaking}
              />
            </div>

            {/* Bottom Station: Dice / Mission Challenge + Status Message */}
            <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-3 sm:p-4 shadow-xl backdrop-blur-md flex flex-col items-center gap-2.5">
              {playerPosition === TOTAL_CELLS && mission.questionsCleared < MISSION_TOTAL_QUESTIONS ? (
                <div className="w-full flex flex-col items-center gap-2 p-3.5 bg-amber-950/40 border border-amber-500/50 rounded-2xl text-center animate-fadeIn">
                  <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs sm:text-sm">
                    <span>🏁</span>
                    <span>KOTAK 100 TERCAPAI!</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-300 leading-snug">
                    🎯 Misi Soal: <strong className="text-amber-400">{mission.questionsCleared} / {mission.missionTotal}</strong>. Selesaikan{' '}
                    <strong className="text-white">{mission.missionTotal - mission.questionsCleared} soal lagi</strong> untuk Kemenangan Penuh!
                  </p>
                  <button
                    type="button"
                    onClick={handleContinueMissionFrom100}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 hover:scale-102 active:scale-98 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🧩 KERJAKAN SOAL KOTAK 100</span>
                  </button>
                </div>
              ) : (
                <Dice
                  onRoll={handleDiceRoll}
                  disabled={isMoving || activePuzzle !== null || isLivesOver}
                  lastValue={diceValue}
                />
              )}

              <GameMessage status={gameStatus} />
            </div>
          </div>

          {/* Footer Info */}
          <div className="w-full bg-slate-950 border-t border-slate-800 py-2 px-4 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between max-w-5xl mx-auto">
            <span>Informatika Kelas IX SMP • Bab 6 Algoritma dan Pemrograman</span>
            <span>
              Create By <strong className="text-cyan-400">Andri Ganda Saputra</strong>
            </span>
          </div>
        </div>
      )}

      {/* 4. Victory / Finish Screen (Section 21) */}
      {screen === 'finish' && (
        <FinishScreen
          playerName={playerName}
          stats={stats}
          xp={stats.score}
          puzzlesSolved={mission.questionsCleared}
          missionTotal={mission.missionTotal}
          onPlayAgain={handleRestart}
        />
      )}

      {/* 5. Active Puzzle Modal with 2-Minute Timer & 3 Attempts */}
      {activePuzzle && (
        <PuzzleModal
          puzzle={activePuzzle}
          livesRemaining={lives}
          missionNumber={mission.questionsCleared + 1}
          missionTotal={mission.missionTotal}
          currentCombo={stats.combo}
          onAnswerSubmit={handlePuzzleAnswerSubmit}
          onContinue={handlePuzzleContinue}
        />
      )}

      {/* 6. Lives Over Modal */}
      {isLivesOver && <LivesOverModal onRetry={handleLivesRetry} />}

      {/* 7. Player Profile Modal (PROMPT 07) */}
      {isProfileOpen && profile && (
        <ProfileModal
          profile={profile}
          isOpen={isProfileOpen}
          onClose={handleCloseProfile}
          onResetProgress={handleResetProfile}
        />
      )}

      {/* 8. Reusable Dynamic Event Banner (PROMPT 08) */}
      <EventBanner
        banner={eventBanner}
        onDismiss={() => setEventBanner(null)}
      />
    </main>
  );
}
