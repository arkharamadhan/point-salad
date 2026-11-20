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
          size === 'shelf' ? 'w-20 h-20 sm:w-24 sm:h-24' : 'w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32'
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
      ? 'w-20 h-20 sm:w-24 sm:h-24 md:w-26 md:h-26'
      : 'w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32';

  return (
    <motion.div
      drag={isSelectable || !!onDragToMarket}
      dragSnapToOrigin={true}
      onDragEnd={handleDragEnd}
      whileHover={isSelectable ? { scale: 1.05 } : {}}
      whileTap={isSelectable ? { scale: 0.95 } : {}}
      className={`relative flex flex-col items-center touch-none select-none ${className}`}
    >
      {/* Top-Left: Flip-side vegetable indicator with curved arrow (matching reference image) */}
      {showFlipArrow && (
        <div
          onClick={onFlip ? handleFlip : undefined}
          className={`absolute -top-3.5 left-2 sm:left-4 z-20 flex items-center gap-0.5 ${
            onFlip ? 'cursor-pointer group hover:scale-110 active:scale-95 transition-transform' : ''
          }`}
          title={onFlip ? 'Klik untuk membalik resep ini menjadi sayur' : `Sisi balik: ${card.resource}`}
        >
          {/* Flip Vegetable Icon */}
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border border-stone-300 shadow-md flex items-center justify-center p-0.5">
            <VeggieIcon resource={card.resource} size={15} />
          </div>

          {/* Curved Arrow pointing down/right into the plate */}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="drop-shadow-sm text-stone-600">
            <path
              d="M4 8C4 8 10 4 16 8C19 10 20 14 20 16M20 16L16 13M20 16L19 12"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 8C4 8 10 4 16 8C19 10 20 14 20 16M20 16L16 13M20 16L19 12"
              stroke="#444444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Top-Right: Live Point Score Badge (if in player shelf) */}
      {typeof liveScore === 'number' && (
        <div className="absolute -top-2.5 -right-2 z-20">
          <ScallopBadge
            value={liveScore > 0 ? `${liveScore}` : `${liveScore}`}
            size={28}
            badgeBg={liveScore > 0 ? '#689F38' : liveScore < 0 ? '#D32F2F' : '#757575'}
          />
        </div>
      )}

      {/* White Ceramic Salad Plate with Wood/Ceramic Ring Motif */}
      <div
        onClick={handleClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        className={`rounded-full bg-white transition-shadow duration-200 border-[2.5px] border-stone-200/90 shadow-[0_6px_16px_rgba(0,0,0,0.12),inset_0_2px_4px_rgba(0,0,0,0.06)] flex items-center justify-center p-1.5 relative overflow-hidden ${plateSizeClasses} ${
          isSelectable ? 'cursor-pointer hover:shadow-[0_10px_24px_rgba(0,0,0,0.2)]' : ''
        } ${isSelected ? 'ring-4 ring-emerald-500 scale-105' : ''}`}
      >
        {/* Subtle wood / ceramic ring motif on the plate rim */}
        <div className="absolute inset-0 rounded-full border border-[#D5C2A5]/35 pointer-events-none" />

        {/* Soft inner bowl gradient/depth */}
        <div className="w-full h-full rounded-full border border-stone-100 flex items-center justify-center p-0.5 bg-gradient-to-b from-stone-50 via-white to-stone-100 shadow-inner">
          <PointBowlRenderer scoringId={card.scoringId} />
        </div>
      </div>
    </motion.div>
  );
};
