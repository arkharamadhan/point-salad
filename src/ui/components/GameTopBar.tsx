import React from 'react';
import { Home } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { Sound } from '../sound/soundEffects';

export const GameTopBar: React.FC = () => {
  const {
    gameState,
    roomCode,
    endTurn,
    setSettingsOpen,
    setScreen,
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
      {/* Top-Left: Menu & Home Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            Sound.cardSelect(soundEnabled);
            setScreen('menu');
          }}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#23583A] hover:bg-[#1D4A30] active:scale-95 text-white flex items-center justify-center shadow-md border border-[#1A452D] transition-transform cursor-pointer"
          title={lang === 'id' ? 'Kembali ke Menu Utama' : 'Back to Main Menu'}
        >
          <Home className="w-5 h-5" />
        </button>

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
          className="px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-stone-800 border border-stone-300 font-fredoka font-bold text-xs shadow-sm cursor-pointer"
        >
          {lang === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}
        </button>
      </div>

      {/* Center: Game Title & Optional Room Code */}
      <div className="hidden sm:flex items-center gap-2 bg-[#FFF8EB]/90 border-2 border-[#C9A46E] px-4 py-1.5 rounded-2xl shadow-sm">
        <span className="font-black text-[#23583A] text-sm tracking-wide">
          SAYUR HERYANA
        </span>
        {roomCode && (
          <span className="px-2 py-0.5 rounded-lg bg-amber-100 border border-amber-400 text-amber-900 font-black text-xs tracking-wider">
            ROOM: {roomCode}
          </span>
        )}
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
