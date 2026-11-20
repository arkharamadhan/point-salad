import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowLeftRight, Sparkles } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { ALL_RESOURCES, ResourceId } from '../../engine/types';
import { VeggieIcon } from './icons/SpiceIcon';
import { Sound } from '../sound/soundEffects';

export type SkillModalMode = 'swap' | 'steal' | 'clone';

interface SwapVeggieModalProps {
  myIndex: number;
  mode?: SkillModalMode;
  onClose: () => void;
}

export const SwapVeggieModal: React.FC<SwapVeggieModalProps> = ({
  myIndex,
  mode = 'swap',
  onClose,
}) => {
  const {
    gameState,
    useSkillSwapVeggie,
    useSkillStealVeggie,
    useSkillCloneVeggie,
    soundEnabled,
    lang,
  } = useGameStore();
  const isId = lang === 'id';

  const opponents = gameState.players
    .map((p, idx) => ({ player: p, idx }))
    .filter((item) => item.idx !== myIndex && Object.values(item.player.resources).some((c) => c > 0));

  const [targetIdx, setTargetIdx] = useState<number>(opponents[0]?.idx ?? -1);
  const [myRes, setMyRes] = useState<ResourceId | null>(null);
  const [targetRes, setTargetRes] = useState<ResourceId | null>(null);

  const me = gameState.players[myIndex];
  const target = gameState.players[targetIdx];

  if (!me) return null;
  if ((mode === 'swap' || mode === 'steal') && !target) return null;

  const canConfirm =
    mode === 'swap'
      ? Boolean(myRes && targetRes && targetIdx >= 0)
      : mode === 'steal'
      ? Boolean(targetRes && targetIdx >= 0)
      : Boolean(myRes);

  const handleConfirm = () => {
    if (!canConfirm) return;
    Sound.skillActivate(soundEnabled);
    if (mode === 'swap' && myRes && targetRes) {
      useSkillSwapVeggie(targetIdx, myRes, targetRes);
    } else if (mode === 'steal' && targetRes) {
      useSkillStealVeggie(targetIdx, targetRes);
    } else if (mode === 'clone' && myRes) {
      useSkillCloneVeggie(myRes);
    }
    onClose();
  };

  const headerConfig =
    mode === 'swap'
      ? {
          bg: 'from-[#7B1FA2] to-[#5B147A]',
          emoji: '🎭',
          title: isId ? 'Tukar 1 Sayur dengan Lawan' : 'Swap 1 Veggie with Opponent',
          btnBg: 'bg-[#7B1FA2] hover:bg-[#6A1B9A] border-[#4A148C]',
          btnText: isId ? 'Tukar Sekarang!' : 'Swap Now!',
        }
      : mode === 'steal'
      ? {
          bg: 'from-[#DC2626] to-[#991B1B]',
          emoji: '🦝',
          title: isId ? 'Curi 1 Sayur Milik Lawan' : 'Steal 1 Opponent Veggie',
          btnBg: 'bg-[#DC2626] hover:bg-[#B91C1C] border-[#7F1D1D]',
          btnText: isId ? 'Curi Sekarang!' : 'Steal Now!',
        }
      : {
          bg: 'from-[#0D9488] to-[#115E59]',
          emoji: '🧬',
          title: isId ? 'Gandakan 1 Sayur Milikmu' : 'Duplicate 1 of Your Veggies',
          btnBg: 'bg-[#0D9488] hover:bg-[#0F766E] border-[#134E4A]',
          btnText: isId ? 'Gandakan (+1)!' : 'Clone (+1)!',
        };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 font-fredoka">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-[#FFFDF8] border-4 border-[#C9A46E] rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div
          className={`bg-gradient-to-r ${headerConfig.bg} px-4 py-3 text-white flex items-center justify-between`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{headerConfig.emoji}</span>
            <h3 className="font-black text-base">{headerConfig.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 bg-[#FCF8EE]">
          {/* Opponent Picker (for swap/steal when >1 opponent) */}
          {(mode === 'swap' || mode === 'steal') && opponents.length > 1 && (
            <div>
              <label className="text-xs font-black text-stone-600 uppercase block mb-1.5">
                {isId ? 'Pilih Lawan:' : 'Choose Opponent:'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {opponents.map(({ player, idx }) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => {
                      setTargetIdx(idx);
                      setTargetRes(null);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-black border-2 cursor-pointer ${
                      targetIdx === idx
                        ? 'bg-[#7B1FA2] text-white border-[#4A148C]'
                        : 'bg-white text-stone-700 border-stone-300'
                    }`}
                  >
                    {player.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pick My Veggie (for swap or clone) */}
          {(mode === 'swap' || mode === 'clone') && (
            <div>
              <label className="text-xs font-black text-stone-700 uppercase block mb-1.5">
                {mode === 'clone'
                  ? isId
                    ? 'Pilih Sayur Kamu (dapat +1 tambahan):'
                    : 'Choose Your Veggie to Duplicate (+1):'
                  : isId
                  ? '1. Pilih Sayur Kamu (untuk diberikan):'
                  : '1. Give 1 of Your Veggies:'}
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {ALL_RESOURCES.map((res) => {
                  const count = me.resources[res] ?? 0;
                  const selected = myRes === res;
                  return (
                    <button
                      key={res}
                      type="button"
                      disabled={count === 0}
                      onClick={() => {
                        Sound.cardSelect(soundEnabled);
                        setMyRes(res);
                      }}
                      className={`flex flex-col items-center p-1.5 rounded-xl border-2 transition ${
                        selected
                          ? 'bg-emerald-50 border-[#2E7D32] scale-105 shadow-md'
                          : count > 0
                          ? 'bg-white border-stone-200 hover:border-stone-400 cursor-pointer'
                          : 'bg-stone-100 border-stone-200 opacity-35 cursor-not-allowed'
                      }`}
                    >
                      <VeggieIcon resource={res} size={26} />
                      <span className="text-[11px] font-black text-stone-800 mt-0.5">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pick Opponent Veggie (for swap or steal) */}
          {(mode === 'swap' || mode === 'steal') && target && (
            <div>
              <label className="text-xs font-black text-stone-700 uppercase block mb-1.5">
                {mode === 'steal'
                  ? isId
                    ? `Pilih Sayur ${target.name} (untuk dicuri):`
                    : `Choose ${target.name}'s Veggie to Steal:`
                  : isId
                  ? `2. Pilih Sayur ${target.name} (untuk diambil):`
                  : `2. Take 1 of ${target.name}'s Veggies:`}
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {ALL_RESOURCES.map((res) => {
                  const count = target.resources[res] ?? 0;
                  const selected = targetRes === res;
                  return (
                    <button
                      key={res}
                      type="button"
                      disabled={count === 0}
                      onClick={() => {
                        Sound.cardSelect(soundEnabled);
                        setTargetRes(res);
                      }}
                      className={`flex flex-col items-center p-1.5 rounded-xl border-2 transition ${
                        selected
                          ? 'bg-rose-50 border-[#DC2626] scale-105 shadow-md'
                          : count > 0
                          ? 'bg-white border-stone-200 hover:border-stone-400 cursor-pointer'
                          : 'bg-stone-100 border-stone-200 opacity-35 cursor-not-allowed'
                      }`}
                    >
                      <VeggieIcon resource={res} size={26} />
                      <span className="text-[11px] font-black text-stone-800 mt-0.5">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border-b-4 shadow-md transition ${
              canConfirm
                ? `${headerConfig.btnBg} active:scale-95 text-white cursor-pointer`
                : 'bg-stone-300 text-stone-500 border-stone-400 cursor-not-allowed'
            }`}
          >
            {mode === 'swap' ? (
              <ArrowLeftRight className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{headerConfig.btnText}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
