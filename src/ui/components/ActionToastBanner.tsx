import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

const ACTOR_DOT = ['bg-[#2E7D32]', 'bg-[#C0A018]', 'bg-[#7B1FA2]', 'bg-[#E65100]'];

export const ActionToastBanner: React.FC = () => {
  const { actionToast, dismissActionToast, gameState } = useGameStore();
  const isVisible = Boolean(actionToast) && gameState.phase !== 'game_over';

  return (
    <div className="pointer-events-none fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-40 px-3 w-full max-w-md flex justify-center font-fredoka">
      <AnimatePresence mode="wait">
        {isVisible && actionToast && (
          <motion.div
            key={actionToast.id}
            initial={{ opacity: 0, y: -16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            className="pointer-events-auto bg-[#FFFDF8]/95 backdrop-blur-sm border-2 border-[#C9A46E] rounded-full pl-3.5 pr-2 py-1.5 shadow-lg flex items-center gap-2 max-w-full"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                ACTOR_DOT[actionToast.actorIndex % ACTOR_DOT.length]
              }`}
            />
            <span className="text-xs sm:text-sm font-black text-stone-800 truncate">
              {actionToast.text}
            </span>
            <button
              type="button"
              onClick={dismissActionToast}
              className="w-5 h-5 rounded-full hover:bg-stone-200/80 text-stone-400 hover:text-stone-700 flex items-center justify-center shrink-0 transition cursor-pointer"
              title="Tutup notifikasi"
              aria-label="Tutup notifikasi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
