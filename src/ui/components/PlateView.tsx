import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../engine/types';
import { VeggieIcon } from './icons/SpiceIcon';
import { PointBowlRenderer, ScallopBadge } from './PointBowlRenderer';
import { Sound } from '../sound/soundEffects';
import { useGameStore } from '../store/gameStore';

interface PlateViewProps {
  card?: Card | null;
  onClick?: () => void;
  onFlip?: () => void;
  onDragToShelf?: () => void;
  onDragToMarket?: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  liveScore?: number;
  showFlipArrow?: boolean;
  size?: 'normal' | 'shelf';
  className?: string;
}

export const PlateView: React.FC<PlateViewProps> = ({
  card,
  onClick,
  onFlip,
  onDragToShelf,
  onDragToMarket,
  isSelectable = false,
  isSelected = false,
  liveScore,
  showFlipArrow = true,
  size = 'normal',
  className = '',
}) => {
  const { soundEnabled } = useGameStore();

  if (!card) {
    return (
      <div
        className={`rounded-full border-2 border-dashed border-[#C9A46E]/60 bg-black/10 flex flex-col items-center justify-center text-xs text-[#9C6D38]/60 font-fredoka select-none ${
          size === 'shelf'
            ? 'w-[92px] h-[92px] sm:w-[96px] sm:h-[96px]'
            : 'w-[98px] h-[98px] min-[390px]:w-[104px] min-[390px]:h-[104px] sm:w-[114px] sm:h-[114px] lg:w-[120px] lg:h-[120px]'
        } ${className}`}
      >
        <span>Kosong</span>
      </div>
    );
  }

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

  const handleDragEnd = (_e: any, info: any) => {
    if (onDragToShelf && info.offset.y > 50) {
      // Dragged downwards towards shelf
      Sound.cardSelect(soundEnabled);
      onDragToShelf();
    } else if (onDragToMarket && info.offset.y < -50) {
      // Dragged upwards towards market (return card)
      Sound.cardDraw(soundEnabled);
      onDragToMarket();
    }
  };

  const plateSizeClasses =
    size === 'shelf'
      ? 'w-[92px] h-[92px] sm:w-[96px] sm:h-[96px]'
      : 'w-[98px] h-[98px] min-[390px]:w-[104px] min-[390px]:h-[104px] sm:w-[114px] sm:h-[114px] lg:w-[120px] lg:h-[120px]';

  const dragAxis = isSelectable ? true : onDragToMarket ? 'y' : false;
  const touchActionClass =
    size === 'shelf' ? 'touch-pan-x' : isSelectable ? 'touch-none' : 'touch-manipulation';

  return (
    <motion.div
      drag={dragAxis}
      dragDirectionLock={size === 'shelf'}
      dragSnapToOrigin={true}
      onDragEnd={handleDragEnd}
      whileHover={isSelectable ? { scale: 1.05 } : {}}
      whileTap={isSelectable ? { scale: 0.95 } : {}}
      className={`relative flex flex-col items-center ${touchActionClass} select-none ${className}`}
    >
      {/* Top-Left: Flip-side vegetable indicator with curved arrow (matching reference image) */}
      {showFlipArrow && (
        <div
          onClick={onFlip ? handleFlip : undefined}
          className={`absolute ${
            size === 'shelf' ? '-top-3 -left-0.5' : '-top-3.5 sm:-top-4.5 -left-0.5 sm:left-0'
          } z-20 flex items-center gap-0.5 ${
            onFlip ? 'cursor-pointer group hover:scale-115 active:scale-95 transition-transform' : ''
          }`}
          title={onFlip ? 'Klik untuk membalik resep ini menjadi sayur' : `Sisi balik: ${card.resource}`}
        >
          {/* Flip Vegetable Icon (Prominent & Clear, matching reference) */}
          <div className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)] transition-transform group-hover:rotate-6">
            <VeggieIcon resource={card.resource} size={size === 'shelf' ? 22 : 28} />
          </div>

          {/* Arched Arrow curving into the plate */}
          <svg
            width={size === 'shelf' ? 18 : 24}
            height={size === 'shelf' ? 16 : 20}
            viewBox="0 0 32 26"
            fill="none"
            className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] -ml-0.5"
          >
            {/* White bold arrow path with dark stroke */}
            <path
              d="M3 14C5 6 15 4 24 10C27 12 28 17 28 20M28 20L22 16M28 20L27 15"
              stroke="#212121"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 14C5 6 15 4 24 10C27 12 28 17 28 20M28 20L22 16M28 20L27 15"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Top-Right: Live Point Score Badge (if in player shelf) */}
      {typeof liveScore === 'number' && (
        <div className="absolute -top-2 -right-1 sm:-top-2.5 sm:-right-2 z-20">
          <ScallopBadge
            value={liveScore > 0 ? `${liveScore}` : `${liveScore}`}
            size={size === 'shelf' ? 22 : 28}
            badgeBg={liveScore > 0 ? '#689F38' : liveScore < 0 ? '#D32F2F' : '#757575'}
          />
        </div>
      )}

      {/* White Ceramic Salad Plate with Wood/Ceramic Ring Motif */}
      <div
        onClick={handleClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        className={`rounded-full bg-white transition-shadow duration-200 border-[2.5px] border-stone-200/90 shadow-[0_6px_16px_rgba(0,0,0,0.12),inset_0_2px_4px_rgba(0,0,0,0.06)] flex items-center justify-center p-1 relative overflow-hidden ${plateSizeClasses} ${
          isSelectable ? 'cursor-pointer hover:shadow-[0_10px_24px_rgba(0,0,0,0.2)]' : ''
        } ${isSelected ? 'ring-4 ring-emerald-500 scale-105' : ''}`}
      >
        {/* Subtle wood / ceramic ring motif on the plate rim */}
        <div className="absolute inset-0 rounded-full border border-[#D5C2A5]/35 pointer-events-none" />

        {/* Soft inner bowl gradient/depth */}
        <div className="w-full h-full rounded-full border border-stone-100 flex items-center justify-center p-0.5 bg-gradient-to-b from-stone-50 via-white to-stone-100 shadow-inner overflow-hidden">
          <PointBowlRenderer scoringId={card.scoringId} size={size} />
        </div>
      </div>
    </motion.div>
  );
};
