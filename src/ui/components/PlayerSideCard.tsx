import React from 'react';
import { PlayerState } from '../../engine/types';
import { VeggieIcon } from './icons/SpiceIcon';
import { evaluatePlayerScore } from '../../engine/scoring';
import { useGameStore } from '../store/gameStore';

interface PlayerSideCardProps {
  player: PlayerState;
  playerIndex: number;
  allPlayers: readonly PlayerState[];
  isActiveTurn: boolean;
  isGameOver: boolean;
  className?: string;
}

const PLAYER_COLORS = [
  { header: 'bg-[#2E7D32]', border: 'border-[#2E7D32]', badgeText: 'text-[#2E7D32]' },
  { header: 'bg-[#C0CA33]', border: 'border-[#AFB42B]', badgeText: 'text-[#827717]' },
  { header: 'bg-[#7B1FA2]', border: 'border-[#7B1FA2]', badgeText: 'text-[#7B1FA2]' },
  { header: 'bg-[#EF6C00]', border: 'border-[#EF6C00]', badgeText: 'text-[#E65100]' },
];

export const PlayerSideCard: React.FC<PlayerSideCardProps> = ({
  player,
  playerIndex,
  allPlayers,
  isActiveTurn,
  isGameOver: _isGameOver,
  className = '',
}) => {
  const { setInspectedPlayerIndex, lang } = useGameStore();
  const colorTheme = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
  const { totalScore } = evaluatePlayerScore(playerIndex, [...allPlayers]);

  // Vegetable order matching reference image:
  // Row 1: Kubis (purple), Tomat (red), Paprika (yellow)
  // Row 2: Bawang (magenta), Wortel (orange), Selada (green)
  const row1Resources = ['kubis', 'tomat', 'paprika'] as const;
  const row2Resources = ['bawang', 'wortel', 'selada'] as const;

  return (
    <div
      className={`w-60 sm:w-64 md:w-72 lg:w-[280px] flex-shrink-0 bg-white rounded-2xl border-[2.5px] shadow-md overflow-hidden transition-all duration-200 select-none ${
        isActiveTurn
          ? 'ring-4 ring-[#43A047] border-[#43A047] scale-[1.02] shadow-xl'
          : 'border-stone-200 hover:border-stone-300'
      } ${className}`}
    >
      {/* Header Banner: Name & Score Badge (matching reference image) */}
      <div
        className={`${colorTheme.header} px-3 py-2 sm:px-4 sm:py-2.5 text-white flex items-center justify-between gap-2`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="font-black text-xs sm:text-sm md:text-base font-fredoka truncate tracking-wide drop-shadow-sm">
            {playerIndex + 1}. {player.name}
          </span>
          {player.isBot && (
            <span className="text-[9px] sm:text-[10px] bg-black/30 px-1 py-0.5 rounded font-black font-mono">
              BOT
            </span>
          )}
        </div>

        {/* Circular Live Score Badge (prominent, matching reference image) */}
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#7CB342] border-2 border-white shadow-sm flex items-center justify-center font-black font-fredoka text-xs sm:text-sm md:text-base text-white flex-shrink-0">
          {totalScore}
        </div>
      </div>

      {/* Body: 2x3 Grid of Vegetable Counts (Enlarged & Prominent) */}
      <div className="p-2 sm:p-3 bg-[#FCFAF5] flex flex-col gap-1.5 sm:gap-2">
        {/* Row 1: Kubis, Tomat, Paprika */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 items-center justify-items-center">
          {row1Resources.map((res) => {
            const count = player.resources[res] ?? 0;
            return (
              <div key={res} className="flex items-center gap-1 sm:gap-1.5 bg-white/70 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-xl border border-stone-200/60 shadow-xs w-full justify-center">
                <span className="font-black text-sm sm:text-base md:text-lg font-fredoka text-stone-800">
                  {count}
                </span>
                <VeggieIcon resource={res} size={24} className="sm:w-7 sm:h-7" />
              </div>
            );
          })}
        </div>

        {/* Row 2: Bawang, Wortel, Selada */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 items-center justify-items-center">
          {row2Resources.map((res) => {
            const count = player.resources[res] ?? 0;
            return (
              <div key={res} className="flex items-center gap-1 sm:gap-1.5 bg-white/70 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-xl border border-stone-200/60 shadow-xs w-full justify-center">
                <span className="font-black text-sm sm:text-base md:text-lg font-fredoka text-stone-800">
                  {count}
                </span>
                <VeggieIcon resource={res} size={24} className="sm:w-7 sm:h-7" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer: Resep Poin Milik Pemain & Tombol Intip Resep */}
      <div className="px-3 py-1.5 bg-stone-100/90 border-t border-stone-200 flex items-center justify-between text-xs">
        <span className="font-bold text-stone-700 font-fredoka flex items-center gap-1.5 text-[11px] sm:text-xs">
          <span>🥗</span>
          <span>
            {player.scoringCards.length} {lang === 'id' ? 'Resep' : 'Recipes'}
          </span>
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setInspectedPlayerIndex(playerIndex);
          }}
          className="bg-white hover:bg-emerald-50 active:scale-95 text-[#1B5E20] border border-[#2E7D32]/40 font-black px-2.5 py-0.5 sm:py-1 rounded-lg shadow-2xs font-fredoka flex items-center gap-1 transition-all cursor-pointer text-[11px] sm:text-xs hover:border-[#2E7D32]"
          title={`Lihat kartu resep poin milik ${player.name}`}
        >
          <span>👀</span>
          <span>{lang === 'id' ? 'Lihat' : 'Peek'}</span>
        </button>
      </div>
    </div>
  );
};
