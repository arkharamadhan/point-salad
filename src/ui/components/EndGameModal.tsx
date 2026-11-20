import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Trophy,
  RotateCcw,
  Home,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  FastForward,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { Sound } from '../sound/soundEffects';
import { VeggieIcon } from './icons/SpiceIcon';
import { ResourceId } from '../../engine/types';
import { DeckSizeOption } from '../../engine';

const DECK_OPTIONS: Array<{ value: DeckSizeOption | undefined; label: string }> = [
  { value: undefined, label: 'Auto' },
  { value: 36, label: '36' },
  { value: 54, label: '54' },
  { value: 72, label: '72' },
  { value: 108, label: '108' },
];

const VEGGIE_ORDER: ResourceId[] = ['kubis', 'tomat', 'paprika', 'bawang', 'wortel', 'selada'];

const PLAYER_ACCENTS = [
  { badge: 'bg-[#2E7D32]', bar: 'bg-[#43A047]', light: 'bg-[#E8F5E9]', border: 'border-[#A5D6A7]', text: 'text-[#1B5E20]' },
  { badge: 'bg-[#C0A018]', bar: 'bg-[#D4B01A]', light: 'bg-[#FFFDE7]', border: 'border-[#FFE082]', text: 'text-[#8D6E00]' },
  { badge: 'bg-[#7B1FA2]', bar: 'bg-[#9C27B0]', light: 'bg-[#F3E5F5]', border: 'border-[#CE93D8]', text: 'text-[#4A148C]' },
  { badge: 'bg-[#E65100]', bar: 'bg-[#FB8C00]', light: 'bg-[#FFF3E0]', border: 'border-[#FFCC80]', text: 'text-[#BF360C]' },
];

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

type RevealPhase = 'counting' | 'drumroll' | 'revealed';

export const EndGameModal: React.FC = () => {
  const {
    gameState,
    startNewGame,
    rematchOnlineGame,
    setScreen,
    leaveOnlineRoom,
    mpRole,
    seriesWins,
    lastDeckSize,
    soundEnabled,
    lang,
  } = useGameStore();
  const { phase, finalScores, players } = gameState;
  const isId = lang === 'id';

  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [revealPhase, setRevealPhase] = useState<RevealPhase>('counting');
  const [revealedStep, setRevealedStep] = useState<number>(0);
  const [rematchDeckSize, setRematchDeckSize] = useState<DeckSizeOption | undefined>(lastDeckSize);

  // Order players by seat order during counting so winner stays a suspenseful surprise
  const seatOrderedReports = useMemo(() => {
    if (!finalScores) return [];
    return players
      .map((p) => finalScores.find((fs) => fs.playerId === p.id))
      .filter((r): r is NonNullable<typeof r> => Boolean(r));
  }, [finalScores, players]);

  const maxCardSteps = useMemo(() => {
    if (!finalScores || finalScores.length === 0) return 0;
    return Math.max(0, ...finalScores.map((fs) => fs.cardScores.length));
  }, [finalScores]);

  const triggerWinnerCelebration = useCallback(() => {
    if (!finalScores || finalScores.length === 0) return;
    setRevealPhase('revealed');
    setExpandedPlayerId(finalScores[0].playerId);
    Sound.winFanfare(soundEnabled);

    const colors = ['#DF322B', '#F17816', '#F2C11C', '#4CAF50', '#C72C72', '#7B2B9E'];
    try {
      confetti({
        particleCount: 95,
        spread: 75,
        origin: { x: 0.5, y: 0.55 },
        colors,
      });
      setTimeout(() => {
        try {
          confetti({ particleCount: 55, angle: 60, spread: 58, origin: { x: 0.08, y: 0.65 }, colors });
          confetti({ particleCount: 55, angle: 120, spread: 58, origin: { x: 0.92, y: 0.65 }, colors });
        } catch {
          // ignore
        }
      }, 240);
    } catch {
      // safe fallback
    }
  }, [finalScores, soundEnabled]);

  // Reset reveal sequence whenever a new game finishes
  useEffect(() => {
    if (phase === 'game_over' && finalScores && finalScores.length > 0) {
      setIsMinimized(false);
      setExpandedPlayerId(null);
      setRevealedStep(0);
      setRematchDeckSize(lastDeckSize);
      setRevealPhase(maxCardSteps > 0 ? 'counting' : 'drumroll');
    }
  }, [phase, finalScores, maxCardSteps, lastDeckSize]);

  // Step-by-step recipe counting timer
  useEffect(() => {
    if (phase !== 'game_over' || !finalScores || revealPhase !== 'counting') return;

    if (revealedStep >= maxCardSteps) {
      const drumTimer = window.setTimeout(() => {
        setRevealPhase('drumroll');
      }, 450);
      return () => window.clearTimeout(drumTimer);
    }

    const delay = revealedStep === 0 ? 550 : 850;
    const stepTimer = window.setTimeout(() => {
      const nextStep = revealedStep + 1;
      setRevealedStep(nextStep);
      Sound.scoreTick(soundEnabled, nextStep);
    }, delay);

    return () => window.clearTimeout(stepTimer);
  }, [phase, finalScores, revealPhase, revealedStep, maxCardSteps, soundEnabled]);

  // Suspenseful drumroll before winner reveal
  useEffect(() => {
    if (phase !== 'game_over' || !finalScores || revealPhase !== 'drumroll') return;

    const revealTimer = window.setTimeout(() => {
      triggerWinnerCelebration();
    }, 850);

    return () => window.clearTimeout(revealTimer);
  }, [phase, finalScores, revealPhase, triggerWinnerCelebration]);

  if (phase !== 'game_over' || !finalScores) return null;

  const winners = finalScores.filter((s) => s.rank === 1);
  const isSharedWin = winners.length > 1;
  const isOnlineGuest = mpRole === 'guest';
  const isCountingStage = revealPhase !== 'revealed';

  // Running scores for each player during counting animation
  const runningScores = seatOrderedReports.map((report) => {
    const countedCards = report.cardScores.slice(0, revealedStep);
    const currentTotal = countedCards.reduce((sum, c) => sum + c.score, 0);
    const latestCard = revealedStep > 0 ? report.cardScores[revealedStep - 1] ?? null : null;
    return {
      report,
      currentTotal,
      latestCard,
      countedCount: countedCards.length,
    };
  });
  const maxRunningScore = Math.max(10, ...runningScores.map((r) => Math.max(0, r.currentTotal)));

  const handlePlayAgain = () => {
    Sound.confirmAction(soundEnabled);
    if (mpRole === 'host') {
      rematchOnlineGame(rematchDeckSize);
    } else {
      startNewGame({ preserveSeries: true, deckSize: rematchDeckSize });
    }
  };

  const hasAnySeriesWins = Object.values(seriesWins).some((w) => w > 0);

  const handleGoHome = () => {
    Sound.cardSelect(soundEnabled);
    if (mpRole !== 'none') {
      leaveOnlineRoom();
    } else {
      setScreen('menu');
    }
  };

  // Minimized floating pill so user can inspect the final board and reopen results anytime
  if (isMinimized) {
    return (
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-3 w-full max-w-sm flex justify-center pointer-events-none">
        <motion.button
          type="button"
          initial={{ y: -20, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            Sound.cardSelect(soundEnabled);
            setIsMinimized(false);
          }}
          className="pointer-events-auto flex items-center gap-2 bg-[#2E7D32] hover:bg-[#256628] text-white font-fredoka font-black text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-xl border-2 border-[#A5D6A7] cursor-pointer"
        >
          <Trophy className="w-4 h-4 text-amber-300" />
          <span>{isId ? 'Lihat Hasil Akhir' : 'View Final Results'}</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-[11px]">
            {winners[0]?.playerName} ({winners[0]?.totalScore})
          </span>
        </motion.button>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-[#2C1A0B]/65 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-hidden font-fredoka">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 18 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 12 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          className="relative bg-[#FFFDF8] border-[3px] border-[#C9A46E] rounded-3xl max-w-xl w-full shadow-[0_24px_60px_rgba(44,26,11,0.45)] overflow-hidden flex flex-col max-h-[90dvh]"
        >
          {/* 1. HEADER: SUSPENSEFUL COUNTING vs CELEBRATION */}
          <div
            className={`relative px-5 pt-5 pb-6 text-center text-white overflow-hidden flex-shrink-0 transition-colors duration-500 ${
              isCountingStage
                ? 'bg-gradient-to-b from-[#9A5B1F] to-[#6E3E12]'
                : 'bg-gradient-to-b from-[#2E7D32] to-[#23583A]'
            }`}
          >
            {/* Subtle decorative veggie garnishes */}
            <div className="pointer-events-none absolute -top-2 -left-2 opacity-20 -rotate-12">
              <VeggieIcon resource="selada" size={64} />
            </div>
            <div className="pointer-events-none absolute -bottom-3 -right-2 opacity-20 rotate-12">
              <VeggieIcon resource="tomat" size={60} />
            </div>
            <div className="pointer-events-none absolute top-3 right-12 opacity-15 rotate-12 hidden sm:block">
              <VeggieIcon resource="wortel" size={44} />
            </div>
            <div className="pointer-events-none absolute bottom-2 left-12 opacity-15 -rotate-12 hidden sm:block">
              <VeggieIcon resource="paprika" size={42} />
            </div>

            {/* Top-Right: Skip during counting, or Minimize after reveal */}
            {isCountingStage ? (
              <button
                type="button"
                onClick={() => {
                  Sound.cardSelect(soundEnabled);
                  setRevealedStep(maxCardSteps);
                  triggerWinnerCelebration();
                }}
                className="absolute top-3 right-3 z-20 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white font-black text-xs flex items-center gap-1 transition cursor-pointer border border-white/25"
              >
                <span>{isId ? 'Lewati' : 'Skip'}</span>
                <FastForward className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  Sound.cardSelect(soundEnabled);
                  setIsMinimized(true);
                }}
                className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 text-white flex items-center justify-center transition cursor-pointer"
                title={isId ? 'Tutup sementara untuk intip papan' : 'Minimize to inspect board'}
                aria-label={isId ? 'Tutup sementara' : 'Minimize'}
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Trophy + Veggie Duo */}
            <div className="relative z-10 flex items-center justify-center gap-2.5 mb-2">
              <motion.div
                animate={{ y: [0, -5, 0], rotate: [-8, 4, -8] }}
                transition={{ duration: isCountingStage ? 0.9 : 2.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <VeggieIcon resource="wortel" size={30} />
              </motion.div>

              <motion.div
                key={revealPhase}
                initial={{ scale: 0.75, rotate: -8 }}
                animate={
                  revealPhase === 'drumroll'
                    ? { scale: [1, 1.16, 1], rotate: [-6, 6, -6] }
                    : { y: [0, -6, 0], scale: [1, 1.06, 1], rotate: 0 }
                }
                transition={{
                  duration: revealPhase === 'drumroll' ? 0.35 : 1.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#FFF8EB] border-[3px] border-[#F4D5A0] shadow-lg flex items-center justify-center"
              >
                <Trophy className="w-8 h-8 sm:w-9 sm:h-9 text-[#E6A800]" />
              </motion.div>

              <motion.div
                animate={{ y: [0, -5, 0], rotate: [8, -4, 8] }}
                transition={{ duration: isCountingStage ? 0.9 : 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.25 }}
              >
                <VeggieIcon resource="tomat" size={30} />
              </motion.div>
            </div>

            {isCountingStage ? (
              <>
                <div className="relative z-10 inline-flex items-center gap-1.5 bg-white/15 border border-white/25 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                  <span>
                    {revealPhase === 'drumroll'
                      ? isId
                        ? '🥁 Menentukan Juara...'
                        : '🥁 Determining Winner...'
                      : isId
                      ? `Menghitung Resep #${Math.min(revealedStep + 1, Math.max(1, maxCardSteps))} / ${Math.max(1, maxCardSteps)}`
                      : `Counting Recipe #${Math.min(revealedStep + 1, Math.max(1, maxCardSteps))} / ${Math.max(1, maxCardSteps)}`}
                  </span>
                </div>

                <h2 className="relative z-10 text-xl sm:text-2xl font-black tracking-wide drop-shadow-xs">
                  {revealPhase === 'drumroll'
                    ? isId
                      ? 'SIAPA JUARANYA?!'
                      : 'WHO WINS?!'
                    : isId
                    ? 'MENGHITUNG POIN AKHIR...'
                    : 'TALLYING FINAL POINTS...'}
                </h2>
                <p className="relative z-10 text-xs sm:text-sm text-amber-100/95 mt-1 font-medium">
                  {isId
                    ? 'Membuka resep satu per satu — siap-siap!'
                    : 'Revealing recipes one by one — get ready!'}
                </p>
              </>
            ) : (
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 360, damping: 18 }}
              >
                <div className="relative z-10 inline-flex items-center gap-1.5 bg-white/15 border border-white/25 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isId ? 'Permainan Selesai' : 'Game Over'}</span>
                </div>

                <h2 className="relative z-10 text-xl sm:text-2xl font-black tracking-wide drop-shadow-xs">
                  {isSharedWin
                    ? isId
                      ? 'KEMENANGAN BERSAMA!'
                      : 'SHARED VICTORY!'
                    : isId
                    ? `${winners[0]?.playerName} JUARA!`
                    : `${winners[0]?.playerName} WINS!`}
                </h2>

                <p className="relative z-10 text-xs sm:text-sm text-lime-100/95 mt-1 font-medium">
                  {isSharedWin
                    ? isId
                      ? `Skor imbang spektakuler antara ${winners.map((w) => w.playerName).join(' & ')} (${winners[0]?.totalScore} poin)!`
                      : `Incredible tie between ${winners.map((w) => w.playerName).join(' & ')} (${winners[0]?.totalScore} pts)!`
                    : isId
                    ? `Salad terlezat dengan total ${winners[0]?.totalScore} poin!`
                    : `Best salad in the kitchen with ${winners[0]?.totalScore} points!`}
                </p>
              </motion.div>
            )}
          </div>

          {/* 2. BODY: LIVE DRAMATIC SCORE RACE vs FINAL RANKED LEADERBOARD */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y px-3.5 sm:px-5 py-4 bg-[#FCF8EE] flex flex-col gap-2.5">
            {isCountingStage ? (
              /* DRAMATIC COUNTING STAGE */
              <div className="flex flex-col gap-3">
                {runningScores.map(({ report, currentTotal, latestCard, countedCount }) => {
                  const playerIdx = Math.max(
                    0,
                    players.findIndex((p) => p.id === report.playerId)
                  );
                  const accent = PLAYER_ACCENTS[playerIdx % PLAYER_ACCENTS.length];
                  const barPct = Math.max(6, Math.min(100, Math.round((Math.max(0, currentTotal) / maxRunningScore) * 100)));

                  return (
                    <div
                      key={report.playerId}
                      className="rounded-2xl border-2 border-[#E2D3B8] bg-white p-3.5 shadow-sm flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-3 h-3 rounded-full shrink-0 ${accent.badge}`} />
                          <span className="font-black text-sm sm:text-base text-stone-800 truncate">
                            {report.playerName}
                          </span>
                          <span className="text-[11px] font-bold text-stone-400">
                            ({countedCount}/{report.cardScores.length} {isId ? 'resep' : 'recipes'})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Pop-up Delta Pill for the recipe just counted */}
                          <AnimatePresence mode="popLayout">
                            {latestCard && (
                              <motion.span
                                key={`${latestCard.cardId}-${revealedStep}`}
                                initial={{ scale: 0.4, y: 8, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                                className={`px-2 py-0.5 rounded-full text-xs font-black border ${
                                  latestCard.score > 0
                                    ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]'
                                    : latestCard.score < 0
                                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                                    : 'bg-stone-100 text-stone-500 border-stone-200'
                                }`}
                              >
                                {latestCard.score > 0 ? `+${latestCard.score}` : latestCard.score}
                              </motion.span>
                            )}
                          </AnimatePresence>

                          {/* Rolling Total Score Box */}
                          <motion.div
                            key={`${report.playerId}-${currentTotal}`}
                            initial={{ scale: 1.28 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                            className="px-3 py-1 rounded-xl bg-[#FFF8EB] border-2 border-[#E5CCA0] min-w-[58px] text-center"
                          >
                            <span className="text-lg sm:text-xl font-black text-[#23583A] leading-none block">
                              {currentTotal}
                            </span>
                            <span className="text-[9px] font-bold uppercase text-[#855726]">
                              {isId ? 'poin' : 'pts'}
                            </span>
                          </motion.div>
                        </div>
                      </div>

                      {/* Racing Progress Bar */}
                      <div className="w-full h-3 rounded-full bg-[#F3ECE0] overflow-hidden border border-[#E5D7BE]">
                        <motion.div
                          initial={{ width: '6%' }}
                          animate={{ width: `${barPct}%` }}
                          transition={{ type: 'spring', stiffness: 160, damping: 20 }}
                          className={`h-full rounded-full ${accent.bar}`}
                        />
                      </div>

                      {/* Currently Counted Recipe Description */}
                      <div className="min-h-[20px] flex items-center">
                        <AnimatePresence mode="wait">
                          {latestCard ? (
                            <motion.p
                              key={`${latestCard.cardId}-${revealedStep}`}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 8 }}
                              transition={{ duration: 0.2 }}
                              className="text-[11px] sm:text-xs font-bold text-stone-600 truncate"
                            >
                              🍽️ {latestCard.description}
                            </motion.p>
                          ) : (
                            <p className="text-[11px] text-stone-400 italic">
                              {revealedStep === 0
                                ? isId
                                  ? 'Menyiapkan kartu resep...'
                                  : 'Preparing recipe plates...'
                                : isId
                                ? 'Semua resep pemain ini sudah dihitung!'
                                : 'All recipes counted for this player!'}
                            </p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* FINAL REVEALED LEADERBOARD */
              <>
                {/* Head-to-Head Series Score Bar */}
                {hasAnySeriesWins && (
                  <div className="bg-[#FFF8EB] border-2 border-[#E5CCA0] rounded-2xl px-3.5 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 shadow-2xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#855726]">
                      🏆 {isId ? 'Skor Seri:' : 'Series:'}
                    </span>
                    {players.map((p, pIdx) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1 text-xs font-black text-stone-800"
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            PLAYER_ACCENTS[pIdx % PLAYER_ACCENTS.length].badge
                          }`}
                        />
                        <span>{p.name}</span>
                        <span className="px-1.5 py-0.2 rounded-md bg-white border border-[#DFCFAE] text-[#2E7D32]">
                          {seriesWins[p.id] ?? 0}
                        </span>
                      </span>
                    ))}
                  </div>
                )}

                {finalScores.map((scoreReport, idx) => {
                  const isWinner = scoreReport.rank === 1;
                  const isExpanded = expandedPlayerId === scoreReport.playerId;
                  const playerIdx = Math.max(
                    0,
                    players.findIndex((p) => p.id === scoreReport.playerId)
                  );
                  const playerObj = players[playerIdx];
                  const accent = PLAYER_ACCENTS[playerIdx % PLAYER_ACCENTS.length];
                  const medal = RANK_MEDALS[scoreReport.rank - 1] ?? `#${scoreReport.rank}`;

                  return (
                    <motion.div
                      key={scoreReport.playerId}
                      initial={{ opacity: 0, y: 14, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: idx * 0.08, type: 'spring', stiffness: 320, damping: 24 }}
                      className={`shrink-0 rounded-2xl border-2 transition-all overflow-hidden ${
                        isWinner
                          ? 'bg-white border-[#7CB342] shadow-md ring-2 ring-[#7CB342]/20'
                          : 'bg-white/90 border-[#E2D3B8] shadow-xs'
                      }`}
                    >
                      {/* Player Summary Row */}
                      <button
                        type="button"
                        onClick={() => {
                          Sound.cardSelect(soundEnabled);
                          setExpandedPlayerId(isExpanded ? null : scoreReport.playerId);
                        }}
                        className="w-full px-3.5 py-3 flex items-center justify-between gap-2 hover:bg-[#FFF8EB]/70 transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          {/* Rank Medal */}
                          <div
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-base sm:text-lg shrink-0 ${
                              isWinner
                                ? 'bg-[#FFF3C4] border-2 border-[#F2C11C] shadow-xs'
                                : 'bg-[#F5EFE2] border border-[#DFCFAE] text-stone-600 text-sm'
                            }`}
                          >
                            {medal}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${accent.badge}`} />
                              <span className="font-black text-sm sm:text-base text-stone-800 truncate">
                                {scoreReport.playerName}
                              </span>
                              {isWinner && (
                                <span className="text-[10px] bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] px-2 py-0.5 rounded-full font-black uppercase">
                                  {isId ? 'Juara' : 'Winner'}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] sm:text-xs text-stone-500 font-medium block mt-0.5">
                              🥗 {scoreReport.totalResources} {isId ? 'Sayur' : 'Veggies'} • 🍽️{' '}
                              {scoreReport.unflippedScoringCardsCount} {isId ? 'Resep' : 'Recipes'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <div
                            className={`px-3 py-1 rounded-xl text-center min-w-[58px] ${
                              isWinner
                                ? 'bg-[#7CB342] text-white shadow-xs'
                                : 'bg-[#F3ECE0] text-stone-800'
                            }`}
                          >
                            <span className="text-lg sm:text-xl font-black leading-none block">
                              {scoreReport.totalScore}
                            </span>
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider ${
                                isWinner ? 'text-lime-100' : 'text-stone-500'
                              }`}
                            >
                              {isId ? 'poin' : 'pts'}
                            </span>
                          </div>

                          <span className="text-stone-400">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </span>
                        </div>
                      </button>

                      {/* Expanded Breakdown: Mini Veggie Strip + Recipe Scores */}
                      {isExpanded && (
                        <div className="px-3.5 pb-3.5 pt-2.5 border-t border-[#EDE3D0] bg-[#FAF6EC]/80 flex flex-col gap-2.5">
                          {/* Mini 6-Veggie Collection Strip */}
                          {playerObj && (
                            <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
                              {VEGGIE_ORDER.map((res) => {
                                const count = playerObj.resources[res] ?? 0;
                                return (
                                  <div
                                    key={res}
                                    className={`flex flex-col items-center justify-center rounded-xl py-1 border ${
                                      count > 0
                                        ? 'bg-white border-[#E5D7BF] shadow-2xs'
                                        : 'bg-stone-100/60 border-stone-200/60 opacity-45'
                                    }`}
                                  >
                                    <VeggieIcon resource={res} size={18} />
                                    <span className="text-[11px] font-black text-stone-800 leading-none mt-0.5">
                                      {count}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Recipe Score Details */}
                          <div>
                            <h5 className="text-[11px] font-black text-[#855726] uppercase tracking-wider mb-1.5">
                              {isId ? 'Rincian Poin per Resep' : 'Points per Recipe'}
                            </h5>
                            {scoreReport.cardScores.length > 0 ? (
                              <div className="space-y-1.5">
                                {scoreReport.cardScores.map((detail, cIdx) => (
                                  <div
                                    key={`${detail.cardId}-${cIdx}`}
                                    className="flex items-center justify-between gap-2 text-xs bg-white px-3 py-2 rounded-xl border border-[#E7DAC2]"
                                  >
                                    <span className="text-stone-700 font-medium leading-snug">
                                      {detail.description}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-lg font-black text-xs shrink-0 ${
                                        detail.score > 0
                                          ? 'bg-[#E8F5E9] text-[#2E7D32]'
                                          : detail.score < 0
                                          ? 'bg-rose-50 text-rose-600'
                                          : 'bg-stone-100 text-stone-500'
                                      }`}
                                    >
                                      {detail.score > 0 ? `+${detail.score}` : detail.score}{' '}
                                      {isId ? 'poin' : 'pts'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-stone-500 italic bg-white/70 px-3 py-2 rounded-xl border border-dashed border-[#DFCFAE]">
                                {isId
                                  ? 'Tidak ada kartu resep tersisa (semua dibalik menjadi sayur).'
                                  : 'No recipe plates remaining (all were flipped into veggies).'}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                {/* Tiebreaker Info Pill */}
                <div className="text-center text-[11px] text-[#855726] bg-[#FFF8EB] px-3 py-2 rounded-xl border border-[#E5CCA0] mt-0.5">
                  {isId
                    ? 'Penentu Seri: Skor Tertinggi → Jumlah Sayur → Resep Tersisa → Menang Bersama'
                    : 'Tiebreaker: Highest Score → Total Veggies → Remaining Recipes → Shared Win'}
                </div>
              </>
            )}
          </div>

          {/* 3. FOOTER ACTION BUTTONS (shown after reveal) */}
          {!isCountingStage && (
            <div className="px-4 sm:px-5 py-3 bg-[#FFFDF8] border-t-2 border-[#EDE3D0] flex flex-col gap-2.5 flex-shrink-0">
              {!isOnlineGuest && (
                <div className="flex items-center justify-between gap-2 bg-[#FCF8EE] border border-[#E5D7BE] rounded-xl px-2.5 py-1.5">
                  <span className="text-[11px] font-black text-[#855726] shrink-0">
                    {isId ? 'Dek Rematch:' : 'Next Deck:'}
                  </span>
                  <div className="flex items-center gap-1">
                    {DECK_OPTIONS.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setRematchDeckSize(opt.value)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-black border transition cursor-pointer ${
                          rematchDeckSize === opt.value
                            ? 'bg-[#2E7D32] text-white border-[#1B5E20]'
                            : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={handleGoHome}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#FFF8EB] hover:bg-[#F7EBD4] active:scale-95 text-[#5D4037] font-black text-sm px-5 py-2.5 rounded-2xl border-2 border-[#D7B98A] shadow-xs transition cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>{isId ? 'Menu Utama' : 'Main Menu'}</span>
                </button>

                {isOnlineGuest ? (
                  <div className="w-full sm:flex-1 text-center text-xs font-bold text-[#2E7D32] bg-[#E8F5E9] border border-[#A5D6A7] px-4 py-2.5 rounded-2xl">
                    {isId
                      ? 'Menunggu Host klik Main Lagi di room ini...'
                      : 'Waiting for Host to start rematch...'}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handlePlayAgain}
                    className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-gradient-to-b from-[#43A047] to-[#2E7D32] hover:from-[#388E3C] hover:to-[#256628] active:scale-95 text-white font-black text-sm sm:text-base px-6 py-2.5 rounded-2xl border-2 border-[#1B5E20] shadow-md transition cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>
                      {mpRole === 'host'
                        ? isId
                          ? 'Main Lagi di Room Ini'
                          : 'Rematch in Room'
                        : isId
                        ? 'Main Lagi'
                        : 'Play Again'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
