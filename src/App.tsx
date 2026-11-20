import React from 'react';
import { TurnHeader } from './ui/components/TurnHeader';
import { MarketBoard } from './ui/components/MarketBoard';
import { PlayerTableau } from './ui/components/PlayerTableau';
import { EndGameModal } from './ui/components/EndGameModal';
import { SettingsModal } from './ui/components/SettingsModal';
import { useKeyboardNav } from './ui/hooks/useKeyboardNav';

export const App: React.FC = () => {
  // Activate keyboard navigation
  useKeyboardNav();

  return (
    <div className="min-h-screen wood-table text-stone-100 flex flex-col justify-between p-3 sm:p-6 md:p-8 font-sans">
      <div className="flex flex-col gap-6 w-full">
        <TurnHeader />
        <main className="flex flex-col gap-8 w-full">
          <MarketBoard />
          <PlayerTableau />
        </main>
      </div>

      <EndGameModal />
      <SettingsModal />

      {/* Footer */}
      <footer className="mt-8 pt-4 border-t border-stone-800 text-center text-[11px] text-stone-500 font-medium">
        Panen Sayur — Permainan Kartu Veggie-Drafting Segar • Sesuai Aturan RULES.md & cards.json
      </footer>
    </div>
  );
};

export default App;
