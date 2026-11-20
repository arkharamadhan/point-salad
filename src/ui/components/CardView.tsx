import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../engine/types';
import { VeggieIcon, VEGGIE_INFO } from './icons/SpiceIcon';
import { PointBowlRenderer } from './PointBowlRenderer';
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

  const cardId = card?.id ?? 'pile';

  // 1. PUNGGUNG KARTU (Draw Pile Back)
  if (side === 'back' || !card) {
    return (
      <motion.div
        whileHover={isSelectable ? { scale: 1.04, y: -4 } : {}}
        whileTap={isSelectable ? { scale: 0.96 } : {}}
        onClick={handleClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        className={`relative w-28 h-40 sm:w-32 sm:h-44 md:w-36 md:h-52 rounded-2xl select-none transition-all border-[3.5px] border-black shadow-xl overflow-hidden bg-[#7CB342] flex flex-col justify-between p-1.5 ${
          isSelectable ? 'cursor-pointer hover:ring-2 hover:ring-white' : ''
        } ${isSelected ? 'ring-4 ring-emerald-400' : ''} ${className}`}
      >
        {keyboardBadge && (
          <span className="absolute -top-1.5 -left-1.5 z-30 bg-stone-900 border border-stone-700 text-yellow-300 text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md shadow">
            {keyboardBadge}
          </span>
        )}

        {/* Decorative Halftone / Dots pattern */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_2px,transparent_2px)] [background-size:12px_12px]" />

        {/* Top Arched "POINT" */}
        <div className="w-full h-6 relative z-10">
          <svg viewBox="0 0 100 24" className="w-full h-full overflow-visible">
            <path id={`arch-back-top-${cardId}`} d="M 12,22 Q 50,4 88,22" fill="none" />
            <text
              fill="#FFFFFF"
              fontWeight="900"
              fontSize="12.5"
              letterSpacing="3"
              fontFamily="'Fredoka', ui-rounded, sans-serif"
              style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.6))' }}
            >
              <textPath href={`#arch-back-top-${cardId}`} startOffset="50%" textAnchor="middle">
                POINT
              </textPath>
            </text>
          </svg>
        </div>

        {/* Central Salad Bowl Graphic with Deck Count */}
        <div className="my-auto flex items-center justify-center z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white border-[3.5px] border-black shadow-inner flex flex-col items-center justify-center relative p-1">
            <span className="text-2xl sm:text-3xl mb-0.5">🥗</span>
            <span className="text-[9px] font-black tracking-wider text-stone-800 font-fredoka">
              POINT SALAD
            </span>

            {typeof pileCount === 'number' && (
              <div className="absolute -bottom-2 bg-stone-900 px-2 py-0.5 rounded-full border border-stone-600 text-[10px] font-black text-lime-400 shadow">
                {pileCount}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Inverted Arched "SALAD" */}
        <div className="w-full h-6 relative z-10 rotate-180">
          <svg viewBox="0 0 100 24" className="w-full h-full overflow-visible">
            <path id={`arch-back-bot-${cardId}`} d="M 12,22 Q 50,4 88,22" fill="none" />
            <text
              fill="#FFFFFF"
              fontWeight="900"
              fontSize="12.5"
              letterSpacing="3"
              fontFamily="'Fredoka', ui-rounded, sans-serif"
              style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.6))' }}
            >
              <textPath href={`#arch-back-bot-${cardId}`} startOffset="50%" textAnchor="middle">
                SALAD
              </textPath>
            </text>
          </svg>
        </div>
      </motion.div>
    );
  }

  const veggieInfo = VEGGIE_INFO[card.resource];
  const veggieName = lang === 'id' ? veggieInfo.nameId.toUpperCase() : veggieInfo.nameEn.toUpperCase();

  // 2. SISI SAYUR (Veggie Side - Exactly like Reference Image)
  if (side === 'resource') {
    return (
      <motion.div
        whileHover={isSelectable ? { scale: 1.04, y: -4 } : {}}
        whileTap={isSelectable ? { scale: 0.96 } : {}}
        onClick={handleClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        className={`relative w-28 h-40 sm:w-32 sm:h-44 md:w-36 md:h-52 rounded-2xl select-none transition-all border-[3.5px] border-black shadow-xl overflow-hidden flex flex-col justify-between p-2.5 ${
          isSelected ? 'ring-4 ring-emerald-400 scale-[1.03]' : ''
        } ${isSelectable ? 'cursor-pointer hover:ring-2 hover:ring-white' : ''} ${className}`}
        style={{
          backgroundColor: veggieInfo.color,
        }}
      >
        {keyboardBadge && (
          <span className="absolute -top-1.5 -left-1.5 z-30 bg-stone-900 border border-stone-700 text-yellow-300 text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md shadow">
            {keyboardBadge}
          </span>
        )}

        {/* Halftone dot pattern overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#ffffff_2.5px,transparent_2.5px)] [background-size:10px_10px]" />

        {/* TOP ROW: Name on Left, Mini Veggie in Circle on Right */}
        <div className="flex items-center justify-between z-10 w-full px-0.5">
          <span
            className="font-black text-white text-xs sm:text-sm tracking-wider font-fredoka"
            style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.7))' }}
          >
            {veggieName}
          </span>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border-2 border-black flex items-center justify-center p-0.5 shadow-md flex-shrink-0">
            <VeggieIcon resource={card.resource} size={18} />
          </div>
        </div>

        {/* CENTER: White Double-Circle Plate with Big Cute Veggie */}
        <div className="my-auto flex items-center justify-center z-10">
          <div className="w-18 h-18 sm:w-22 sm:h-22 md:w-24 md:h-24 rounded-full bg-white border-[3.5px] border-black shadow-inner flex items-center justify-center relative p-1">
            {/* Inner concentric ring matching the veggie color */}
            <div
              className="w-full h-full rounded-full border-[1.5px] flex items-center justify-center"
              style={{ borderColor: veggieInfo.color }}
            >
              <VeggieIcon resource={card.resource} size={58} />
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: Mini Veggie in Circle on Left, Rotated Inverted Name on Right */}
        <div className="flex items-center justify-between z-10 w-full px-0.5">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border-2 border-black flex items-center justify-center p-0.5 shadow-md flex-shrink-0">
            <VeggieIcon resource={card.resource} size={18} />
          </div>
          <span
            className="font-black text-white text-xs sm:text-sm tracking-wider font-fredoka rotate-180"
            style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.7))' }}
          >
            {veggieName}
          </span>
        </div>
      </motion.div>
    );
  }

  // 3. SISI SKOR (Point Side - Exactly like Reference Image)
  return (
    <motion.div
      whileHover={isSelectable ? { scale: 1.04, y: -4 } : {}}
      whileTap={isSelectable ? { scale: 0.96 } : {}}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`relative w-28 h-40 sm:w-32 sm:h-44 md:w-36 md:h-52 rounded-2xl select-none transition-all border-[3.5px] border-black shadow-xl overflow-hidden flex flex-col justify-between p-1.5 bg-[#7CB342] ${
        isSelected ? 'ring-4 ring-emerald-400 scale-[1.03]' : ''
      } ${isSelectable ? 'cursor-pointer hover:ring-2 hover:ring-white' : ''} ${className}`}
    >
      {keyboardBadge && (
        <span className="absolute -top-1.5 -left-1.5 z-30 bg-stone-900 border border-stone-700 text-yellow-300 text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md shadow">
          {keyboardBadge}
        </span>
      )}

      {/* Subtle background dots / pattern */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_2px,transparent_2px)] [background-size:12px_12px]" />

      {/* TOP-LEFT Corner Triangle Tab (Flip Veggie Color + Mini Emblem) */}
      <div
        className="absolute top-0 left-0 w-10 h-10 sm:w-12 sm:h-12 z-20"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 0 100%)',
          backgroundColor: veggieInfo.color,
        }}
      >
        <div className="absolute top-1 left-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white border border-black flex items-center justify-center p-0.5 shadow-sm">
          <VeggieIcon resource={card.resource} size={14} />
        </div>
      </div>

      {/* BOTTOM-RIGHT Corner Triangle Tab (Flip Veggie Color + Mini Emblem) */}
      <div
        className="absolute bottom-0 right-0 w-10 h-10 sm:w-12 sm:h-12 z-20"
        style={{
          clipPath: 'polygon(100% 100%, 0 100%, 100% 0)',
          backgroundColor: veggieInfo.color,
        }}
      >
        <div className="absolute bottom-1 right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white border border-black flex items-center justify-center p-0.5 shadow-sm">
          <VeggieIcon resource={card.resource} size={14} />
        </div>
      </div>

      {/* Arched "POINT" label on top */}
      <div className="w-full h-5 sm:h-6 relative z-10">
        <svg viewBox="0 0 100 24" className="w-full h-full overflow-visible">
          <path id={`arch-top-${cardId}`} d="M 12,22 Q 50,4 88,22" fill="none" />
          <text
            fill="#FFFFFF"
            fontWeight="900"
            fontSize="12.5"
            letterSpacing="3"
            fontFamily="'Fredoka', ui-rounded, sans-serif"
            style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.6))' }}
          >
            <textPath href={`#arch-top-${cardId}`} startOffset="50%" textAnchor="middle">
              POINT
            </textPath>
          </text>
        </svg>
      </div>

      {/* CENTER: White Salad Bowl with Visual Condition Renderer */}
      <div className="my-auto flex items-center justify-center z-10">
        <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-white border-[3.5px] border-black shadow-inner flex items-center justify-center p-1 relative overflow-hidden">
          {/* Inner soft bevel shadow */}
          <div className="w-full h-full rounded-full border border-stone-200 flex items-center justify-center shadow-inner p-0.5 bg-gradient-to-b from-stone-50 to-stone-100">
            <PointBowlRenderer scoringId={card.scoringId} />
          </div>
        </div>
      </div>

      {/* Arched "SALAD" label on bottom (inverted) */}
      <div className="w-full h-5 sm:h-6 relative z-10 rotate-180">
        <svg viewBox="0 0 100 24" className="w-full h-full overflow-visible">
          <path id={`arch-bot-${cardId}`} d="M 12,22 Q 50,4 88,22" fill="none" />
          <text
            fill="#FFFFFF"
            fontWeight="900"
            fontSize="12.5"
            letterSpacing="3"
            fontFamily="'Fredoka', ui-rounded, sans-serif"
            style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.6))' }}
          >
            <textPath href={`#arch-bot-${cardId}`} startOffset="50%" textAnchor="middle">
              SALAD
            </textPath>
          </text>
        </svg>
      </div>

      {/* Live Score Preview Tag if active */}
      {typeof liveScore === 'number' && (
        <div
          className={`absolute top-2 right-2 z-20 px-1.5 py-0.5 rounded-full text-[9px] font-black shadow-md border border-white font-fredoka ${
            liveScore > 0
              ? 'bg-emerald-600 text-white'
              : liveScore < 0
              ? 'bg-rose-600 text-white'
              : 'bg-stone-800 text-stone-200'
          }`}
          title={isTentativeMajority ? 'Skor sementara berdasarkan pemain saat ini' : 'Skor kartu saat ini'}
        >
          {liveScore > 0 ? `+${liveScore}` : liveScore}
          {isTentativeMajority && <span className="text-yellow-300 ml-0.5">*</span>}
        </div>
      )}

      {/* Flip Button if player owns it on their turn */}
      {canFlip && onFlip && (
        <button
          onClick={handleFlip}
          className="absolute bottom-2 left-2 z-30 bg-emerald-700 hover:bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-white shadow-lg transition-transform active:scale-95 flex items-center gap-1 cursor-pointer font-fredoka"
          title="Balik kartu ini menjadi Sayur secara permanen"
        >
          <span>🔄</span> Balik
        </button>
      )}
    </motion.div>
  );
};
