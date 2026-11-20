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
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40 overflow-hidden rounded-[26px]"
        viewBox="0 0 600 400"
        preserveAspectRatio="none"
      >
        {/* Wavy Horizontal Wood Grain Lines */}
        <path d="M 20 40 Q 200 65 400 35 T 580 45" stroke="#C9A46E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M 40 95 Q 240 120 440 85 T 570 100" stroke="#D8B57E" strokeWidth="1.5" fill="none" />
        <path d="M 10 155 Q 180 185 380 145 T 590 160" stroke="#C9A46E" strokeWidth="2" fill="none" />
        <path d="M 30 225 Q 220 255 420 215 T 580 230" stroke="#D8B57E" strokeWidth="1.5" fill="none" />
        <path d="M 15 295 Q 250 330 460 280 T 590 300" stroke="#C9A46E" strokeWidth="2" fill="none" />
        <path d="M 50 360 Q 260 380 470 345 T 570 360" stroke="#D8B57E" strokeWidth="1.5" fill="none" />
        {/* Tree Ring Ellipses / Curves on the Right Side */}
        <path d="M 470 20 C 530 70, 565 150, 525 230 C 495 290, 420 330, 360 350" stroke="#C9A46E" strokeWidth="2" fill="none" />
        <path d="M 500 40 C 550 90, 580 160, 545 220 C 520 270, 460 310, 410 330" stroke="#D8B57E" strokeWidth="1.5" fill="none" />
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
