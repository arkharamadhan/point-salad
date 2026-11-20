import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { PlateView } from './PlateView';
import { VeggieCharacter } from './VeggieCharacter';
import { Sound } from '../sound/soundEffects';

export const MarketCuttingBoard: React.FC = () => {
  const {
    gameState,
    selectedResourceSlots,
    selectResourceSlot,
    confirmTakeResources,
    takeScoringMarket,
    takeScoringPile,
    soundEnabled,
    lang,
    mpRole,
    mpMyPlayerIndex,
  } = useGameStore();

  const { market, hasTakenMainActionThisTurn, phase, players, currentTurnPlayerIndex } = gameState;
  const isMyTurn =
    mpRole === 'none' || (mpMyPlayerIndex !== null && currentTurnPlayerIndex === mpMyPlayerIndex);
  const activePlayerName = players[currentTurnPlayerIndex]?.name ?? '';
  const isActionAllowed = phase !== 'game_over' && !hasTakenMainActionThisTurn && isMyTurn;

  const totalCardsInPiles = market.piles.reduce((sum, p) => sum + p.length, 0);

  const handleTakeScoringMarket = (slotIndex: number) => {
    Sound.cardDraw(soundEnabled);
    takeScoringMarket(slotIndex);
  };

  const handleTakeScoringPile = (pileIndex: number) => {
    Sound.cardDraw(soundEnabled);
    takeScoringPile(pileIndex);
  };

  const handleVeggieDragToShelf = (slotIndex: number) => {
    if (!isActionAllowed) return;
    if (!selectedResourceSlots.includes(slotIndex)) {
      selectResourceSlot(slotIndex);
      const currentSelected = useGameStore.getState().selectedResourceSlots;
      const availableCount = market.resourceSlots.filter(Boolean).length;
      const allPilesEmpty = market.piles.every((p) => p.length === 0);
      const needed = availableCount === 1 && allPilesEmpty ? 1 : 2;
      if (currentSelected.length === needed) {
        confirmTakeResources();
      }
    }
  };

  return (
    <div className="relative w-full max-w-[440px] sm:max-w-[540px] lg:max-w-[600px] xl:max-w-[650px] mx-auto cutting-board px-2.5 py-3 sm:px-6 sm:py-5 lg:px-7 lg:py-5 select-none flex flex-col justify-between overflow-hidden">
      {/* Organic Wood Grain Lines & Juice Groove Overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-75 overflow-hidden rounded-[24px]"
        viewBox="0 0 600 400"
        preserveAspectRatio="none"
      >
        {/* Recessed wooden juice groove */}
        <rect
          x="11"
          y="11"
          width="578"
          height="378"
          rx="18"
          stroke="#BE8A4A"
          strokeWidth="2.5"
          fill="none"
          strokeOpacity="0.55"
        />
        <rect
          x="13"
          y="13"
          width="574"
          height="374"
          rx="16"
          stroke="#FFF4DD"
          strokeWidth="1.2"
          fill="none"
          strokeOpacity="0.55"
        />

        {/* Natural Horizontal Wood Grain Waves */}
        <path d="M 10 42 Q 160 58, 320 35 T 590 45" stroke="#C69658" strokeWidth="2" fill="none" strokeOpacity="0.75" />
        <path d="M 15 78 Q 180 94, 340 70 T 585 82" stroke="#DBB278" strokeWidth="1.5" fill="none" strokeOpacity="0.55" />
        <path d="M 10 128 Q 190 150, 360 120 T 590 132" stroke="#C69658" strokeWidth="2.2" fill="none" strokeOpacity="0.7" />
        <path d="M 20 165 Q 210 185, 380 154 T 585 168" stroke="#DBB278" strokeWidth="1.5" fill="none" strokeOpacity="0.6" />
        <path d="M 10 212 Q 170 236, 350 202 T 590 220" stroke="#C69658" strokeWidth="2" fill="none" strokeOpacity="0.75" />
        <path d="M 15 260 Q 200 284, 380 250 T 585 268" stroke="#DBB278" strokeWidth="1.5" fill="none" strokeOpacity="0.55" />
        <path d="M 10 306 Q 180 330, 360 295 T 590 314" stroke="#C69658" strokeWidth="2.2" fill="none" strokeOpacity="0.8" />
        <path d="M 25 352 Q 220 374, 390 342 T 585 358" stroke="#DBB278" strokeWidth="1.5" fill="none" strokeOpacity="0.6" />

        {/* Tree Growth Curves on the Right */}
        <path d="M 445 10 C 520 50, 568 130, 538 220 C 508 295, 438 340, 365 370" stroke="#BD8947" strokeWidth="2.4" fill="none" strokeOpacity="0.78" />
        <path d="M 472 10 C 540 60, 582 140, 554 225 C 528 290, 464 330, 400 355" stroke="#DBB278" strokeWidth="1.6" fill="none" strokeOpacity="0.7" />
        <path d="M 500 10 C 560 70, 598 150, 568 230 C 548 285, 488 320, 434 340" stroke="#BD8947" strokeWidth="2" fill="none" strokeOpacity="0.72" />

        {/* Subtle wood knot */}
        <ellipse cx="128" cy="128" rx="14" ry="7" stroke="#BD8947" strokeWidth="1.8" fill="none" strokeOpacity="0.65" transform="rotate(-8 128 128)" />
        <ellipse cx="128" cy="128" rx="8" ry="4" stroke="#DBB278" strokeWidth="1.2" fill="none" strokeOpacity="0.55" transform="rotate(-8 128 128)" />
      </svg>

      {/* Top-Left Cutting Board Handle Slot Accent */}
      <div className="pointer-events-none absolute top-2.5 left-3.5 z-10 w-8 h-3 rounded-full bg-[#A8753A]/45 border border-[#8E5F29]/40 shadow-inner" />

      {/* Top-Right Deck Count Badge */}
      <button
        type="button"
        onClick={
          isActionAllowed && totalCardsInPiles > 0
            ? () => {
                const idx = market.piles.findIndex((p) => p.length > 0);
                if (idx !== -1) handleTakeScoringPile(idx);
              }
            : undefined
        }
        className={`absolute top-0 right-0 z-20 bg-[#B66E34] text-white font-black font-fredoka text-xs sm:text-sm px-3.5 py-1.5 rounded-bl-2xl rounded-tr-[22px] shadow-md border-l-2 border-b-2 border-[#945624] flex items-center gap-1.5 transition-transform ${
          isActionAllowed && totalCardsInPiles > 0
            ? 'cursor-pointer hover:bg-[#A05E29] active:scale-95'
            : 'opacity-70'
        }`}
        title={
          lang === 'id'
            ? 'Sisa kartu di tumpukan dek (klik untuk ambil buta)'
            : 'Remaining deck cards (click for blind draw)'
        }
      >
        <span>🂠</span>
        <span>{totalCardsInPiles}</span>
      </button>

      {/* 1. TOP ROW: 3 WHITE CERAMIC PLATES */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-4 lg:gap-6 justify-items-center mb-2.5 sm:mb-3.5 pt-3.5 sm:pt-3 z-10">
        {[0, 1, 2].map((colIndex) => {
          const scoringCard = market.scoringSlots[colIndex];
          return (
            <motion.div
              key={scoringCard?.id ?? `plate-empty-${colIndex}`}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            >
              <PlateView
                card={scoringCard}
                showFlipArrow={true}
                isSelectable={isActionAllowed}
                onClick={isActionAllowed ? () => handleTakeScoringMarket(colIndex) : undefined}
                onDragToShelf={isActionAllowed ? () => handleTakeScoringMarket(colIndex) : undefined}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Subtle carved divider between plates and fresh veggies */}
      <div className="w-[88%] mx-auto h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#B68245]/45 to-transparent mb-2 sm:mb-3 z-10" />

      {/* 2. MIDDLE ROW: 3 STANDALONE VEGETABLES (ROW 1) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6 justify-items-center mb-1.5 sm:mb-2.5 z-10">
        {[0, 1, 2].map((colIndex) => {
          const slotIndex = colIndex * 2;
          const resCard = market.resourceSlots[slotIndex];

          return (
            <VeggieCharacter
              key={slotIndex}
              cardKey={resCard?.id ?? `empty-${slotIndex}`}
              resource={resCard?.resource}
              isSelectable={isActionAllowed && !!resCard}
              isSelected={selectedResourceSlots.includes(slotIndex)}
              onClick={
                isActionAllowed && resCard ? () => selectResourceSlot(slotIndex) : undefined
              }
              onDragToShelf={
                isActionAllowed && resCard ? () => handleVeggieDragToShelf(slotIndex) : undefined
              }
            />
          );
        })}
      </div>

      {/* 3. BOTTOM ROW: 3 STANDALONE VEGETABLES (ROW 2) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6 justify-items-center mb-1.5 z-10">
        {[0, 1, 2].map((colIndex) => {
          const slotIndex = colIndex * 2 + 1;
          const resCard = market.resourceSlots[slotIndex];

          return (
            <VeggieCharacter
              key={slotIndex}
              cardKey={resCard?.id ?? `empty-${slotIndex}`}
              resource={resCard?.resource}
              isSelectable={isActionAllowed && !!resCard}
              isSelected={selectedResourceSlots.includes(slotIndex)}
              onClick={
                isActionAllowed && resCard ? () => selectResourceSlot(slotIndex) : undefined
              }
              onDragToShelf={
                isActionAllowed && resCard ? () => handleVeggieDragToShelf(slotIndex) : undefined
              }
            />
          );
        })}
      </div>

      {/* BOTTOM BOARD INSTRUCTION TEXT */}
      <p className="text-center font-black text-[11px] sm:text-xs lg:text-sm text-[#855726] font-fredoka tracking-wide drop-shadow-xs select-none mt-0.5 z-10">
        {!isMyTurn && phase !== 'game_over'
          ? lang === 'id'
            ? `⏳ Menunggu giliran ${activePlayerName}...`
            : `⏳ Waiting for ${activePlayerName}'s turn...`
          : lang === 'id'
          ? 'Ambil 1 piring resep atau 2 sayur segar'
          : 'Take 1 point plate or 2 fresh veggies'}
      </p>
    </div>
  );
};
