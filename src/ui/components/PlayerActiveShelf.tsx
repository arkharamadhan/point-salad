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
    mpRole,
    mpMyPlayerIndex,
    mpRemoteHasSnapshot,
  } = useGameStore();

  const { players, currentTurnPlayerIndex, hasTakenMainActionThisTurn, phase } = gameState;
  const activePlayer = players[currentTurnPlayerIndex];
  const isOnline = mpRole !== 'none';
  const isMyTurn = !isOnline || (mpMyPlayerIndex !== null && currentTurnPlayerIndex === mpMyPlayerIndex);
  const defaultPlayerIndex = isOnline && mpMyPlayerIndex !== null ? mpMyPlayerIndex : currentTurnPlayerIndex;
  const targetPlayerIndex = shelfViewingPlayerIndex ?? defaultPlayerIndex;
  const targetPlayer = players[targetPlayerIndex] ?? activePlayer;
  const isViewingOpponent = targetPlayerIndex !== defaultPlayerIndex;
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
  } else if (selectedResourceSlots.length === 1) {
    instructionText = lang === 'id' ? 'Pilih 1 Sayur lagi!' : 'Choose 1 more veggie!';
  } else if (selectedResourceSlots.length === neededResourcesCount) {
    instructionText =
      lang === 'id' ? 'Ambil Sayur!' : 'Confirm veggies or press [Space]!';
  }

  const canConfirm =
    isMyTurn && !hasTakenMainActionThisTurn && selectedResourceSlots.length === neededResourcesCount;
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
          {/* Top Shelf Row: Player Switcher Tabs + Helper Hint */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {players.map((p, idx) => {
                const isSelected = idx === targetPlayerIndex;
                const isMe = idx === currentTurnPlayerIndex;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setShelfViewingPlayerIndex(idx === currentTurnPlayerIndex ? null : idx)}
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

            {isViewingOpponent ? (
              <button
                type="button"
                onClick={() => setShelfViewingPlayerIndex(null)}
                className="bg-white/25 hover:bg-white/40 active:scale-95 text-white text-[11px] font-black px-3 py-0.5 rounded-full border border-white/60 cursor-pointer transition-transform shadow-xs"
              >
                ↺ {lang === 'id' ? 'Kembali ke Resep Saya' : 'Back to My Recipes'}
              </button>
            ) : (
              <span className="hidden sm:inline text-[11px] text-lime-50 font-medium drop-shadow-xs">
                {canUndo
                  ? 'Tarik piring ke atas atau klik "Kembalikan" untuk batal'
                  : 'Klik sayur di pojok piring untuk balik jadi sayur'}
              </span>
            )}
          </div>

          {/* Plates Row (horizontally scrollable on overflow so desktop stays 1-screen viewport-fit!) */}
          <div className="flex items-center justify-start gap-3 sm:gap-5 overflow-x-auto pt-5 pb-2 px-3 min-h-[120px] sm:min-h-[128px]">
            {targetPlayer.scoringCards.length > 0 ? (
              targetPlayer.scoringCards.map((card) => {
                const liveScore = cardScoresMap.get(card.id) ?? 0;
                return (
                  <div key={card.id} className="flex-shrink-0 flex justify-center overflow-visible">
                    <PlateView
                      card={card}
                      size="shelf"
                      showFlipArrow={!isViewingOpponent && isMyTurn}
                      liveScore={liveScore}
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
  );
};
