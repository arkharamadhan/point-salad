import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { ALL_SKILLS, SkillId } from '../../engine/types';
import { Sound } from '../sound/soundEffects';

export const SKILL_META: Record<
  SkillId,
  {
    emoji: string;
    nameId: string;
    nameEn: string;
    descId: string;
    descEn: string;
    color: string;
  }
> = {
  refresh_market: {
    emoji: '🔄',
    nameId: 'Kocok Pasar',
    nameEn: 'Refresh Market',
    descId: 'Ganti semua 6 sayur di talenan dengan sayur baru dari dek!',
    descEn: 'Replace all 6 veggies on the board with fresh ones from the deck!',
    color: 'from-[#0284C7] to-[#0369A1]',
  },
  grab_three: {
    emoji: '🧲',
    nameId: 'Ambil 3 Sayur',
    nameEn: 'Greedy Grab (3)',
    descId: 'Boleh ambil hingga 3 sayur sekaligus dalam 1 giliran!',
    descEn: 'Draft up to 3 veggies in a single turn!',
    color: 'from-[#D97706] to-[#B45309]',
  },
  swap_veggie: {
    emoji: '🎭',
    nameId: 'Tukar Sayur',
    nameEn: 'Veggie Swap',
    descId: 'Tukar 1 sayur milikmu dengan 1 sayur milik lawan!',
    descEn: 'Swap 1 of your veggies with 1 of an opponent’s veggies!',
    color: 'from-[#7B1FA2] to-[#5B147A]',
  },
  golden_touch: {
    emoji: '✨',
    nameId: 'Sentuhan Emas',
    nameEn: 'Golden Touch',
    descId: 'Ubah 1 sayur di talenan jadi Sayur Emas (+3 poin bonus)!',
    descEn: 'Turn 1 board veggie into a Golden Veggie (+3 bonus pts)!',
    color: 'from-[#EAB308] to-[#CA8A04]',
  },
  steal_veggie: {
    emoji: '🦝',
    nameId: 'Curi Sayur',
    nameEn: 'Steal Veggie',
    descId: 'Curi langsung 1 sayur milik lawan tanpa menukar!',
    descEn: 'Steal 1 veggie directly from an opponent!',
    color: 'from-[#DC2626] to-[#991B1B]',
  },
  clone_veggie: {
    emoji: '🧬',
    nameId: 'Gandakan Sayur',
    nameEn: 'Clone Veggie',
    descId: 'Duplikat (+1) salah satu jenis sayur yang sudah kamu punya!',
    descEn: 'Duplicate (+1) any veggie type you currently own!',
    color: 'from-[#0D9488] to-[#115E59]',
  },
};

export const PowerUpRollModal: React.FC = () => {
  const {
    gameState,
    showPowerUpRoll,
    dismissPowerUpRoll,
    mpRole,
    mpMyPlayerIndex,
    soundEnabled,
    lang,
  } = useGameStore();

  const isId = lang === 'id';
  const myIndex =
    mpRole !== 'none' && mpMyPlayerIndex !== null
      ? mpMyPlayerIndex
      : Math.max(0, gameState.players.findIndex((p) => !p.isBot));
  const myPlayer = gameState.players[myIndex];
  const assignedSkill = myPlayer?.assignedSkill ?? null;

  const [highlightIdx, setHighlightIdx] = useState(0);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    if (!showPowerUpRoll || !assignedSkill) return;

    setLanded(false);
    const len = ALL_SKILLS.length;
    const targetIdx = ALL_SKILLS.indexOf(assignedSkill);
    const totalTicks = 14 + ((targetIdx - (14 % len) + len) % len);
    let currentTick = 0;
    let timer: number | null = null;

    const tick = () => {
      currentTick++;
      setHighlightIdx(currentTick % len);
      Sound.cardSelect(soundEnabled);

      if (currentTick >= totalTicks) {
        setHighlightIdx(targetIdx);
        setLanded(true);
        Sound.skillActivate(soundEnabled);
        return;
      }

      // Gradually slow down like an arcade roulette wheel
      const delay = currentTick < 8 ? 80 : currentTick < 13 ? 135 : 210;
      timer = window.setTimeout(tick, delay);
    };

    timer = window.setTimeout(tick, 180);
    return () => {
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [showPowerUpRoll, assignedSkill, soundEnabled]);

  if (!showPowerUpRoll || gameState.gameMode !== 'special' || !assignedSkill) {
    return null;
  }

  const finalMeta = SKILL_META[assignedSkill];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-[#2C1A0B]/70 backdrop-blur-xs flex items-center justify-center p-4 font-fredoka">
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 360, damping: 24 }}
          className="w-full max-w-md bg-[#FFFDF8] border-4 border-[#C9A46E] rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="bg-gradient-to-b from-[#2E7D32] to-[#23583A] px-5 py-4 text-center text-white">
            <div className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isId ? 'Mode Seru • Roll Power-Up' : 'Special Mode • Power-Up Roll'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              {landed
                ? isId
                  ? 'Power-Up Kamu Ronde Ini!'
                  : 'Your Power-Up This Round!'
                : isId
                ? 'Mengacak Power-Up...'
                : 'Rolling Your Power-Up...'}
            </h2>
          </div>

          <div className="p-5 bg-[#FCF8EE] flex flex-col items-center gap-4">
            {/* 3 Roulette Cards */}
            <div className="grid grid-cols-3 gap-2.5 w-full">
              {ALL_SKILLS.map((skillId, idx) => {
                const meta = SKILL_META[skillId];
                const isLit = highlightIdx === idx;
                const isWinner = landed && skillId === assignedSkill;

                return (
                  <motion.div
                    key={skillId}
                    animate={
                      isWinner
                        ? { scale: 1.08, y: -4 }
                        : isLit
                        ? { scale: 1.03 }
                        : { scale: 0.96, opacity: landed ? 0.45 : 0.75 }
                    }
                    transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                    className={`rounded-2xl p-3 text-center border-[3px] flex flex-col items-center gap-1 transition-colors ${
                      isWinner
                        ? `bg-gradient-to-b ${meta.color} text-white border-amber-300 shadow-lg ring-4 ring-amber-300/40`
                        : isLit
                        ? 'bg-[#FFF8EB] text-stone-800 border-[#D97706] shadow-md'
                        : 'bg-white text-stone-500 border-stone-200'
                    }`}
                  >
                    <span className="text-3xl leading-none">{meta.emoji}</span>
                    <span className="text-[11px] font-black leading-tight mt-1">
                      {isId ? meta.nameId : meta.nameEn}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Description & Ready Button */}
            <div className="min-h-[76px] w-full flex flex-col items-center justify-center text-center">
              {landed ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full space-y-3"
                >
                  <p className="text-xs sm:text-sm font-bold text-stone-700 bg-white px-3.5 py-2 rounded-2xl border border-[#E5D7BE]">
                    {finalMeta.emoji} {isId ? finalMeta.descId : finalMeta.descEn}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      Sound.confirmAction(soundEnabled);
                      dismissPowerUpRoll();
                    }}
                    className="w-full py-3 rounded-2xl bg-gradient-to-b from-[#43A047] to-[#2E7D32] hover:from-[#388E3C] hover:to-[#256628] active:scale-95 text-white font-black text-base border-b-4 border-[#1B5E20] shadow-md cursor-pointer"
                  >
                    {isId ? 'Siap Main!' : 'Ready to Play!'}
                  </button>
                </motion.div>
              ) : (
                <p className="text-xs font-bold text-stone-500 animate-pulse">
                  {isId ? '🎲 Tunggu sebentar...' : '🎲 Rolling...'}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
