import React from 'react';
import { useGameStore } from './ui/store/gameStore';
import { GameTopBar } from './ui/components/GameTopBar';
import { MarketCuttingBoard } from './ui/components/MarketCuttingBoard';
import { PlayerSideCard } from './ui/components/PlayerSideCard';
import { PlayerActiveShelf } from './ui/components/PlayerActiveShelf';
import { EndGameModal } from './ui/components/EndGameModal';
import { SettingsModal } from './ui/components/SettingsModal';
import { useKeyboardNav } from './ui/hooks/useKeyboardNav';

export const App: React.FC = () => {
  // Activate keyboard navigation
  useKeyboardNav();

  const { gameState, setSettingsOpen } = useGameStore();
  const { players, currentTurnPlayerIndex, phase } = gameState;
  const isGameOver = phase === 'game_over';

  // Split players into left and right columns:
  // Left: Player 1 (idx 0), Player 3 (idx 2)
  // Right: Player 2 (idx 1), Player 4 (idx 3)
  const leftPlayers = [0, 2]
    .filter((idx) => idx < players.length)
    .map((idx) => ({ player: players[idx], index: idx }));

  const rightPlayers = [1, 3]
    .filter((idx) => idx < players.length)
    .map((idx) => ({ player: players[idx], index: idx }));

  return (
    <div className="min-h-screen veggie-table-bg text-stone-900 flex flex-col justify-between relative overflow-x-hidden font-fredoka">
      {/* 1. TOP NAVIGATION CONTROLS */}
      <GameTopBar />

      {/* 2. MAIN CENTER ARENA: LEFT PLAYERS | WOODEN BOARD | RIGHT PLAYERS */}
      <main className="flex-1 flex flex-col lg:flex-row items-center lg:items-center justify-center gap-3 sm:gap-4 md:gap-6 w-full max-w-7xl mx-auto px-2 sm:px-4 py-1">
        {/* Left Side Players */}
        <aside className="flex flex-row lg:flex-col gap-3 justify-center items-center flex-shrink-0 order-2 lg:order-1">
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

        {/* Center: Wooden Cutting Board Market */}
        <section className="flex-1 flex justify-center w-full order-1 lg:order-2">
          <MarketCuttingBoard />
        </section>

        {/* Right Side Players */}
        <aside className="flex flex-row lg:flex-col gap-3 justify-center items-center flex-shrink-0 order-3">
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
      <footer className="w-full relative mt-auto">
        <PlayerActiveShelf />
      </footer>

      {/* Bottom-Left Floating Undo / Settings Button (matching reference image) */}
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

      {/* Modals */}
      <EndGameModal />
      <SettingsModal />
    </div>
  );
};

export default App;
