import React from 'react';
import { motion } from 'framer-motion';
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
  compact?: boolean;
  className?: string;
}

const PLAYER_COLORS = [
  { header: 'bg-[#2E7D32]', border: 'border-[#2E7D32]', badgeBg: 'bg-[#7CB342]' },
  { header: 'bg-[#C0A018]', border: 'border-[#B29112]', badgeBg: 'bg-[#E6B800]' },
  { header: 'bg-[#7B1FA2]', border: 'border-[#7B1FA2]', badgeBg: 'bg-[#9C27B0]' },
  { header: 'bg-[#E65100]', border: 'border-[#E65100]', badgeBg: 'bg-[#FB8C00]' },
];

export const PlayerSideCard: React.FC<PlayerSideCardProps> = ({
  player,
  playerIndex,
  allPlayers,
  isActiveTurn,
  isGameOver: _isGameOver,
  compact = false,
  className = '',
}) => {
  const { setInspectedPlayerIndex, lang } = useGameStore();
  const colorTheme = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
  const { totalScore } = evaluatePlayerScore(playerIndex, [...allPlayers]);

  const row1Resources = ['kubis', 'tomat', 'paprika'] as const;
  const row2Resources = ['bawang', 'wortel', 'selada'] as const;
  const allResources = [...row1Resources, ...row2Resources] as const;

  // COMPACT MODE FOR MOBILE TOP BAR
  if (compact) {
    return (
      <div
        onClick={() => setInspectedPlayerIndex(playerIndex)}
        role="button"
        tabIndex={0}
        className={`relative bg-[#FFFDF8] rounded-2xl border-2 shadow-md overflow-hidden transition-all duration-200 select-none cursor-pointer active:scale-[0.98] ${
          isActiveTurn
            ? 'ring-2 ring-[#43A047] border-[#2E7D32] shadow-lg'
            : 'border-[#D7C4A3]'
        } ${className}`}
      >
        {/* Compact Header */}
        <div className={`${colorTheme.header} px-2.5 py-1 text-white flex items-center justify-between gap-1.5`}>
          <div className="flex items-center gap-1 min-w-0">
            {isActiveTurn && (
              <span className="w-2 h-2 rounded-full bg-lime-300 animate-ping shrink-0" />
            )}
            <span className="font-black text-[11px] font-fredoka truncate">
              {player.name}
            </span>
          </div>
          <motion.div
            key={totalScore}
            initial={{ scale: 1.35 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 450, damping: 18 }}
            className="w-6 h-6 rounded-full bg-[#7CB342] border-[1.5px] border-white shadow-xs flex items-center justify-center font-black font-fredoka text-[11px] text-white shrink-0"
          >
            {totalScore}
          </motion.div>
        </div>

        {/* Compact 6-Veggie Strip + Recipe count */}
        <div className="px-2 py-1.5 flex items-center justify-between gap-1 bg-[#FCF8EE]">
          <div className="grid grid-cols-6 gap-0.5 flex-1">
            {allResources.map((res) => {
              const count = player.resources[res] ?? 0;
              return (
                <div
                  key={res}
                  className={`flex flex-col items-center justify-center rounded-md py-0.5 ${
                    count > 0 ? 'bg-white shadow-2xs' : 'opacity-45'
                  }`}
                >
                  <VeggieIcon resource={res} size={15} />
                  <span className="text-[10px] font-black text-stone-800 leading-none mt-0.5">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="pl-1 border-l border-stone-200 flex flex-col items-center justify-center text-[9px] font-black text-[#1B5E20] shrink-0">
            <span>🥗{player.scoringCards.length}</span>
          </div>
        </div>
      </div>
    );
  }

  // FULL DESKTOP SIDE CARD
  return (
    <motion.div
      animate={isActiveTurn ? { scale: 1.02 } : { scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`w-[232px] xl:w-[258px] flex-shrink-0 bg-[#FFFDF8] rounded-2xl border-[2.5px] shadow-lg overflow-hidden transition-all duration-200 select-none ${
        isActiveTurn
          ? 'ring-4 ring-[#43A047]/80 border-[#2E7D32] shadow-[0_10px_28px_-4px_rgba(46,125,50,0.35)]'
          : 'border-[#D7C4A3] hover:border-[#B68245]'
      } ${className}`}
    >
      {/* Header Banner: Name, Active Pill & Popping Score Badge */}
      <div
        className={`${colorTheme.header} px-3.5 py-2 text-white flex items-center justify-between gap-2`}
      >
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-black text-sm xl:text-base font-fredoka truncate tracking-wide drop-shadow-xs">
              {playerIndex + 1}. {player.name}
            </span>
            {player.isBot && (
              <span className="text-[9px] bg-black/25 px-1.5 py-0.5 rounded font-black font-mono shrink-0">
                BOT
              </span>
            )}
          </div>
          {isActiveTurn && (
            <span className="text-[10px] font-black text-lime-200 tracking-wider uppercase flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-lime-300 animate-pulse" />
              {lang === 'id' ? 'Giliran Main' : 'Active Turn'}
            </span>
          )}
        </div>

        {/* Circular Live Score Badge with Pop Animation */}
        <motion.div
          key={totalScore}
          initial={{ scale: 1.4 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 16 }}
          className="w-8 h-8 xl:w-9 xl:h-9 rounded-full bg-[#7CB342] border-2 border-white shadow-sm flex items-center justify-center font-black font-fredoka text-sm xl:text-base text-white flex-shrink-0"
        >
          {totalScore}
        </motion.div>
      </div>

      {/* Body: 2x3 Grid of Vegetable Counts */}
      <div className="p-2.5 bg-[#FCF8EE] flex flex-col gap-1.5">
        {/* Row 1: Kubis, Tomat, Paprika */}
        <div className="grid grid-cols-3 gap-1.5 items-center justify-items-center">
          {row1Resources.map((res) => {
            const count = player.resources[res] ?? 0;
            return (
              <div
                key={res}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border w-full justify-center transition-colors ${
                  count > 0
                    ? 'bg-white border-stone-200 shadow-2xs'
                    : 'bg-white/45 border-stone-200/50 opacity-65'
                }`}
              >
                <span className="font-black text-sm xl:text-base font-fredoka text-stone-800">
                  {count}
                </span>
                <VeggieIcon resource={res} size={24} />
              </div>
            );
          })}
        </div>

        {/* Row 2: Bawang, Wortel, Selada */}
        <div className="grid grid-cols-3 gap-1.5 items-center justify-items-center">
          {row2Resources.map((res) => {
            const count = player.resources[res] ?? 0;
            return (
              <div
                key={res}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border w-full justify-center transition-colors ${
                  count > 0
                    ? 'bg-white border-stone-200 shadow-2xs'
                    : 'bg-white/45 border-stone-200/50 opacity-65'
                }`}
              >
                <span className="font-black text-sm xl:text-base font-fredoka text-stone-800">
                  {count}
                </span>
                <VeggieIcon resource={res} size={24} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer: Resep Poin Milik Pemain & Tombol Intip Resep */}
      <div className="px-3 py-1.5 bg-[#F4ECDC] border-t border-[#E5D7BE] flex items-center justify-between text-xs">
        <span className="font-bold text-stone-700 font-fredoka flex items-center gap-1 text-xs">
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
          className="bg-white hover:bg-emerald-50 active:scale-95 text-[#1B5E20] border border-[#2E7D32]/40 font-black px-2.5 py-0.5 rounded-lg shadow-2xs font-fredoka flex items-center gap-1 transition-all cursor-pointer text-[11px] hover:border-[#2E7D32]"
          title={`Lihat kartu resep poin milik ${player.name}`}
        >
          <span>👀</span>
          <span>{lang === 'id' ? 'Lihat' : 'Peek'}</span>
        </button>
      </div>
    </motion.div>
  );
};
