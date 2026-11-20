import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Sound } from '../sound/soundEffects';

export const GameTopBar: React.FC = () => {
  const {
    gameState,
    endTurn,
    setSettingsOpen,
    lang,
    setLang,
    soundEnabled,
  } = useGameStore();

  const { hasTakenMainActionThisTurn, phase } = gameState;
  const isGameOver = phase === 'game_over';

  const handleEndTurn = () => {
    if (hasTakenMainActionThisTurn && !isGameOver) {
      Sound.confirmAction(soundEnabled);
      endTurn();
    }
  };

  return (
    <div className="w-full flex items-center justify-between p-3 sm:p-4 select-none">
      {/* Top-Left: Menu Button (exactly like reference image) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#23583A] hover:bg-[#1D4A30] active:scale-95 text-white flex items-center justify-center font-black text-xl shadow-md border border-[#1A452D] transition-transform cursor-pointer"
          title="Buka Pengaturan Permainan"
        >
          ☰
        </button>

        {/* Language switch */}
        <button
          type="button"
          onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
          className="px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-stone-800 border border-stone-300 font-fredoka font-bold text-xs shadow-sm"
        >
          {lang === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}
        </button>
      </div>

      {/* Top-Right: End Turn Button (exactly like reference image) */}
      <button
        type="button"
        onClick={handleEndTurn}
        disabled={!hasTakenMainActionThisTurn || isGameOver}
        className={`px-5 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-black font-fredoka shadow-md transition-all border ${
          hasTakenMainActionThisTurn && !isGameOver
            ? 'bg-[#2E7D32] hover:bg-[#276B2B] active:scale-95 text-white border-[#1B5E20] cursor-pointer animate-pulse ring-2 ring-lime-400'
            : 'bg-[#2E7D32]/60 text-stone-200/60 border-transparent cursor-not-allowed opacity-60'
        }`}
        title={
          hasTakenMainActionThisTurn
            ? 'Selesaikan giliran pemain saat ini'
            : 'Lakukan aksi utama terlebih dahulu sebelum menyelesaikan giliran'
        }
      >
        {lang === 'id' ? 'Selesai Giliran' : 'End Turn'}
      </button>
    </div>
  );
};
