import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { SKILL_META } from './PowerUpRollModal';
import { SwapVeggieModal, SkillModalMode } from './SwapVeggieModal';
import { Sound } from '../sound/soundEffects';

export const SkillBar: React.FC = () => {
  const {
    gameState,
    mpRole,
    mpMyPlayerIndex,
    useSkillRefreshMarket,
    useSkillGrabThree,
    useSkillGoldenTouch,
    soundEnabled,
    lang,
  } = useGameStore();

  const [modalMode, setModalMode] = useState<SkillModalMode | null>(null);

  if (gameState.gameMode !== 'special' || gameState.phase === 'game_over') {
    return null;
  }

  const isId = lang === 'id';
  const isOnline = mpRole !== 'none';
  const myIndex =
    isOnline && mpMyPlayerIndex !== null ? mpMyPlayerIndex : gameState.currentTurnPlayerIndex;
  const myPlayer = gameState.players[myIndex];

  if (!myPlayer || !myPlayer.assignedSkill || myPlayer.isBot) {
    return null;
  }

  const skillId = myPlayer.assignedSkill;
  const meta = SKILL_META[skillId];
  const isMyTurn = !isOnline || myIndex === gameState.currentTurnPlayerIndex;
  const alreadyUsed = Boolean(myPlayer.skillUsed);
  const canUseNow = isMyTurn && !alreadyUsed && !gameState.hasTakenMainActionThisTurn;

  const myTotalVeggies = Object.values(myPlayer.resources).reduce((a, b) => a + b, 0);
  const opponentHasVeggie = gameState.players.some(
    (p, idx) => idx !== myIndex && Object.values(p.resources).some((c) => c > 0)
  );
  const boardHasVeggie = gameState.market.resourceSlots.some(Boolean);

  let disabledReason: string | null = null;
  if (skillId === 'swap_veggie' && (myTotalVeggies === 0 || !opponentHasVeggie)) {
    disabledReason = isId
      ? 'Kamu & lawan harus punya minimal 1 sayur untuk tukar'
      : 'Both you and an opponent need at least 1 veggie to swap';
  } else if (skillId === 'steal_veggie' && !opponentHasVeggie) {
    disabledReason = isId
      ? 'Lawan belum punya sayur untuk dicuri'
      : 'Opponent has no veggies to steal yet';
  } else if (skillId === 'clone_veggie' && myTotalVeggies === 0) {
    disabledReason = isId
      ? 'Kamu harus punya minimal 1 sayur dulu untuk digandakan'
      : 'You need at least 1 veggie to duplicate';
  } else if (skillId === 'golden_touch' && !boardHasVeggie) {
    disabledReason = isId ? 'Tidak ada sayur di talenan' : 'No veggies on board';
  }

  const isButtonEnabled = canUseNow && !disabledReason;

  const handleClick = () => {
    if (!isButtonEnabled) return;
    if (skillId === 'refresh_market') {
      Sound.skillActivate(soundEnabled);
      useSkillRefreshMarket();
    } else if (skillId === 'grab_three') {
      Sound.skillActivate(soundEnabled);
      useSkillGrabThree();
    } else if (skillId === 'golden_touch') {
      Sound.skillActivate(soundEnabled);
      useSkillGoldenTouch();
    } else if (skillId === 'swap_veggie') {
      Sound.cardSelect(soundEnabled);
      setModalMode('swap');
    } else if (skillId === 'steal_veggie') {
      Sound.cardSelect(soundEnabled);
      setModalMode('steal');
    } else if (skillId === 'clone_veggie') {
      Sound.cardSelect(soundEnabled);
      setModalMode('clone');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={!isButtonEnabled}
        className={`px-3 py-1 rounded-full text-[11px] sm:text-xs font-black font-fredoka flex items-center gap-1.5 border-2 shadow-sm transition-all ${
          alreadyUsed
            ? 'bg-black/20 text-white/60 border-white/20 line-through cursor-not-allowed'
            : isButtonEnabled
            ? `bg-gradient-to-r ${meta.color} text-white border-amber-300 hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-amber-300/40`
            : 'bg-black/25 text-white/75 border-white/25 cursor-not-allowed opacity-75'
        }`}
        title={
          alreadyUsed
            ? isId
              ? 'Power-Up sudah terpakai di ronde ini'
              : 'Power-Up already used this round'
            : disabledReason ?? (isId ? meta.descId : meta.descEn)
        }
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-200 shrink-0" />
        <span>{meta.emoji}</span>
        <span>{isId ? meta.nameId : meta.nameEn}</span>
        {!alreadyUsed && (
          <span className="text-[9px] bg-white/25 px-1.5 rounded-full">1x</span>
        )}
      </button>

      {modalMode && (
        <SwapVeggieModal
          myIndex={myIndex}
          mode={modalMode}
          onClose={() => setModalMode(null)}
        />
      )}
    </>
  );
};
