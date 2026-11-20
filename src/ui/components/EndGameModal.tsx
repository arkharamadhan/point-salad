import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useGameStore } from '../store/gameStore';
import { Sound } from '../sound/soundEffects';

export const EndGameModal: React.FC = () => {
  const { gameState, startNewGame, soundEnabled } = useGameStore();
  const { phase, finalScores } = gameState;
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (phase === 'game_over') {
      Sound.winFanfare(soundEnabled);
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.55 },
        });
      } catch {
        // safe fallback
      }
    }
  }, [phase, soundEnabled]);

  if (phase !== 'game_over' || !finalScores) return null;

  const winners = finalScores.filter((s) => s.rank === 1);
  const isSharedWin = winners.length > 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-stone-900 border-2 border-amber-600/80 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl text-stone-100 my-auto">
        {/* Celebration Header */}
        <div className="text-center mb-6">
          <span className="text-4xl sm:text-5xl mb-2 inline-block animate-bounce">
            🏆
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-cinzel tracking-wider">
            {isSharedWin ? 'KEMENANGAN BERSAMA!' : 'PERMAINAN SELESAI!'}
          </h2>
          <p className="text-sm text-stone-300 mt-1">
            {isSharedWin
              ? `Selamat kepada ${winners.map((w) => w.playerName).join(' & ')} atas skor imbang!`
              : `Selamat kepada ${winners[0]?.playerName} atas kemenangan gemilang!`}
          </p>
        </div>

        {/* Podium / Final Score Standings */}
        <div className="flex flex-col gap-3 mb-6">
          {finalScores.map((scoreReport) => {
            const isWinner = scoreReport.rank === 1;
            const isExpanded = expandedPlayerId === scoreReport.playerId;

            return (
              <div
                key={scoreReport.playerId}
                className={`rounded-2xl border transition-all ${
                  isWinner
                    ? 'bg-amber-950/60 border-amber-500 shadow-lg'
                    : 'bg-stone-950/60 border-stone-800'
                }`}
              >
                <div
                  onClick={() =>
                    setExpandedPlayerId(isExpanded ? null : scoreReport.playerId)
                  }
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-stone-800/40 rounded-2xl select-none"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold font-cinzel text-sm ${
                        isWinner
                          ? 'bg-amber-500 text-stone-950 shadow'
                          : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      #{scoreReport.rank}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-stone-100">
                          {scoreReport.playerName}
                        </span>
                        {isWinner && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded-full font-bold">
                            Juara
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-stone-400">
                        {scoreReport.totalResources} Rempah • {scoreReport.unflippedScoringCardsCount} Kartu Skor
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xl sm:text-2xl font-black text-amber-400">
                        {scoreReport.totalScore}
                      </span>
                      <span className="text-xs text-stone-400 block font-medium">poin</span>
                    </div>
                    <span className="text-stone-500 text-sm">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {/* Expanded Card Breakdown */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-stone-800/80">
                    <h5 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 font-cinzel">
                      Rincian Poin per Kartu Skor:
                    </h5>
                    {scoreReport.cardScores.length > 0 ? (
                      <div className="space-y-1.5">
                        {scoreReport.cardScores.map((detail, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs bg-stone-900/80 px-3 py-2 rounded-lg border border-stone-800"
                          >
                            <span className="text-stone-300 font-medium">
                              {detail.description}
                            </span>
                            <span
                              className={`font-mono font-bold ${
                                detail.score > 0
                                  ? 'text-emerald-400'
                                  : detail.score < 0
                                  ? 'text-rose-400'
                                  : 'text-stone-400'
                              }`}
                            >
                              {detail.score > 0 ? `+${detail.score}` : detail.score} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-500 italic">
                        Tidak ada kartu skor tersisa (semua dibalik menjadi rempah).
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Tiebreaker Note */}
        <div className="text-center text-xs text-stone-400 mb-6 bg-stone-950/40 p-3 rounded-xl border border-stone-800">
          Penentu Pemenang: 1. Skor Tertinggi ➔ 2. Total Kartu Rempah ➔ 3. Kartu Skor Belum Dibalik ➔ 4. Menang Bersama.
        </div>

        {/* Play Again Button */}
        <div className="flex justify-center">
          <button
            onClick={() => startNewGame()}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-base px-8 py-3 rounded-2xl shadow-xl transition-all transform hover:scale-105 active:scale-95 font-cinzel"
          >
            Main Lagi (New Game)
          </button>
        </div>
      </div>
    </div>
  );
};
