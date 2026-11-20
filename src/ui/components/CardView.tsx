import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../engine/types';
import { SCORING_CONDITIONS_MAP } from '../../engine/scoring';
import { SpiceIcon, SPICE_INFO } from './icons/SpiceIcon';
import { Sound } from '../sound/soundEffects';
import { useGameStore } from '../store/gameStore';

export interface CardViewProps {
  card?: Card | null;
  side: 'scoring' | 'resource' | 'back';
  onClick?: () => void;
  isSelected?: boolean;
  isSelectable?: boolean;
  pileCount?: number;
  liveScore?: number;
  isTentativeMajority?: boolean;
  onFlip?: () => void;
  canFlip?: boolean;
  className?: string;
  lang?: 'id' | 'en';
  keyboardBadge?: string;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  side,
  onClick,
  isSelected = false,
  isSelectable = false,
  pileCount,
  liveScore,
  isTentativeMajority = false,
  onFlip,
  canFlip = false,
  className = '',
  lang = 'id',
  keyboardBadge,
}) => {
  const { soundEnabled } = useGameStore();

  const handleClick = () => {
    if (onClick) {
      Sound.cardSelect(soundEnabled);
      onClick();
    }
  };

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFlip) {
      Sound.cardFlip(soundEnabled);
      onFlip();
    }
  };

  // Punggung kartu / Draw Pile Back
  if (side === 'back' || !card) {
    return (
      <motion.div
        whileHover={isSelectable ? { scale: 1.03, y: -4 } : {}}
        whileTap={isSelectable ? { scale: 0.97 } : {}}
        onClick={handleClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        className={`relative w-28 h-40 sm:w-32 sm:h-44 md:w-36 md:h-52 rounded-xl p-2 select-none transition-all card-shadow ${
          isSelectable
            ? 'cursor-pointer hover:ring-2 hover:ring-amber-500'
            : ''
        } ${isSelected ? 'card-selected-glow ring-2 ring-emerald-500' : ''} ${className}`}
        style={{
          background: 'radial-gradient(circle at 50% 40%, #382419 0%, #20130C 80%, #150A05 100%)',
          border: '2px solid #5A3A26',
        }}
      >
        {keyboardBadge && (
          <span className="absolute -top-2 -left-2 z-20 bg-stone-900 border border-stone-700 text-amber-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow">
            {keyboardBadge}
          </span>
        )}

        <div className="w-full h-full rounded-lg border border-amber-900/60 flex flex-col items-center justify-between p-2 relative overflow-hidden">
          {/* Subtle geometric mandala pattern */}
          <div className="absolute inset-0 opacity-15 pointer-events-none flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-28 h-28 text-amber-500 fill-current">
              <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" fill="none" />
              <polygon points="50,5 62,38 95,50 62,62 50,95 38,62 5,50 38,38" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="50" cy="50" r="22" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          </div>

          <div className="text-[10px] font-semibold text-amber-300/70 tracking-widest uppercase font-cinzel">
            Tumpukan
          </div>

          {/* Central Logo Motif */}
          <div className="flex flex-col items-center z-10">
            <div className="w-10 h-10 rounded-full bg-amber-900/50 border border-amber-500/40 flex items-center justify-center mb-1">
              <span className="text-amber-400 font-bold text-sm font-cinzel">PR</span>
            </div>
            <span className="text-[11px] font-bold text-amber-200/90 font-cinzel tracking-wider text-center">
              PASAR REMPAH
            </span>
          </div>

          {/* Card count badge if provided */}
          {typeof pileCount === 'number' && (
            <div className="z-10 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-600/50 text-[11px] font-bold text-amber-300">
              {pileCount} kartu
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  const spiceInfo = SPICE_INFO[card.resource];
  const condition = SCORING_CONDITIONS_MAP.get(card.scoringId);
  const conditionText = condition?.text[lang] ?? condition?.text.id ?? '';

  // SISI REMPAH (Resource Side)
  if (side === 'resource') {
    return (
      <motion.div
        whileHover={isSelectable ? { scale: 1.04, y: -4 } : {}}
        whileTap={isSelectable ? { scale: 0.96 } : {}}
        onClick={handleClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        className={`relative w-28 h-40 sm:w-32 sm:h-44 md:w-36 md:h-52 rounded-xl p-2 select-none transition-all card-shadow paper-texture text-stone-900 flex flex-col justify-between border-2 ${
          isSelected ? 'card-selected-glow ring-2 ring-emerald-500 scale-[1.03]' : ''
        } ${
          isSelectable
            ? 'cursor-pointer hover:border-emerald-600'
            : ''
        } ${className}`}
        style={{
          borderColor: isSelected ? '#10B981' : spiceInfo.color,
        }}
      >
        {keyboardBadge && (
          <span className="absolute -top-2 -left-2 z-20 bg-stone-900 border border-stone-700 text-emerald-400 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow">
            {keyboardBadge}
          </span>
        )}

        {/* Top corner: Mini icon + Name */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <SpiceIcon resource={card.resource} size={18} />
            <span className="text-[11px] font-bold tracking-tight text-stone-800">
              {lang === 'id' ? spiceInfo.nameId : spiceInfo.nameEn}
            </span>
          </div>
          <span className="text-[9px] font-mono text-stone-400 font-semibold">{card.id}</span>
        </div>

        {/* Center: Large Distinct Graphic */}
        <div className="flex flex-col items-center justify-center my-auto py-1">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center p-2 shadow-inner"
            style={{ backgroundColor: spiceInfo.bgColor }}
          >
            <SpiceIcon resource={card.resource} size={54} />
          </div>
          <span
            className="mt-1.5 text-xs sm:text-sm font-extrabold uppercase tracking-wide font-cinzel"
            style={{ color: spiceInfo.color }}
          >
            {lang === 'id' ? spiceInfo.nameId : spiceInfo.nameEn}
          </span>
        </div>

        {/* Bottom Strip: Scoring condition code hint */}
        <div className="pt-1 border-t border-stone-200/80 flex items-center justify-between text-[10px] text-stone-500 font-medium">
          <span className="capitalize">{spiceInfo.shape}</span>
          <span className="font-mono text-[9px] bg-stone-200/60 px-1 rounded text-stone-600">
            {card.scoringId}
          </span>
        </div>
      </motion.div>
    );
  }

  // SISI SKOR (Scoring Side)
  return (
    <motion.div
      whileHover={isSelectable ? { scale: 1.04, y: -4 } : {}}
      whileTap={isSelectable ? { scale: 0.96 } : {}}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`relative w-28 h-40 sm:w-32 sm:h-44 md:w-36 md:h-52 rounded-xl p-2 select-none transition-all card-shadow paper-texture text-stone-900 flex flex-col justify-between border-2 ${
        isSelected ? 'card-selected-glow ring-2 ring-emerald-500 scale-[1.03]' : ''
      } ${
        isSelectable
          ? 'cursor-pointer hover:border-amber-600'
          : ''
      } ${className}`}
      style={{
        borderColor: isSelected ? '#10B981' : '#8C3820',
      }}
    >
      {keyboardBadge && (
        <span className="absolute -top-2 -left-2 z-20 bg-stone-900 border border-stone-700 text-amber-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow">
          {keyboardBadge}
        </span>
      )}

      {/* Top Header Banner */}
      <div className="flex items-center justify-between pb-1 border-b border-stone-200">
        <div className="flex items-center gap-1">
          <span className="bg-[#8C3820] text-white px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-cinzel">
            SKOR
          </span>
          <span className="text-[10px] font-mono font-bold text-stone-600">
            {card.scoringId}
          </span>
        </div>

        {/* Live score badge if calculated */}
        {typeof liveScore === 'number' && (
          <div
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm ${
              liveScore > 0
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-400'
                : liveScore < 0
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : 'bg-stone-200 text-stone-700'
            }`}
            title={isTentativeMajority ? 'Skor sementara berdasarkan posisi pemain saat ini' : 'Skor kartu saat ini'}
          >
            {liveScore > 0 ? `+${liveScore}` : liveScore} pts
            {isTentativeMajority && <span className="ml-0.5 text-amber-600 font-bold">*</span>}
          </div>
        )}
      </div>

      {/* Main Condition Text */}
      <div className="flex flex-col items-center justify-center my-auto px-1 text-center">
        <div className="text-xs sm:text-[13px] font-bold text-stone-900 leading-snug">
          {conditionText}
        </div>
      </div>

      {/* Bottom Footer: Resource Flip Side Info + Flip Button */}
      <div className="pt-1.5 border-t border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-1" title={`Sisi rempah: ${spiceInfo.nameId}`}>
          <SpiceIcon resource={card.resource} size={16} />
          <span className="text-[10px] font-semibold text-stone-600">
            {lang === 'id' ? spiceInfo.nameId : spiceInfo.nameEn}
          </span>
        </div>

        {canFlip && onFlip && (
          <button
            onClick={handleFlip}
            className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow transition-colors flex items-center gap-0.5 cursor-pointer"
            title="Balik kartu ini menjadi Rempah secara permanen"
          >
            <span>🔄</span> Balik
          </button>
        )}
      </div>
    </motion.div>
  );
};
