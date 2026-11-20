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
    shelfViewingPlayerIndex,
    setShelfViewingPlayerIndex,
  } = useGameStore();

  const { players, currentTurnPlayerIndex, hasTakenMainActionThisTurn, phase } = gameState;
  const activePlayer = players[currentTurnPlayerIndex];
  const targetPlayerIndex = shelfViewingPlayerIndex ?? currentTurnPlayerIndex;
  const targetPlayer = players[targetPlayerIndex] ?? activePlayer;
  const isViewingOpponent = targetPlayerIndex !== currentTurnPlayerIndex;
  const isGameOver = phase === 'game_over';

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
      lang === 'id' ? 'Ambil Sayur!' : 'Confirm veggies or press [Space]!';
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

      {/* 2. Player Point Plates Shelf (Tray in light green, wraps 4 per row downwards) */}
      <div className="w-full bg-[#8BC34A] border-t-4 border-[#7CB342] rounded-t-3xl pt-8 sm:pt-9 pb-5 px-2 sm:px-4 md:px-6 shadow-[0_-6px_20px_rgba(0,0,0,0.12)] overflow-visible">
        <div className="max-w-5xl mx-auto flex flex-col gap-2.5 overflow-visible">
          {/* Player Switcher Tabs: Allows peeking at any player's recipes inline! */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 px-1 justify-center sm:justify-start">
            {players.map((p, idx) => {
              const isSelected = idx === targetPlayerIndex;
              const isMe = idx === currentTurnPlayerIndex;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setShelfViewingPlayerIndex(idx === currentTurnPlayerIndex ? null : idx)}
                  className={`px-3 py-1 rounded-full text-xs font-black font-fredoka transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-white text-[#1B5E20] shadow-md ring-2 ring-white scale-105'
                      : 'bg-black/20 hover:bg-black/30 text-white/90'
                  }`}
                  title={isMe ? 'Piring resep Anda' : `Intip resep ${p.name}`}
                >
                  <span>{isMe ? '👤' : p.isBot ? '🤖' : '🥗'}</span>
                  <span>
                    {p.name} {isMe ? (lang === 'id' ? '(Anda)' : '(You)') : ''}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-emerald-100 text-emerald-900' : 'bg-black/25 text-white'
                    }`}
                  >
                    {p.scoringCards.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Header indicator inside shelf */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-white text-xs font-black font-fredoka px-2 gap-1 text-center sm:text-left">
            <span className="flex items-center gap-1.5 drop-shadow">
              <span>🥗</span>
              <span>
                {isViewingOpponent
                  ? lang === 'id'
                    ? `👀 Melihat Resep Milik ${targetPlayer.name} (${targetPlayer.scoringCards.length} Resep)`
                    : `👀 Viewing Recipes of ${targetPlayer.name} (${targetPlayer.scoringCards.length} Recipes)`
                  : lang === 'id'
                  ? `Resep Poin Milik ${activePlayer.name} (${activePlayer.scoringCards.length})`
                  : `Point Recipes of ${activePlayer.name} (${activePlayer.scoringCards.length})`}
              </span>
            </span>

            {isViewingOpponent ? (
              <button
                type="button"
                onClick={() => setShelfViewingPlayerIndex(null)}
                className="bg-white/20 hover:bg-white/35 active:scale-95 text-white text-[11px] font-black px-3 py-0.5 rounded-full border border-white/50 cursor-pointer transition-transform shadow-xs"
              >
                ↺ {lang === 'id' ? 'Kembali ke Resep Saya' : 'Back to My Recipes'}
              </button>
            ) : (
              <span className="text-[11px] text-lime-100 font-normal drop-shadow">
                {canUndo
                  ? 'Tarik piring ke atas atau klik "Kembalikan" untuk batal ambil'
                  : 'Klik ikon sayur di pojok piring untuk membalik resep jadi sayur'}
              </span>
            )}
          </div>

          {/* Grid of Plates owned by target player (Max 4 per row, wraps downwards) */}
          <div className="grid grid-cols-4 gap-x-2 sm:gap-x-4 md:gap-x-6 gap-y-7 sm:gap-y-9 justify-items-center max-w-sm sm:max-w-md md:max-w-xl mx-auto pt-5 pb-3 px-1 overflow-visible">
            {targetPlayer.scoringCards.length > 0 ? (
              targetPlayer.scoringCards.map((card) => {
                const liveScore = cardScoresMap.get(card.id) ?? 0;
                return (
                  <div key={card.id} className="w-full flex justify-center overflow-visible">
                    <PlateView
                      card={card}
                      size="shelf"
                      showFlipArrow={!isViewingOpponent}
                      liveScore={liveScore}
                      onFlip={!isViewingOpponent ? () => flipCard(card.id) : undefined}
                      onDragToMarket={!isViewingOpponent && canUndo ? () => undoCurrentTurnAction() : undefined}
                      className="overflow-visible"
                    />
                  </div>
                );
              })
            ) : (
              <div className="col-span-4 text-center text-white/90 font-fredoka text-xs sm:text-sm py-4">
                🥗 {isViewingOpponent
                  ? lang === 'id'
                    ? `${targetPlayer.name} belum memiliki piring resep poin.`
                    : `${targetPlayer.name} has no scoring recipe plates yet.`
                  : lang === 'id'
                  ? 'Belum ada piring resep poin. Ambil piring dari meja pasar di atas!'
                  : 'No scoring recipe plates yet. Draft one from the market above!'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
