import React from 'react';
import { useGameStore } from '../store/gameStore';
import { PlateView } from './PlateView';
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
  } = useGameStore();

  const { players, currentTurnPlayerIndex, hasTakenMainActionThisTurn, phase } = gameState;
  const activePlayer = players[currentTurnPlayerIndex];
  const isGameOver = phase === 'game_over';

  if (!activePlayer) return null;

  // Calculate live score breakdown for each scoring card owned by active player
  const scoreReport = evaluatePlayerScore(currentTurnPlayerIndex, players);
  const cardScoresMap = new Map<string, number>();
  for (const cs of scoreReport.cardScores) {
    cardScoresMap.set(cs.cardId, cs.score);
  }

  // Instruction banner text based on turn state
  const availableResourceCount = gameState.market.resourceSlots.filter(Boolean).length;
  const allPilesEmpty = gameState.market.piles.every((p) => p.length === 0);
  const neededResourcesCount = availableResourceCount === 1 && allPilesEmpty ? 1 : 2;

  let instructionText = lang === 'id' ? 'Pilih 2 Sayur atau 1 Resep Poin!' : 'Choose your veggies!';
  if (isGameOver) {
    instructionText = lang === 'id' ? 'Permainan Selesai!' : 'Game Over!';
  } else if (isBotThinking) {
    instructionText = lang === 'id' ? '🤖 Bot sedang berpikir...' : '🤖 Bot is thinking...';
  } else if (hasTakenMainActionThisTurn) {
    instructionText =
      lang === 'id'
        ? 'Kartu berhasil diambil!'
        : 'Cards drafted!';
  } else if (selectedResourceSlots.length === 1) {
    instructionText = lang === 'id' ? 'Pilih 1 Sayur lagi!' : 'Choose 1 more veggie!';
  } else if (selectedResourceSlots.length === neededResourcesCount) {
    instructionText =
      lang === 'id' ? 'Klik Ambil Sayur atau tekan [Spasi]!' : 'Confirm veggies or press [Space]!';
  }

  const canConfirm = !hasTakenMainActionThisTurn && selectedResourceSlots.length === neededResourcesCount;
  const canUndo = (hasTakenMainActionThisTurn || !!turnSnapshot) && !isGameOver && !isBotThinking;

  return (
    <div className="w-full flex flex-col items-center select-none mt-2">
      {/* 1. Instruction Pill Banner (exactly like reference image) */}
      <div className="z-20 -mb-4 px-4 flex items-center gap-2">
        {canConfirm ? (
          <button
            onClick={() => confirmTakeResources()}
            className="bg-white border-[3px] border-[#2E7D32] hover:bg-[#E8F5E9] active:scale-95 text-[#1B5E20] font-black text-sm sm:text-lg font-fredoka px-8 py-2 rounded-full shadow-lg transition-transform cursor-pointer animate-bounce flex items-center gap-2"
          >
            <span>✓</span> {instructionText}
          </button>
        ) : (
          <div className="bg-white border-[3px] border-[#2E7D32] rounded-full px-7 sm:px-10 py-1.5 sm:py-2 shadow-md flex items-center gap-3">
            <h3 className="text-sm sm:text-lg md:text-xl font-black text-[#1B5E20] font-fredoka tracking-wide">
              {instructionText}
            </h3>

            {/* Quick Undo / Return card button if drafted this turn */}
            {canUndo && (
              <button
                type="button"
                onClick={() => undoCurrentTurnAction()}
                className="bg-[#C88448] hover:bg-[#B57339] active:scale-95 text-white font-black text-xs sm:text-sm px-3 py-1 rounded-full shadow transition-all cursor-pointer flex items-center gap-1 font-fredoka"
                title="Kembalikan kartu ke pasar dan pilih ulang"
              >
                <span>↺</span>
                <span>{lang === 'id' ? 'Kembalikan' : 'Undo'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Active Player Point Plates Shelf (Tray in light green) */}
      <div className="w-full bg-[#8BC34A] border-t-4 border-[#7CB342] rounded-t-3xl pt-6 pb-4 px-4 sm:px-6 shadow-[0_-6px_20px_rgba(0,0,0,0.12)]">
        <div className="max-w-5xl mx-auto flex flex-col gap-2">
          {/* Header indicator inside shelf */}
          <div className="flex items-center justify-between text-white text-xs font-black font-fredoka px-2">
            <span className="flex items-center gap-1.5 drop-shadow">
              <span>🥗</span>
              <span>
                Resep Poin Milik {activePlayer.name} ({activePlayer.scoringCards.length})
              </span>
            </span>
            <span className="text-[11px] text-lime-100 font-normal drop-shadow">
              {canUndo
                ? 'Tarik piring ke atas atau klik "Kembalikan" untuk batal ambil'
                : 'Klik ikon sayur di pojok piring untuk membalik resep jadi sayur'}
            </span>
          </div>

          {/* Row of Plates owned by active player (drag up to return supported) */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 overflow-x-auto py-2 px-1 min-h-[105px]">
            {activePlayer.scoringCards.length > 0 ? (
              activePlayer.scoringCards.map((card) => {
                const liveScore = cardScoresMap.get(card.id) ?? 0;
                return (
                  <PlateView
                    key={card.id}
                    card={card}
                    size="shelf"
                    showFlipArrow={true}
                    liveScore={liveScore}
                    onFlip={() => flipCard(card.id)}
                    onDragToMarket={canUndo ? () => undoCurrentTurnAction() : undefined}
                    className="flex-shrink-0"
                  />
                );
              })
            ) : (
              <div className="text-center text-white/90 font-fredoka text-xs sm:text-sm py-2">
                🥗 Belum ada piring resep poin. Ambil piring dari meja pasar di atas!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
