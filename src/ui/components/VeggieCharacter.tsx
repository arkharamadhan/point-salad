import React from 'react';
import { motion } from 'framer-motion';
import { ResourceId } from '../../engine/types';
import { VeggieIcon } from './icons/SpiceIcon';
import { Sound } from '../sound/soundEffects';
import { useGameStore } from '../store/gameStore';

interface VeggieCharacterProps {
  resource?: ResourceId | null;
  cardKey?: string;
  onClick?: () => void;
  onDragToShelf?: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  size?: number;
  className?: string;
}

export const VeggieCharacter: React.FC<VeggieCharacterProps> = ({
  resource,
  cardKey,
  onClick,
  onDragToShelf,
  isSelectable = false,
  isSelected = false,
  className = '',
}) => {
  const { soundEnabled } = useGameStore();

  if (!resource) {
    return (
      <div className="w-[62px] h-[62px] sm:w-[74px] sm:h-[74px] lg:w-[80px] lg:h-[80px] rounded-full border-2 border-dashed border-[#B68245]/45 bg-[#C89D63]/10 flex items-center justify-center text-[11px] text-[#9C6D38]/60 font-fredoka select-none">
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

  const handleDragEnd = (_e: any, info: any) => {
    if (onDragToShelf && info.offset.y > 50) {
      Sound.cardSelect(soundEnabled);
      onDragToShelf();
    }
  };

  return (
    <motion.div
      key={cardKey ?? resource}
      initial={{ scale: 0.55, opacity: 0, y: -10 }}
      animate={{
        scale: isSelected ? 1.12 : 1,
        opacity: 1,
        y: isSelected ? -4 : 0,
      }}
      transition={{ type: 'spring', stiffness: 360, damping: 22 }}
      drag={isSelectable}
      dragSnapToOrigin={true}
      onDragEnd={handleDragEnd}
      whileHover={isSelectable ? { scale: isSelected ? 1.15 : 1.12, y: -3 } : {}}
      whileTap={isSelectable ? { scale: 0.93 } : {}}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`relative w-[66px] h-[66px] sm:w-[78px] sm:h-[78px] lg:w-[86px] lg:h-[86px] flex items-center justify-center select-none touch-none ${
        isSelectable ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Subtle grounded shadow on wooden cutting board */}
      <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 w-[70%] h-3 rounded-full bg-[#6E4418]/25 blur-[3px]" />

      {/* Selected Indicator Ring & Checkmark */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -inset-1 rounded-full border-[3.5px] border-[#2E7D32] bg-[#43A047]/15 shadow-[0_0_16px_rgba(46,125,50,0.45)] flex items-start justify-end p-0.5 pointer-events-none"
        >
          <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#2E7D32] border-2 border-white text-white flex items-center justify-center text-[11px] font-black shadow-md">
            ✓
          </span>
        </motion.div>
      )}

      {/* Standalone Vegetable with Crisp Drop Shadow */}
      <div
        className={`w-[58px] h-[58px] sm:w-[70px] sm:h-[70px] lg:w-[78px] lg:h-[78px] transition-transform duration-150 ${
          isSelected
            ? 'drop-shadow-[0_6px_8px_rgba(46,125,50,0.35)]'
            : 'drop-shadow-[0_4px_5px_rgba(68,38,10,0.28)] hover:drop-shadow-[0_7px_9px_rgba(68,38,10,0.38)]'
        }`}
      >
        <VeggieIcon resource={resource} className="w-full h-full" />
      </div>
    </motion.div>
  );
};
