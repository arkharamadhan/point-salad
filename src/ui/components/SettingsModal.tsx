import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';

interface PlayerConfig {
  id: string;
  name: string;
  isBot: boolean;
  botDifficulty: 'easy' | 'greedy';
}

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setSettingsOpen, startNewGame, soundEnabled, toggleSound, lang, setLang } =
    useGameStore();

  const [playerCount, setPlayerCount] = useState<number>(2);
  const [players, setPlayers] = useState<PlayerConfig[]>([
    { id: 'p1', name: 'Pemain 1', isBot: false, botDifficulty: 'greedy' },
    { id: 'p2', name: 'Bot Pintar', isBot: true, botDifficulty: 'greedy' },
    { id: 'p3', name: 'Pemain 3', isBot: true, botDifficulty: 'easy' },
    { id: 'p4', name: 'Pemain 4', isBot: true, botDifficulty: 'easy' },
  ]);

  const [useCustomSeed, setUseCustomSeed] = useState<boolean>(false);
  const [customSeed, setCustomSeed] = useState<number>(Math.floor(Math.random() * 1000000));

  if (!isSettingsOpen) return null;

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    const updated = [...players];
    updated[index].name = name;
    setPlayers(updated);
  };

  const handlePlayerBotToggle = (index: number, isBot: boolean) => {
    const updated = [...players];
    updated[index].isBot = isBot;
    if (isBot && !updated[index].name.includes('Bot')) {
      updated[index].name = `Bot ${index + 1}`;
    }
    setPlayers(updated);
  };

  const handleBotDifficultyChange = (index: number, diff: 'easy' | 'greedy') => {
    const updated = [...players];
    updated[index].botDifficulty = diff;
    setPlayers(updated);
  };

  const handleStartGame = () => {
    const activePlayers = players.slice(0, playerCount).map((p) => ({
      id: p.id,
      name: p.name.trim() || `Pemain ${p.id}`,
      isBot: p.isBot,
      botDifficulty: p.isBot ? p.botDifficulty : undefined,
    }));

    const seed = useCustomSeed ? customSeed : Math.floor(Math.random() * 1000000);

    startNewGame({
      players: activePlayers,
      seed,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-amber-600/70 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl text-stone-100 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h2 className="text-xl font-extrabold text-amber-200 font-fredoka">
              PENGATURAN PERMAINAN
            </h2>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="text-stone-400 hover:text-stone-100 font-bold text-lg p-1"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5">
          {/* 1. Player Count Selector */}
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2 font-fredoka">
              Jumlah Pemain ({playerCount} Pemain)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => handlePlayerCountChange(count)}
                  className={`py-2.5 rounded-xl font-bold text-sm transition-all border ${
                    playerCount === count
                      ? 'bg-amber-600 border-amber-400 text-white shadow-lg'
                      : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  {count} Pemain
                  <span className="block text-[10px] font-normal opacity-80">
                    {count === 2 ? '60 Kartu' : count === 3 ? '72 Kartu' : '90 Kartu'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Players Configuration List */}
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2 font-fredoka">
              Konfigurasi Pemain
            </label>
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {players.slice(0, playerCount).map((p, idx) => (
                <div
                  key={p.id}
                  className="bg-stone-950/70 border border-stone-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="w-6 h-6 rounded-full bg-stone-800 flex items-center justify-center text-xs font-bold text-amber-400">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => handlePlayerNameChange(idx, e.target.value)}
                      placeholder={`Nama Pemain ${idx + 1}`}
                      className="bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-xs text-stone-100 font-semibold focus:outline-none focus:border-amber-500 w-full sm:w-40"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {/* Human / Bot Toggle */}
                    <div className="flex bg-stone-900 rounded-lg p-0.5 border border-stone-800">
                      <button
                        type="button"
                        onClick={() => handlePlayerBotToggle(idx, false)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${
                          !p.isBot
                            ? 'bg-amber-600 text-white'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        Manusia
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePlayerBotToggle(idx, true)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${
                          p.isBot
                            ? 'bg-amber-600 text-white'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        Bot 🤖
                      </button>
                    </div>

                    {/* Bot Difficulty if Bot */}
                    {p.isBot && (
                      <select
                        value={p.botDifficulty}
                        onChange={(e) =>
                          handleBotDifficultyChange(idx, e.target.value as 'easy' | 'greedy')
                        }
                        className="bg-stone-900 border border-stone-700 text-[11px] font-bold text-amber-300 rounded-lg px-2 py-1 focus:outline-none"
                      >
                        <option value="greedy">Pintar (Greedy)</option>
                        <option value="easy">Mudah (Acak)</option>
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. RNG Seed Setting */}
          <div className="bg-stone-950/50 border border-stone-800 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider font-fredoka">
                Seed Deterministik (RNG)
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-stone-300">
                <input
                  type="checkbox"
                  checked={useCustomSeed}
                  onChange={(e) => setUseCustomSeed(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500 bg-stone-900 border-stone-700"
                />
                Kustom Seed
              </label>
            </div>

            {useCustomSeed ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  value={customSeed}
                  onChange={(e) => setCustomSeed(parseInt(e.target.value) || 0)}
                  className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500 flex-1"
                />
                <button
                  type="button"
                  onClick={() => setCustomSeed(Math.floor(Math.random() * 1000000))}
                  className="bg-stone-800 hover:bg-stone-700 text-xs px-3 py-1.5 rounded-lg text-stone-300 font-semibold"
                >
                  Acak
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-stone-500">
                Seed akan di-generate secara acak tiap kali permainan dimulai.
              </p>
            )}
          </div>

          {/* 4. Audio & Language */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-stone-950/50 border border-stone-800 rounded-xl p-3 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-stone-300">Efek Suara</span>
                <span className="text-[10px] text-stone-500">
                  {soundEnabled ? 'Aktif' : 'Mati'}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleSound}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  soundEnabled ? 'bg-amber-600' : 'bg-stone-800'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="bg-stone-950/50 border border-stone-800 rounded-xl p-3 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-stone-300">Bahasa UI</span>
                <span className="text-[10px] text-stone-500">
                  {lang === 'id' ? 'Bahasa Indonesia' : 'English'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
                className="bg-stone-800 hover:bg-stone-700 text-xs font-bold px-2.5 py-1 rounded-lg text-amber-300"
              >
                {lang === 'id' ? 'ID' : 'EN'}
              </button>
            </div>
          </div>
        </div>

        {/* Start Game Action Button */}
        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-stone-800">
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleStartGame}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-lime-600 to-lime-700 hover:from-lime-500 hover:to-lime-600 text-white text-xs font-bold shadow-lg transition-all transform hover:scale-105 active:scale-95 font-fredoka tracking-wider cursor-pointer"
          >
            Mulai Permainan Baru
          </button>
        </div>
      </div>
    </div>
  );
};
