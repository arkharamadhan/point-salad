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

  return (
    <div className="relative w-full max-w-xl md:max-w-2xl mx-auto cutting-board p-4 sm:p-6 md:p-7 select-none flex flex-col justify-between">
      {/* Top-Right Deck Count Badge (exactly like reference image) */}
      <button
        type="button"
        onClick={
          isActionAllowed && totalCardsInPiles > 0
            ? () => {
                // Find non-empty pile
                const idx = market.piles.findIndex((p) => p.length > 0);
                if (idx !== -1) handleTakeScoringPile(idx);
              }
            : undefined
        }
        className={`absolute top-3.5 right-3.5 sm:top-4 sm:right-4 bg-[#C88448] text-white font-black font-fredoka text-xs sm:text-sm px-2.5 py-1 rounded-xl shadow-md border border-[#B06E35] flex items-center gap-1 transition-transform ${
          isActionAllowed && totalCardsInPiles > 0
            ? 'cursor-pointer hover:scale-105 active:scale-95'
            : 'opacity-70'
        }`}
        title="Sisa kartu di tumpukan dek (klik untuk ambil buta)"
      >
        <span>🂠</span>
        <span>{totalCardsInPiles}</span>
      </button>

      {/* 1. TOP ROW: 3 WHITE CERAMIC PLATES WITH FLIP VEGGIE ARROW */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 justify-items-center mb-3 sm:mb-4 pt-1">
        {[0, 1, 2].map((colIndex) => {
          const scoringCard = market.scoringSlots[colIndex];
          return (
            <PlateView
              key={colIndex}
              card={scoringCard}
              showFlipArrow={true}
              keyboardBadge={`[${colIndex + 1}]`}
              isSelectable={isActionAllowed}
              onClick={isActionAllowed ? () => handleTakeScoringMarket(colIndex) : undefined}
            />
          );
        })}
      </div>

      {/* 2. MIDDLE ROW: 3 STANDALONE VEGETABLES (ROW 1) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 justify-items-center mb-2 sm:mb-3">
        {[0, 1, 2].map((colIndex) => {
          const slotIndex = colIndex * 2;
          const resCard = market.resourceSlots[slotIndex];
          const shortcutBadge = ['Q', 'W', 'E'][colIndex];

          return (
            <VeggieCharacter
              key={slotIndex}
              resource={resCard?.resource}
              keyboardBadge={`[${shortcutBadge}]`}
              isSelectable={isActionAllowed && !!resCard}
              isSelected={selectedResourceSlots.includes(slotIndex)}
              onClick={
                isActionAllowed && resCard ? () => selectResourceSlot(slotIndex) : undefined
              }
              size={56}
            />
          );
        })}
      </div>

      {/* 3. BOTTOM ROW: 3 STANDALONE VEGETABLES (ROW 2) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 justify-items-center mb-2">
        {[0, 1, 2].map((colIndex) => {
          const slotIndex = colIndex * 2 + 1;
          const resCard = market.resourceSlots[slotIndex];
          const shortcutBadge = ['A', 'S', 'D'][colIndex];

          return (
            <VeggieCharacter
              key={slotIndex}
              resource={resCard?.resource}
              keyboardBadge={`[${shortcutBadge}]`}
              isSelectable={isActionAllowed && !!resCard}
              isSelected={selectedResourceSlots.includes(slotIndex)}
              onClick={
                isActionAllowed && resCard ? () => selectResourceSlot(slotIndex) : undefined
              }
              size={56}
            />
          );
        })}
      </div>

      {/* BOTTOM BOARD INSTRUCTION TEXT (matching reference image) */}
      <p className="text-center font-black text-xs sm:text-sm text-[#9C6D38] font-fredoka tracking-wide drop-shadow-sm select-none mt-1">
        Take 1 point plate or 2 veggies
      </p>
    </div>
  );
};
