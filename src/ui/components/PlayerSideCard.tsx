import React from 'react';
import { PlayerState } from '../../engine/types';
import { VeggieIcon } from './icons/SpiceIcon';
import { evaluatePlayerScore } from '../../engine/scoring';

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
  const colorTheme = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
  const { totalScore } = evaluatePlayerScore(playerIndex, [...allPlayers]);

  // Vegetable order matching reference image:
  // Row 1: Kubis (purple), Tomat (red), Paprika (yellow)
  // Row 2: Bawang (magenta), Wortel (orange), Selada (green)
  const row1Resources = ['kubis', 'tomat', 'paprika'] as const;
  const row2Resources = ['bawang', 'wortel', 'selada'] as const;

  return (
    <div
      className={`w-full max-w-[210px] sm:max-w-[230px] bg-white rounded-2xl border-2 shadow-md overflow-hidden transition-all duration-200 select-none ${
        isActiveTurn
          ? 'ring-4 ring-[#43A047] border-[#43A047] scale-[1.02] shadow-xl'
          : 'border-stone-200 hover:border-stone-300'
      } ${className}`}
    >
      {/* Header Banner: Name & Score Badge */}
      <div
        className={`${colorTheme.header} px-3 py-2 text-white flex items-center justify-between gap-2`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-black text-xs sm:text-sm font-fredoka truncate tracking-wide">
            {playerIndex + 1}. {player.name}
          </span>
          {player.isBot && (
            <span className="text-[9px] bg-black/25 px-1 rounded font-bold font-mono">
              BOT
            </span>
          )}
        </div>

        {/* Circular Live Score Badge (exactly like reference image) */}
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-stone-200 shadow-sm flex items-center justify-center font-black font-fredoka text-xs sm:text-sm text-stone-900 flex-shrink-0">
          {totalScore}
        </div>
      </div>

      {/* Body: 2x3 Grid of Vegetable Counts (exactly like reference image) */}
      <div className="p-2 sm:p-2.5 bg-[#FCFAF5] flex flex-col gap-1.5">
        {/* Row 1: Kubis, Tomat, Paprika */}
        <div className="grid grid-cols-3 gap-1 items-center justify-items-center">
          {row1Resources.map((res) => {
            const count = player.resources[res] ?? 0;
            return (
              <div key={res} className="flex items-center gap-1">
                <span className="font-black text-xs sm:text-sm font-fredoka text-stone-800">
                  {count}
                </span>
                <VeggieIcon resource={res} size={22} />
              </div>
            );
          })}
        </div>

        {/* Row 2: Bawang, Wortel, Selada */}
        <div className="grid grid-cols-3 gap-1 items-center justify-items-center">
          {row2Resources.map((res) => {
            const count = player.resources[res] ?? 0;
            return (
              <div key={res} className="flex items-center gap-1">
                <span className="font-black text-xs sm:text-sm font-fredoka text-stone-800">
                  {count}
                </span>
                <VeggieIcon resource={res} size={22} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
