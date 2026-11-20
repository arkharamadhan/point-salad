import React from 'react';
import { useGameStore } from '../store/gameStore';
import { PlateView } from './PlateView';
import { VeggieIcon } from './icons/SpiceIcon';
import { evaluatePlayerScore } from '../../engine/scoring';

const PLAYER_COLORS = [
  { header: 'bg-[#2E7D32]', border: 'border-[#2E7D32]' },
  { header: 'bg-[#C0CA33]', border: 'border-[#AFB42B]' },
  { header: 'bg-[#7B1FA2]', border: 'border-[#7B1FA2]' },
  { header: 'bg-[#EF6C00]', border: 'border-[#EF6C00]' },
];

export const PlayerRecipesModal: React.FC = () => {
  const { gameState, inspectedPlayerIndex, setInspectedPlayerIndex, lang, mpRole, mpMyPlayerIndex } =
    useGameStore();

  if (inspectedPlayerIndex === null) return null;

  const player = gameState.players[inspectedPlayerIndex];
  if (!player) return null;

  const isGameOver = gameState.phase === 'game_over';
  const humanCount = gameState.players.filter((p) => !p.isBot).length;
  const isMe =
    mpRole !== 'none'
      ? mpMyPlayerIndex !== null && inspectedPlayerIndex === mpMyPlayerIndex
      : !player.isBot && (humanCount === 1 || inspectedPlayerIndex === gameState.currentTurnPlayerIndex);
  const canSeeScore = isGameOver || isMe;

  const colorTheme = PLAYER_COLORS[inspectedPlayerIndex % PLAYER_COLORS.length];
  const { totalScore, cardScores } = evaluatePlayerScore(inspectedPlayerIndex, gameState.players);
  const cardScoresMap = new Map<string, number>();
  for (const cs of cardScores) {
    cardScoresMap.set(cs.cardId, cs.score);
  }

  const row1Resources = ['kubis', 'tomat', 'paprika'] as const;
  const row2Resources = ['bawang', 'wortel', 'selada'] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border-4 border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div
          className={`${colorTheme.header} px-4 py-3 text-white flex items-center justify-between gap-3 shadow-sm`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl">🥗</span>
            <div>
              <h2 className="font-black text-base sm:text-lg font-fredoka truncate leading-tight">
                {player.name} {isMe ? (lang === 'id' ? '(Anda)' : '(You)') : ''}
              </h2>
              <p className="text-[11px] text-white/80 font-normal">
                {player.isBot
                  ? lang === 'id'
                    ? 'Lawan Komputer (Bot)'
                    : 'Computer Opponent (Bot)'
                  : lang === 'id'
                  ? 'Pemain Manusia'
                  : 'Human Player'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-full text-xs font-black font-fredoka">
              <span>🏆</span>
              <span>
                {canSeeScore ? `${totalScore} ${lang === 'id' ? 'Poin' : 'Pts'}` : '?'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setInspectedPlayerIndex(null)}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white font-black text-sm flex items-center justify-center cursor-pointer transition-transform active:scale-90"
              title="Tutup"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#FCFAF5]">
          {/* Vegetable Inventory of Inspected Player */}
          <div className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-xs flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-black font-fredoka text-stone-700">
              <span className="flex items-center gap-1">
                <span>🧺</span>
                <span>
                  {lang === 'id' ? 'Koleksi Sayuran Saat Ini' : 'Current Vegetable Inventory'}
                </span>
              </span>
              <span className="text-stone-400 font-normal text-[11px]">
                {Object.values(player.resources).reduce((a, b) => a + b, 0)}{' '}
                {lang === 'id' ? 'total sayur' : 'total veggies'}
              </span>
            </div>

            <div className="grid grid-cols-6 gap-1 sm:gap-2">
              {[...row1Resources, ...row2Resources].map((res) => {
                const count = player.resources[res] ?? 0;
                return (
                  <div
                    key={res}
                    className="flex flex-col items-center justify-center bg-stone-50 rounded-xl p-1.5 border border-stone-200/60"
                  >
                    <VeggieIcon resource={res} size={24} />
                    <span className="font-black text-xs sm:text-sm font-fredoka text-stone-800 mt-0.5">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recipe Plates Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-black font-fredoka text-stone-700 px-1">
              <span className="flex items-center gap-1.5">
                <span>🍽️</span>
                <span>
                  {lang === 'id' ? 'Kartu Resep Poin' : 'Scoring Recipe Plates'} (
                  {player.scoringCards.length})
                </span>
              </span>
              <span className="text-[11px] text-stone-500 font-normal">
                {canSeeScore
                  ? lang === 'id'
                    ? 'Angka hijau di pojok adalah poin saat ini'
                    : 'Green badge shows current live score'
                  : lang === 'id'
                  ? 'Skor lawan dirahasiakan sampai akhir permainan'
                  : 'Opponent score is hidden until game over'}
              </span>
            </div>

            {player.scoringCards.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-2 gap-y-7 sm:gap-4 justify-items-center pt-5 pb-2">
                {player.scoringCards.map((card) => {
                  const liveScore = cardScoresMap.get(card.id) ?? 0;
                  return (
                    <div key={card.id} className="flex flex-col items-center">
                      <PlateView
                        card={card}
                        size="shelf"
                        showFlipArrow={true}
                        liveScore={canSeeScore ? liveScore : undefined}
                        className="overflow-visible"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-stone-500 font-fredoka text-xs sm:text-sm bg-white rounded-2xl border border-dashed border-stone-300">
                🥗 {lang === 'id'
                  ? 'Pemain ini belum mengambil kartu resep poin.'
                  : 'This player has not drafted any scoring plates yet.'}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-stone-100 border-t border-stone-200 flex items-center justify-between">
          <p className="text-[11px] text-stone-500 font-fredoka">
            💡 {lang === 'id'
              ? 'Di Point Salad, semua resep bersifat terbuka.'
              : 'In Point Salad, all scoring recipes are public.'}
          </p>
          <button
            type="button"
            onClick={() => setInspectedPlayerIndex(null)}
            className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 active:scale-95 text-white font-black text-xs font-fredoka shadow-md transition-all cursor-pointer"
          >
            {lang === 'id' ? 'Tutup' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
