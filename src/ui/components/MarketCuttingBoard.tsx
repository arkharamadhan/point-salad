import React from 'react';
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
  } = useGameStore();

  const { market, hasTakenMainActionThisTurn, phase } = gameState;
  const isActionAllowed = phase !== 'game_over' && !hasTakenMainActionThisTurn;

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
    // If not selected yet, select it
    if (!selectedResourceSlots.includes(slotIndex)) {
      selectResourceSlot(slotIndex);
      // If that makes 2 selections, trigger confirm automatically
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
    <div className="relative w-full max-w-xl md:max-w-2xl mx-auto cutting-board p-4 sm:p-6 md:p-7 select-none flex flex-col justify-between overflow-hidden">
      {/* Organic Wood Grain Lines & Curves Overlay (matching reference image) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-70 overflow-hidden rounded-[24px]"
        viewBox="0 0 600 400"
        preserveAspectRatio="none"
      >
        {/* Inner subtle carved perimeter line */}
        <rect x="8" y="8" width="584" height="384" rx="20" stroke="#DFB87F" strokeWidth="1.5" fill="none" strokeOpacity="0.7" />

        {/* Natural Horizontal Wood Grain Waves */}
        <path d="M 10 38 Q 160 55, 320 32 T 590 42" stroke="#C69658" strokeWidth="2" fill="none" strokeOpacity="0.8" />
        <path d="M 15 65 Q 180 82, 340 58 T 585 70" stroke="#DBB278" strokeWidth="1.5" fill="none" strokeOpacity="0.6" />
        <path d="M 10 115 Q 190 138, 360 108 T 590 120" stroke="#C69658" strokeWidth="2.2" fill="none" strokeOpacity="0.75" />
        <path d="M 20 148 Q 210 172, 380 138 T 585 152" stroke="#DBB278" strokeWidth="1.5" fill="none" strokeOpacity="0.65" />
        <path d="M 10 195 Q 170 220, 350 185 T 590 205" stroke="#C69658" strokeWidth="2" fill="none" strokeOpacity="0.8" />
        <path d="M 15 240 Q 200 268, 380 230 T 585 250" stroke="#DBB278" strokeWidth="1.5" fill="none" strokeOpacity="0.6" />
        <path d="M 10 288 Q 180 315, 360 278 T 590 298" stroke="#C69658" strokeWidth="2.2" fill="none" strokeOpacity="0.85" />
        <path d="M 25 330 Q 220 355, 390 320 T 585 338" stroke="#DBB278" strokeWidth="1.5" fill="none" strokeOpacity="0.65" />
        <path d="M 10 368 Q 190 388, 370 358 T 590 375" stroke="#C69658" strokeWidth="1.8" fill="none" strokeOpacity="0.7" />

        {/* Prominent Tree Growth Rings / Curves on the Right Side (as in game reference) */}
        <path d="M 440 10 C 515 50, 565 130, 535 220 C 505 295, 435 340, 360 370" stroke="#BD8947" strokeWidth="2.5" fill="none" strokeOpacity="0.85" />
        <path d="M 465 10 C 535 60, 580 140, 550 225 C 525 290, 460 330, 395 355" stroke="#DBB278" strokeWidth="1.8" fill="none" strokeOpacity="0.75" />
        <path d="M 490 10 C 555 70, 595 150, 565 230 C 545 285, 485 320, 430 340" stroke="#BD8947" strokeWidth="2" fill="none" strokeOpacity="0.8" />
        <path d="M 520 15 C 575 80, 605 160, 580 235 C 565 275, 515 305, 465 325" stroke="#DBB278" strokeWidth="1.5" fill="none" strokeOpacity="0.6" />

        {/* Small subtle wood whorl/knot on left */}
        <ellipse cx="140" cy="125" rx="14" ry="7" stroke="#BD8947" strokeWidth="1.8" fill="none" strokeOpacity="0.7" transform="rotate(-8 140 125)" />
        <ellipse cx="140" cy="125" rx="8" ry="4" stroke="#DBB278" strokeWidth="1.2" fill="none" strokeOpacity="0.6" transform="rotate(-8 140 125)" />
      </svg>

      {/* Top-Right Deck Count Badge (pepet di pojok kanan atas persis sesuai referensi) */}
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
        className={`absolute top-0 right-0 z-20 bg-[#C88448] text-white font-black font-fredoka text-xs sm:text-sm px-3 py-1.5 rounded-bl-2xl rounded-tr-[24px] shadow-sm border-l border-b border-[#B06E35] flex items-center gap-1.5 transition-transform ${
          isActionAllowed && totalCardsInPiles > 0
            ? 'cursor-pointer hover:bg-[#B77338] active:scale-95'
            : 'opacity-70'
        }`}
        title="Sisa kartu di tumpukan dek (klik untuk ambil buta)"
      >
        <span>🂠</span>
        <span>{totalCardsInPiles}</span>
      </button>

      {/* 1. TOP ROW: 3 WHITE CERAMIC PLATES (with drag and drop to shelf support) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 justify-items-center mb-3 sm:mb-4 pt-1 z-10">
        {[0, 1, 2].map((colIndex) => {
          const scoringCard = market.scoringSlots[colIndex];
          return (
            <PlateView
              key={colIndex}
              card={scoringCard}
              showFlipArrow={true}
              isSelectable={isActionAllowed}
              onClick={isActionAllowed ? () => handleTakeScoringMarket(colIndex) : undefined}
              onDragToShelf={isActionAllowed ? () => handleTakeScoringMarket(colIndex) : undefined}
            />
          );
        })}
      </div>

      {/* 2. MIDDLE ROW: 3 STANDALONE VEGETABLES (ROW 1) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 justify-items-center mb-2 sm:mb-3 z-10">
        {[0, 1, 2].map((colIndex) => {
          const slotIndex = colIndex * 2;
          const resCard = market.resourceSlots[slotIndex];

          return (
            <VeggieCharacter
              key={slotIndex}
              resource={resCard?.resource}
              isSelectable={isActionAllowed && !!resCard}
              isSelected={selectedResourceSlots.includes(slotIndex)}
              onClick={
                isActionAllowed && resCard ? () => selectResourceSlot(slotIndex) : undefined
              }
              onDragToShelf={
                isActionAllowed && resCard ? () => handleVeggieDragToShelf(slotIndex) : undefined
              }
              size={56}
            />
          );
        })}
      </div>

      {/* 3. BOTTOM ROW: 3 STANDALONE VEGETABLES (ROW 2) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 justify-items-center mb-2 z-10">
        {[0, 1, 2].map((colIndex) => {
          const slotIndex = colIndex * 2 + 1;
          const resCard = market.resourceSlots[slotIndex];

          return (
            <VeggieCharacter
              key={slotIndex}
              resource={resCard?.resource}
              isSelectable={isActionAllowed && !!resCard}
              isSelected={selectedResourceSlots.includes(slotIndex)}
              onClick={
                isActionAllowed && resCard ? () => selectResourceSlot(slotIndex) : undefined
              }
              onDragToShelf={
                isActionAllowed && resCard ? () => handleVeggieDragToShelf(slotIndex) : undefined
              }
              size={56}
            />
          );
        })}
      </div>

      {/* BOTTOM BOARD INSTRUCTION TEXT (matching reference image) */}
      <p className="text-center font-black text-xs sm:text-sm text-[#9C6D38] font-fredoka tracking-wide drop-shadow-sm select-none mt-1 z-10">
        Take 1 point plate or 2 veggies
      </p>
    </div>
  );
};
