import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { PlateView } from './PlateView';
import { SkillBar } from './SkillBar';
import { evaluatePlayerScore } from '../../engine/scoring';

export const PlayerActiveShelf: React.FC = () => {
  const {
    gameState,
    selectedResourceSlots,
    confirmTakeResources,
    flipCard,
    undoCurrentTurnAction,
    turnSnapshot,
    lang,
    isBotThinking,
    shelfViewingPlayerIndex,
    setShelfViewingPlayerIndex,
    setInspectedPlayerIndex,
    mpRole,
    mpMyPlayerIndex,
    mpRemoteHasSnapshot,
  } = useGameStore();

  const shelfScrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { players, currentTurnPlayerIndex, hasTakenMainActionThisTurn, phase } = gameState;
  const activePlayer = players[currentTurnPlayerIndex];
  const isOnline = mpRole !== 'none';
  const isMyTurn = !isOnline || (mpMyPlayerIndex !== null && currentTurnPlayerIndex === mpMyPlayerIndex);
  const defaultPlayerIndex = isOnline && mpMyPlayerIndex !== null ? mpMyPlayerIndex : currentTurnPlayerIndex;
  const targetPlayerIndex = shelfViewingPlayerIndex ?? defaultPlayerIndex;
  const targetPlayer = players[targetPlayerIndex] ?? activePlayer;
  const isViewingOpponent = targetPlayerIndex !== defaultPlayerIndex;
  const isGameOver = phase === 'game_over';

  const scoringCardsCount = targetPlayer?.scoringCards.length ?? 0;

  const updateScrollIndicators = useCallback(() => {
    const el = shelfScrollRef.current;
    if (!el) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(maxScroll - el.scrollLeft > 8);
  }, []);

  useEffect(() => {
    updateScrollIndicators();
    const handleResize = () => updateScrollIndicators();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateScrollIndicators, scoringCardsCount, targetPlayerIndex]);

  const scrollShelfBy = (delta: number) => {
    shelfScrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  if (!activePlayer || !targetPlayer) return null;

  // Calculate live score breakdown for the displayed player
  const scoreReport = evaluatePlayerScore(targetPlayerIndex, players);
  const cardScoresMap = new Map<string, number>();
  for (const cs of scoreReport.cardScores) {
    cardScoresMap.set(cs.cardId, cs.score);
  }

  // Instruction banner text based on turn state
  const availableResourceCount = gameState.market.resourceSlots.filter(Boolean).length;
  const allPilesEmpty = gameState.market.piles.every((p) => p.length === 0);
  const extraAllowance = gameState.extraVeggieAllowance ?? 0;
  const maxSelectableResources =
    availableResourceCount === 1 && allPilesEmpty
      ? 1
      : Math.min(2 + extraAllowance, availableResourceCount);
  const remainingToPick = Math.max(0, maxSelectableResources - selectedResourceSlots.length);

  let instructionText =
    maxSelectableResources === 3
      ? lang === 'id'
        ? 'Pilih 3 Sayur atau 1 Resep Poin!'
        : 'Choose 3 Veggies or 1 Point Recipe!'
      : lang === 'id'
      ? 'Pilih 2 Sayur atau 1 Resep Poin!'
      : 'Choose your veggies!';
  if (isGameOver) {
    instructionText = lang === 'id' ? 'Permainan Selesai!' : 'Game Over!';
  } else if (!isMyTurn) {
    instructionText =
      lang === 'id'
        ? `⏳ Giliran ${activePlayer.name}...`
        : `⏳ ${activePlayer.name}'s turn...`;
  } else if (isBotThinking) {
    instructionText = lang === 'id' ? '🤖 Bot sedang berpikir...' : '🤖 Bot is thinking...';
  } else if (hasTakenMainActionThisTurn) {
    instructionText =
      lang === 'id'
        ? 'Kartu berhasil diambil!'
        : 'Cards drafted!';
  } else if (selectedResourceSlots.length > 0 && remainingToPick > 0) {
    instructionText =
      lang === 'id'
        ? `Pilih ${remainingToPick} Sayur lagi!`
        : `Choose ${remainingToPick} more veggie${remainingToPick > 1 ? 's' : ''}!`;
  } else if (selectedResourceSlots.length === maxSelectableResources && maxSelectableResources > 0) {
    instructionText =
      lang === 'id'
        ? `Ambil ${selectedResourceSlots.length} Sayur!`
        : `Confirm ${selectedResourceSlots.length} veggies`;
  }

  const canConfirm =
    isMyTurn &&
    !hasTakenMainActionThisTurn &&
    (selectedResourceSlots.length === maxSelectableResources ||
      (extraAllowance > 0 && selectedResourceSlots.length === 2));
  const hasUndoAvailable = mpRole === 'guest' ? mpRemoteHasSnapshot : (hasTakenMainActionThisTurn || !!turnSnapshot);
  const canUndo = isMyTurn && hasUndoAvailable && !isGameOver && !isBotThinking;

  return (
    <div className="w-full flex flex-col items-center select-none mt-1">
      {/* 1. Instruction Pill Banner */}
      <div className="z-20 -mb-4 px-3 flex items-center gap-2">
        {canConfirm ? (
          <button
            onClick={() => confirmTakeResources()}
            className="bg-white border-[3px] border-[#2E7D32] hover:bg-[#E8F5E9] active:scale-95 text-[#1B5E20] font-black text-sm sm:text-base lg:text-lg font-fredoka px-7 py-1.5 rounded-full shadow-lg transition-transform cursor-pointer animate-bounce flex items-center gap-2"
          >
            <span>✓</span> {instructionText}
          </button>
        ) : (
          <div className="bg-white border-[3px] border-[#2E7D32] rounded-full px-5 sm:px-8 py-1 sm:py-1.5 shadow-md flex items-center gap-2.5">
            <h3 className="text-xs sm:text-base lg:text-lg font-black text-[#1B5E20] font-fredoka tracking-wide">
              {instructionText}
            </h3>

            {/* Quick Undo / Return card button if drafted this turn */}
            {canUndo && (
              <button
                type="button"
                onClick={() => undoCurrentTurnAction()}
                className="bg-[#C88448] hover:bg-[#B57339] active:scale-95 text-white font-black text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full shadow transition-all cursor-pointer flex items-center gap-1 font-fredoka"
                title="Kembalikan kartu ke pasar dan pilih ulang"
              >
                <span>↺</span>
                <span>{lang === 'id' ? 'Kembalikan' : 'Undo'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Player Point Plates Shelf */}
      <div className="w-full bg-gradient-to-b from-[#8BC34A] to-[#7CB342] border-t-4 border-[#689F38] rounded-t-3xl pt-6 sm:pt-7 pb-3 px-2.5 sm:px-4 md:px-6 shadow-[0_-8px_24px_rgba(40,60,15,0.18)] overflow-visible">
        <div className="max-w-5xl mx-auto flex flex-col gap-1.5 overflow-visible">
          {/* Top Shelf Row: Player Switcher Tabs + Power-Up Skill Pill */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x overscroll-x-contain pb-0.5 min-w-0 flex-1">
              <SkillBar />
              {players.map((p, idx) => {
                const isSelected = idx === targetPlayerIndex;
                const isMe = idx === defaultPlayerIndex;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setShelfViewingPlayerIndex(idx === defaultPlayerIndex ? null : idx)}
                    className={`px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-black font-fredoka transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-white text-[#1B5E20] shadow-md ring-2 ring-white/80'
                        : 'bg-black/20 hover:bg-black/30 text-white/95'
                    }`}
                    title={isMe ? 'Piring resep Anda' : `Intip resep ${p.name}`}
                  >
                    <span>{isMe ? '👤' : p.isBot ? '🤖' : '🥗'}</span>
                    <span>
                      {p.name} {isMe ? (lang === 'id' ? '(Anda)' : '(You)') : ''}
                    </span>
                    <span
                      className={`px-1.5 rounded-full text-[10px] ${
                        isSelected ? 'bg-emerald-100 text-emerald-900' : 'bg-black/25 text-white'
                      }`}
                    >
                      {p.scoringCards.length}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {scoringCardsCount >= 3 && (
                <button
                  type="button"
                  onClick={() => setInspectedPlayerIndex(targetPlayerIndex)}
                  className="bg-white/25 hover:bg-white/40 active:scale-95 text-white text-[11px] font-black px-2.5 py-0.5 sm:py-1 rounded-full border border-white/60 cursor-pointer transition-transform shadow-xs flex items-center gap-1"
                  title={lang === 'id' ? 'Lihat semua resep dalam grid' : 'View all recipes in grid'}
                >
                  <LayoutGrid className="w-3 h-3" />
                  <span>{lang === 'id' ? 'Semua' : 'All'}</span>
                </button>
              )}

              {isViewingOpponent ? (
                <button
                  type="button"
                  onClick={() => setShelfViewingPlayerIndex(null)}
                  className="bg-white/25 hover:bg-white/40 active:scale-95 text-white text-[11px] font-black px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-white/60 cursor-pointer transition-transform shadow-xs"
                >
                  ↺ <span className="hidden sm:inline">{lang === 'id' ? 'Kembali ke Resep Saya' : 'Back to My Recipes'}</span>
                  <span className="sm:hidden">{lang === 'id' ? 'Saya' : 'Mine'}</span>
                </button>
              ) : (
                <span className="hidden md:inline text-[11px] text-lime-50 font-medium drop-shadow-xs">
                  {canUndo
                    ? 'Tarik piring ke atas atau klik "Kembalikan" untuk batal'
                    : 'Klik sayur di pojok piring untuk balik jadi sayur'}
                </span>
              )}
            </div>
          </div>

          {/* Plates Row: smooth native horizontal swipe on mobile + soft edge fades + desktop arrows */}
          <div className="relative">
            {/* Left edge fade & desktop scroll button */}
            {canScrollLeft && (
              <>
                <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-7 sm:w-9 bg-gradient-to-r from-[#82BA46] via-[#82BA46]/70 to-transparent z-20" />
                <button
                  type="button"
                  onClick={() => scrollShelfBy(-220)}
                  className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-[#1B5E20] shadow-md items-center justify-center cursor-pointer transition active:scale-95"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Right edge fade & desktop scroll button */}
            {canScrollRight && (
              <>
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-7 sm:w-9 bg-gradient-to-l from-[#82BA46] via-[#82BA46]/70 to-transparent z-20" />
                <button
                  type="button"
                  onClick={() => scrollShelfBy(220)}
                  className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-[#1B5E20] shadow-md items-center justify-center cursor-pointer transition active:scale-95"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            <div
              ref={shelfScrollRef}
              onScroll={updateScrollIndicators}
              className="shelf-scroll flex items-center justify-start gap-3 sm:gap-5 overflow-x-auto touch-pan-x overscroll-x-contain snap-x snap-proximity scroll-smooth pt-5 pb-2 px-3 min-h-[120px] sm:min-h-[128px]"
            >
              {targetPlayer.scoringCards.length > 0 ? (
                targetPlayer.scoringCards.map((card) => {
                  const liveScore = cardScoresMap.get(card.id) ?? 0;
                  return (
                    <div
                      key={card.id}
                      className="flex-shrink-0 snap-start flex justify-center overflow-visible"
                    >
                      <PlateView
                        card={card}
                        size="shelf"
                        showFlipArrow={!isViewingOpponent && isMyTurn}
                        liveScore={
                          isGameOver || (!isViewingOpponent && !targetPlayer.isBot)
                            ? liveScore
                            : undefined
                        }
                        onFlip={!isViewingOpponent && isMyTurn ? () => flipCard(card.id) : undefined}
                        onDragToMarket={!isViewingOpponent && canUndo ? () => undoCurrentTurnAction() : undefined}
                        className="overflow-visible"
                      />
                    </div>
                  );
                })
              ) : (
                <div className="w-full text-center text-white/95 font-fredoka text-xs sm:text-sm py-3 bg-black/10 rounded-2xl border border-dashed border-white/35">
                  🥗 {isViewingOpponent
                    ? lang === 'id'
                      ? `${targetPlayer.name} belum memiliki piring resep poin.`
                      : `${targetPlayer.name} has no scoring recipe plates yet.`
                    : lang === 'id'
                    ? 'Belum ada piring resep. Ambil piring dari talenan di atas!'
                    : 'No recipe plates yet. Draft one from the cutting board above!'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
