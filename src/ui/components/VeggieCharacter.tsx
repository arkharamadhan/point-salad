import React from 'react';
import { ResourceId } from '../../engine/types';
import { VeggieIcon } from './icons/SpiceIcon';
import { Sound } from '../sound/soundEffects';
import { useGameStore } from '../store/gameStore';

interface VeggieCharacterProps {
  resource?: ResourceId | null;
  onClick?: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  keyboardBadge?: string;
  size?: number;
  className?: string;
}

export const VeggieCharacter: React.FC<VeggieCharacterProps> = ({
  resource,
  onClick,
  isSelectable = false,
  isSelected = false,
  keyboardBadge,
  size = 64,
  className = '',
}) => {
  const { soundEnabled } = useGameStore();

  if (!resource) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full border-2 border-dashed border-[#C9A46E]/50 flex items-center justify-center text-xs text-[#9C6D38]/50 font-fredoka select-none"
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

  return (
    <div
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{ width: size + 16, height: size + 16 }}
      className={`relative flex items-center justify-center select-none transition-all duration-200 ${
        isSelectable ? 'cursor-pointer hover:scale-115 active:scale-95' : ''
      } ${className}`}
    >
      {/* Keyboard badge */}
      {keyboardBadge && (
        <span className="absolute -top-1 left-1/2 -translate-x-1/2 z-30 bg-black/75 border border-stone-600 text-yellow-300 text-[9px] font-mono font-black px-1.5 py-0.2 rounded shadow">
          {keyboardBadge}
        </span>
      )}

      {/* Selected Indicator Ring & Checkmark */}
      {isSelected && (
        <div className="absolute inset-0 rounded-full border-[3.5px] border-[#43A047] bg-[#43A047]/15 animate-pulse flex items-start justify-end p-0.5">
          <span className="w-5 h-5 rounded-full bg-[#43A047] text-white flex items-center justify-center text-[10px] font-black shadow">
            ✓
          </span>
        </div>
      )}

      {/* Standalone Vegetable with Soft Floor Drop Shadow */}
      <div className={`transition-transform duration-200 ${isSelected ? 'scale-110 drop-shadow-md' : 'hover:drop-shadow-lg'}`}>
        <VeggieIcon resource={resource} size={size} />
      </div>
    </div>
  );
};
