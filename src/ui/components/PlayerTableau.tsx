import React from 'react';
import { ALL_RESOURCES } from '../../engine/types';
import { evaluatePlayerScore } from '../../engine/scoring';
import { useGameStore } from '../store/gameStore';
import { CardView } from './CardView';
import { SpiceIcon, SPICE_INFO } from './icons/SpiceIcon';
import { Sound } from '../sound/soundEffects';

export const PlayerTableau: React.FC = () => {
  const { gameState, flipCard, endTurn, lang, soundEnabled } = useGameStore();
  const { players, currentTurnPlayerIndex, hasTakenMainActionThisTurn, phase } = gameState;

  const handleEndTurn = () => {
    Sound.turnEnd(soundEnabled);
    endTurn();
  };

  const activePlayer = players[currentTurnPlayerIndex];
  if (!activePlayer) return null;

  // Evaluate active player live score
  const { totalScore, cardScores } = evaluatePlayerScore(
    currentTurnPlayerIndex,
    players,
    lang
  );

  const totalResourcesCount = Object.values(activePlayer.resources).reduce((a, b) => a + b, 0);
  const isGameOver = phase === 'game_over';

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {/* 1. Opponents Compact Overview */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {players.map((player, idx) => {
          const isActive = idx === currentTurnPlayerIndex;
          const { totalScore: pScore } = evaluatePlayerScore(idx, players, lang);
          const pResourcesCount = Object.values(player.resources).reduce((a, b) => a + b, 0);

          return (
            <div
              key={player.id}
              className={`px-3 py-2 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
                isActive
                  ? 'bg-amber-950/80 border-amber-500 shadow-lg ring-2 ring-amber-500/50'
                  : 'bg-stone-900/60 border-stone-800 text-stone-400'
              }`}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isActive ? 'bg-amber-400 animate-ping' : 'bg-stone-600'
                    }`}
                  />
                  <span className="text-xs sm:text-sm font-bold text-stone-200 font-cinzel">
                    {player.name}
                  </span>
                  {isActive && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 rounded font-semibold">
                      Giliran
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-stone-400">
                  {player.scoringCards.length} Kartu Skor • {pResourcesCount} Rempah
                </span>
              </div>

              {/* Total Score Tag */}
              <div className="bg-stone-950/80 px-2.5 py-1 rounded-lg border border-stone-700 text-center">
                <span className="text-[10px] text-stone-400 block font-medium">Skor</span>
                <span className="text-xs sm:text-sm font-black text-amber-300">
                  {pScore}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Active Player Detailed Tableau */}
      <div className="bg-stone-900/95 border-2 border-amber-600/60 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
        {/* Tableau Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-4 mb-4 border-b border-stone-800 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-amber-300 font-bold font-cinzel text-base">
              {currentTurnPlayerIndex + 1}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-stone-100 font-cinzel">
                  Area Milik: {activePlayer.name}
                </h3>
                <span className="bg-amber-900/60 text-amber-300 border border-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  Aktif
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Total Rempah: <strong className="text-emerald-400">{totalResourcesCount}</strong> • Kartu Skor: <strong className="text-amber-400">{activePlayer.scoringCards.length}</strong> (Dibalik: {activePlayer.flippedCards.length})
              </p>
            </div>
          </div>

          {/* Action Status / End Turn Button */}
          <div className="flex items-center gap-3">
            <div className="bg-stone-950/90 border border-amber-500/40 px-3 py-1.5 rounded-xl text-center shadow-inner">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-semibold">
                Skor Berjalan
              </span>
              <span className="text-lg sm:text-xl font-extrabold text-amber-400">
                {totalScore} <span className="text-xs font-normal text-stone-400">pts</span>
              </span>
            </div>

            {hasTakenMainActionThisTurn && !isGameOver && (
              <button
                onClick={handleEndTurn}
                className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Selesai Giliran</span>
                <span>➔</span>
              </button>
            )}
          </div>
        </div>

        {/* Rempah Collection Counters (Bar) */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 font-cinzel">
            Koleksi Rempah ({totalResourcesCount} Total)
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {ALL_RESOURCES.map((resource) => {
              const info = SPICE_INFO[resource];
              const count = activePlayer.resources[resource] ?? 0;

              return (
                <div
                  key={resource}
                  className="bg-stone-950/70 border border-stone-800 rounded-xl p-2.5 flex items-center gap-2.5 transition-all hover:border-stone-700"
                >
                  <SpiceIcon resource={resource} size={32} />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-stone-300">
                      {lang === 'id' ? info.nameId : info.nameEn}
                    </span>
                    <span
                      className="text-base font-black"
                      style={{ color: count > 0 ? info.color : '#78716C' }}
                    >
                      {count} <span className="text-[10px] font-normal text-stone-500">kartu</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Scoring Cards Grid */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider font-cinzel">
              Kartu Skor Aktif ({activePlayer.scoringCards.length})
            </h4>
            <span className="text-[11px] text-stone-500 italic">
              Klik 'Balik' untuk mengubah kartu skor menjadi rempah secara permanen.
            </span>
          </div>

          {activePlayer.scoringCards.length > 0 ? (
            <div className="flex flex-wrap gap-3 overflow-x-auto py-2">
              {activePlayer.scoringCards.map((card, idx) => {
                const scoreDetail = cardScores[idx];
                const liveCardScore = scoreDetail?.score ?? 0;
                const isTentative = scoreDetail?.isTentativeMajority ?? false;

                return (
                  <CardView
                    key={card.id}
                    card={card}
                    side="scoring"
                    liveScore={liveCardScore}
                    isTentativeMajority={isTentative}
                    canFlip={!isGameOver}
                    onFlip={() => flipCard(card.id)}
                    lang={lang}
                    className="flex-shrink-0"
                  />
                );
              })}
            </div>
          ) : (
            <div className="w-full py-8 border-2 border-dashed border-stone-800 rounded-xl flex flex-col items-center justify-center text-stone-500">
              <span className="text-2xl mb-1">📜</span>
              <p className="text-sm font-medium">Belum ada kartu skor yang diambil.</p>
              <p className="text-xs text-stone-600">
                Ambil kartu skor dari pasar atau atas tumpukan pada giliranmu!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
