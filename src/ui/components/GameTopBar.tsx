import React from 'react';
import { Home, Volume2, VolumeX } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { Sound } from '../sound/soundEffects';

export const GameTopBar: React.FC = () => {
  const {
    gameState,
    roomCode,
    mpRole,
    mpMyPlayerIndex,
    endTurn,
    setSettingsOpen,
    setScreen,
    leaveOnlineRoom,
    lang,
    setLang,
    soundEnabled,
    toggleSound,
  } = useGameStore();

  const { hasTakenMainActionThisTurn, phase, currentTurnPlayerIndex } = gameState;
  const isGameOver = phase === 'game_over';
  const isMyTurn =
    mpRole === 'none' || (mpMyPlayerIndex !== null && currentTurnPlayerIndex === mpMyPlayerIndex);

  const handleEndTurn = () => {
    if (hasTakenMainActionThisTurn && !isGameOver && isMyTurn) {
      Sound.confirmAction(soundEnabled);
      endTurn();
    }
  };

  const handleGoHome = () => {
    Sound.cardSelect(soundEnabled);
    if (mpRole !== 'none') {
      leaveOnlineRoom();
    } else {
      setScreen('menu');
    }
  };

  return (
    <div className="w-full flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 select-none">
      {/* Top-Left: Menu & Home Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleGoHome}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#23583A] hover:bg-[#1D4A30] active:scale-95 text-white flex items-center justify-center shadow-md border border-[#1A452D] transition-transform cursor-pointer"
          title={lang === 'id' ? 'Kembali ke Menu Utama' : 'Back to Main Menu'}
        >
          <Home className="w-5 h-5" />
        </button>

        {mpRole === 'none' && (
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#23583A] hover:bg-[#1D4A30] active:scale-95 text-white flex items-center justify-center font-black text-xl shadow-md border border-[#1A452D] transition-transform cursor-pointer"
            title="Buka Pengaturan Permainan"
          >
            ☰
          </button>
        )}

        {/* Mute / Unmute Audio (Music + SFX) */}
        <button
          type="button"
          onClick={() => toggleSound()}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shadow-sm border transition active:scale-95 cursor-pointer ${
            soundEnabled
              ? 'bg-white/85 hover:bg-white text-[#23583A] border-stone-300'
              : 'bg-stone-200/90 hover:bg-stone-200 text-stone-500 border-stone-300'
          }`}
          title={
            soundEnabled
              ? lang === 'id'
                ? 'Matikan Musik & Suara'
                : 'Mute Music & Sound'
              : lang === 'id'
                ? 'Nyalakan Musik & Suara'
                : 'Unmute Music & Sound'
          }
          aria-label={soundEnabled ? 'Mute audio' : 'Unmute audio'}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
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
          <span className="px-2 py-0.5 rounded-lg bg-emerald-100 border border-emerald-400 text-emerald-900 font-black text-xs tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ROOM: {roomCode}
          </span>
        )}
      </div>

      {/* Top-Right: End Turn Button */}
      <button
        type="button"
        onClick={handleEndTurn}
        disabled={!hasTakenMainActionThisTurn || isGameOver || !isMyTurn}
        className={`px-5 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-black font-fredoka shadow-md transition-all border ${
          hasTakenMainActionThisTurn && !isGameOver && isMyTurn
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
