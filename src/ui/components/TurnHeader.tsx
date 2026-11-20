import React from 'react';
import { useGameStore } from '../store/gameStore';

export const TurnHeader: React.FC = () => {
  const { gameState, setSettingsOpen, lang, setLang, errorMessage, clearError, isBotThinking } = useGameStore();
  const { turnCount, players, currentTurnPlayerIndex, log } = gameState;
  const activePlayer = players[currentTurnPlayerIndex];

  const recentLog = log[log.length - 1] ?? '';

  return (
    <header className="w-full max-w-5xl mx-auto flex flex-col gap-2">
      {/* Top Navbar */}
      <div className="flex items-center justify-between py-2 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center font-bold text-white shadow-md font-cinzel">
            PS
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-emerald-200 tracking-wider font-cinzel">
              PANEN SAYUR
            </h1>
            <p className="text-[10px] sm:text-xs text-stone-400">
              Permainan Kartu Veggie Drafting Cepat
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
            className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-xs font-bold text-stone-300 hover:text-amber-400 hover:border-stone-700 transition-colors"
          >
            {lang === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 active:bg-stone-900 text-xs font-semibold text-stone-200 transition-colors shadow flex items-center gap-1.5"
          >
            <span>⚙️</span>
            <span>Pengaturan</span>
          </button>
        </div>
      </div>

      {/* Active Player Turn Banner */}
      <div className="bg-gradient-to-r from-amber-950/70 via-stone-900/90 to-amber-950/70 border border-amber-800/40 rounded-xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest font-cinzel">
                GILIRAN {turnCount}
              </span>
              {activePlayer?.isBot && (
                <span className="bg-indigo-900/60 text-indigo-300 border border-indigo-700 text-[10px] px-1.5 py-0.2 rounded font-bold">
                  {isBotThinking ? '🤖 Bot Sedang Berpikir...' : '🤖 Bot'}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-black text-stone-100">
              Sekarang giliran:{' '}
              <span className="text-amber-300 font-bold underline decoration-amber-500 decoration-2">
                {activePlayer?.name}
              </span>
            </h2>
          </div>
        </div>

        {/* Recent Game Action Log */}
        {recentLog && (
          <div className="text-xs text-stone-400 bg-stone-950/60 px-3 py-1.5 rounded-lg border border-stone-800 max-w-md truncate text-center sm:text-right">
            <span className="text-amber-500/80 mr-1">ℹ</span>
            {recentLog}
          </div>
        )}
      </div>

      {/* Error Alert if any */}
      {errorMessage && (
        <div className="bg-rose-950/90 border border-rose-600 text-rose-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg">
          <span>⚠️ {errorMessage}</span>
          <button
            onClick={clearError}
            className="text-rose-400 hover:text-rose-200 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}
    </header>
  );
};
