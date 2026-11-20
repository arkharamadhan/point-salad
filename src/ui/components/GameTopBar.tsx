import React from 'react';
import { Home, Settings } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { Sound } from '../sound/soundEffects';

export const GameTopBar: React.FC = () => {
  const {
    gameState,
    roomCode,
    mpRole,
    mpMyPlayerIndex,
    seriesWins,
    endTurn,
    setSettingsOpen,
    setScreen,
    leaveOnlineRoom,
    lang,
    soundEnabled,
  } = useGameStore();

  const { hasTakenMainActionThisTurn, phase, currentTurnPlayerIndex, players } = gameState;
  const isGameOver = phase === 'game_over';
  const isMyTurn =
    mpRole === 'none' || (mpMyPlayerIndex !== null && currentTurnPlayerIndex === mpMyPlayerIndex);

  const allWins = players.map((p) => seriesWins[p.id] ?? 0);
  const maxWins = Math.max(0, ...allWins);
  const minWins = allWins.length > 0 ? Math.min(...allWins) : 0;
  const hasWinDiff = maxWins > minWins;

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
      {/* Top-Left: Home & Settings Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleGoHome}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#23583A] hover:bg-[#1D4A30] active:scale-95 text-white flex items-center justify-center shadow-md border border-[#1A452D] transition-transform cursor-pointer"
          title={lang === 'id' ? 'Kembali ke Menu Utama' : 'Back to Main Menu'}
          aria-label={lang === 'id' ? 'Menu Utama' : 'Main Menu'}
        >
          <Home className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => {
            Sound.cardSelect(soundEnabled);
            setSettingsOpen(true);
          }}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#23583A] hover:bg-[#1D4A30] active:scale-95 text-white flex items-center justify-center shadow-md border border-[#1A452D] transition-transform cursor-pointer"
          title={lang === 'id' ? 'Buka Pengaturan' : 'Open Settings'}
          aria-label={lang === 'id' ? 'Pengaturan' : 'Settings'}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Center: Match Series Scoreboard (always visible!) + Optional Room Code */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-[#FFF8EB]/95 border-2 border-[#C9A46E] px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-black font-fredoka text-[#23583A]">
          {players.map((p, idx) => {
            const w = seriesWins[p.id] ?? 0;
            const badge = hasWinDiff ? (w === maxWins ? '👑' : w === minWins ? '🐵' : '') : '';
            return (
              <React.Fragment key={p.id}>
                {idx > 0 && <span className="text-[#C9A46E] font-black">-</span>}
                <span className="inline-flex items-center gap-0.5">
                  {badge && <span className="text-xs sm:text-sm leading-none">{badge}</span>}
                  <span className="hidden md:inline max-w-[72px] truncate">{p.name}</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-white border border-[#DFCFAE] text-[#2E7D32]">
                    {w}
                  </span>
                </span>
              </React.Fragment>
            );
          })}
        </div>
        {roomCode && (
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-lg bg-emerald-100 border border-emerald-400 text-emerald-900 font-black text-[11px] tracking-wider items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {roomCode}
          </span>
        )}
      </div>

      {/* Top-Right: End Turn Button */}
      <button
        type="button"
        onClick={handleEndTurn}
        disabled={!hasTakenMainActionThisTurn || isGameOver || !isMyTurn}
        className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-black font-fredoka shadow-md transition-all border ${
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
