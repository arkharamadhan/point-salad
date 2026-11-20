import React, { useEffect } from 'react';
import { useGameStore } from './ui/store/gameStore';
import { GameTopBar } from './ui/components/GameTopBar';
import { MarketCuttingBoard } from './ui/components/MarketCuttingBoard';
import { PlayerSideCard } from './ui/components/PlayerSideCard';
import { PlayerActiveShelf } from './ui/components/PlayerActiveShelf';
import { EndGameModal } from './ui/components/EndGameModal';
import { SettingsModal } from './ui/components/SettingsModal';
import { PlayerRecipesModal } from './ui/components/PlayerRecipesModal';
import { MainMenu } from './ui/components/MainMenu';
import { EmoteBar } from './ui/components/EmoteBar';
import { ActionToastBanner } from './ui/components/ActionToastBanner';
import { PowerUpRollModal } from './ui/components/PowerUpRollModal';
import { VeggieIcon } from './ui/components/icons/SpiceIcon';
import { useKeyboardNav } from './ui/hooks/useKeyboardNav';
import { BgmPlayer } from './ui/sound/bgmPlayer';

export const App: React.FC = () => {
  // Activate keyboard navigation
  useKeyboardNav();

  const { screen, gameState, setSettingsOpen, soundEnabled, musicEnabled } = useGameStore();

  // Sync background music with sound & music settings
  useEffect(() => {
    BgmPlayer.setEnabled(soundEnabled && musicEnabled);
  }, [soundEnabled, musicEnabled]);

  // Unlock Web Audio BGM on first user gesture & pause when tab is hidden
  useEffect(() => {
    const handleUnlock = () => BgmPlayer.unlock();
    const handleVisibility = () => BgmPlayer.setTabHidden(document.hidden);

    window.addEventListener('pointerdown', handleUnlock, { passive: true });
    window.addEventListener('keydown', handleUnlock, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('pointerdown', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
      document.removeEventListener('visibilitychange', handleVisibility);
      BgmPlayer.setEnabled(false);
    };
  }, []);

  if (screen === 'menu') {
    return <MainMenu />;
  }

  const { players, currentTurnPlayerIndex, phase } = gameState;
  const isGameOver = phase === 'game_over';

  // Split players into left and right columns for desktop:
  // Left: Player 1 (idx 0), Player 3 (idx 2)
  // Right: Player 2 (idx 1), Player 4 (idx 3)
  const leftPlayers = [0, 2]
    .filter((idx) => idx < players.length)
    .map((idx) => ({ player: players[idx], index: idx }));

  const rightPlayers = [1, 3]
    .filter((idx) => idx < players.length)
    .map((idx) => ({ player: players[idx], index: idx }));

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden kitchen-table-bg text-stone-900 flex flex-col justify-between relative overflow-x-hidden font-fredoka">
      {/* Decorative Warm Kitchen Table Accents (non-interactive, fills empty space gently) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        {/* Soft warm spotlight behind the cutting board */}
        <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[420px] rounded-full bg-amber-100/55 blur-3xl" />

        {/* Subtle corner botanical / veggie garnishes on desktop */}
        <div className="hidden lg:block absolute top-16 left-5 opacity-20 -rotate-12">
          <VeggieIcon resource="selada" size={76} />
        </div>
        <div className="hidden lg:block absolute top-20 right-6 opacity-20 rotate-12">
          <VeggieIcon resource="tomat" size={68} />
        </div>
        <div className="hidden lg:block absolute bottom-44 left-8 opacity-18 rotate-15">
          <VeggieIcon resource="wortel" size={72} />
        </div>
        <div className="hidden lg:block absolute bottom-44 right-8 opacity-18 -rotate-15">
          <VeggieIcon resource="paprika" size={70} />
        </div>
      </div>

      {/* 1. TOP NAVIGATION CONTROLS */}
      <div className="relative z-20 flex-shrink-0">
        <GameTopBar />
      </div>

      {/* 2. MAIN CENTER ARENA: LEFT PLAYERS | BIG WOODEN CUTTING BOARD | RIGHT PLAYERS */}
      <main className="relative z-10 flex-1 min-h-0 flex flex-col lg:flex-row items-center justify-center gap-3 lg:gap-5 xl:gap-7 w-full max-w-[1380px] mx-auto px-2.5 sm:px-4 py-1">
        {/* Desktop Left Side Players */}
        <aside className="hidden lg:flex flex-col gap-3 justify-center items-center flex-shrink-0">
          {leftPlayers.map(({ player, index }) => (
            <PlayerSideCard
              key={player.id}
              player={player}
              playerIndex={index}
              allPlayers={players}
              isActiveTurn={index === currentTurnPlayerIndex && !isGameOver}
              isGameOver={isGameOver}
            />
          ))}
        </aside>

        {/* Center: Mobile Player Cards (snug directly above board) + Wooden Cutting Board Market */}
        <section className="flex-1 flex flex-col justify-center items-center w-full">
          {/* Mobile Compact Player Strip — sits directly flush on top of the cutting board */}
          <div className="lg:hidden w-full max-w-[440px] sm:max-w-[540px] mb-1.5">
            <div className={`grid gap-1.5 ${players.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {players.map((player, index) => (
                <PlayerSideCard
                  key={player.id}
                  player={player}
                  playerIndex={index}
                  allPlayers={players}
                  isActiveTurn={index === currentTurnPlayerIndex && !isGameOver}
                  isGameOver={isGameOver}
                  compact={true}
                />
              ))}
            </div>
          </div>

          <MarketCuttingBoard />
        </section>

        {/* Desktop Right Side Players */}
        <aside className="hidden lg:flex flex-col gap-3 justify-center items-center flex-shrink-0">
          {rightPlayers.map(({ player, index }) => (
            <PlayerSideCard
              key={player.id}
              player={player}
              playerIndex={index}
              allPlayers={players}
              isActiveTurn={index === currentTurnPlayerIndex && !isGameOver}
              isGameOver={isGameOver}
            />
          ))}
        </aside>
      </main>

      {/* 3. BOTTOM: INSTRUCTION PILL & ACTIVE PLAYER'S POINT PLATES SHELF */}
      <footer className="w-full relative z-20 flex-shrink-0 mt-auto">
        <PlayerActiveShelf />
      </footer>

      {/* Bottom-Left Floating Undo / Settings Button */}
      <button
        type="button"
        onClick={() => {
          const { hasTakenMainActionThisTurn } = gameState;
          const { turnSnapshot, undoCurrentTurnAction } = useGameStore.getState();
          if (hasTakenMainActionThisTurn || !!turnSnapshot) {
            undoCurrentTurnAction();
          } else {
            setSettingsOpen(true);
          }
        }}
        className="fixed bottom-3 left-3 sm:bottom-4 sm:left-4 z-40 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#23583A] hover:bg-[#1D4A30] active:scale-95 text-white flex items-center justify-center font-black text-lg shadow-lg border border-[#1A452D] transition-transform cursor-pointer"
        title="Batal ambil kartu / Pengaturan"
      >
        ↺
      </button>

      {/* Live Opponent Action Toast & Floating Emote/Quick Chat */}
      <ActionToastBanner />
      <EmoteBar />

      {/* Modals */}
      <PowerUpRollModal />
      <EndGameModal />
      <SettingsModal />
      <PlayerRecipesModal />
    </div>
  );
};

export default App;
