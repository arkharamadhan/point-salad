import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, X, Volume2, VolumeX, Music, Globe, Play } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { DeckSizeOption, GameMode } from '../../engine';
import { VeggieIcon } from './icons/SpiceIcon';
import { Sound } from '../sound/soundEffects';

interface PlayerConfig {
  id: string;
  name: string;
  isBot: boolean;
  botDifficulty: 'easy' | 'greedy';
}

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setSettingsOpen,
    startNewGame,
    soundEnabled,
    toggleSound,
    musicEnabled,
    toggleMusic,
    lang,
    setLang,
    mpRole,
  } = useGameStore();

  const [playerCount, setPlayerCount] = useState<number>(2);
  const [players, setPlayers] = useState<PlayerConfig[]>([
    { id: 'p1', name: 'Pemain 1', isBot: false, botDifficulty: 'greedy' },
    { id: 'p2', name: 'Bot Pintar', isBot: true, botDifficulty: 'greedy' },
    { id: 'p3', name: 'Pemain 3', isBot: true, botDifficulty: 'easy' },
    { id: 'p4', name: 'Pemain 4', isBot: true, botDifficulty: 'easy' },
    { id: 'p5', name: 'Pemain 5', isBot: true, botDifficulty: 'easy' },
    { id: 'p6', name: 'Pemain 6', isBot: true, botDifficulty: 'easy' },
  ]);

  const [deckSize, setDeckSize] = useState<DeckSizeOption | undefined>(undefined);
  const [gameMode, setGameMode] = useState<GameMode>('special');
  const [useCustomSeed, setUseCustomSeed] = useState<boolean>(false);
  const [customSeed, setCustomSeed] = useState<number>(Math.floor(Math.random() * 1000000));

  if (!isSettingsOpen) return null;

  const isId = lang === 'id';
  const isOnline = mpRole !== 'none';

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
    Sound.confirmAction(soundEnabled);
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
      deckSize,
      gameMode,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2C1A0B]/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden font-fredoka">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 14 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 24 }}
        className="relative bg-[#FFFDF8] border-[3px] border-[#C9A46E] rounded-3xl max-w-lg w-full shadow-[0_24px_60px_rgba(44,26,11,0.45)] overflow-hidden flex flex-col max-h-[90dvh]"
      >
        {/* Header — Matching Sayur Heryana Green Theme */}
        <div className="relative bg-gradient-to-b from-[#2E7D32] to-[#23583A] px-5 py-4 text-white flex items-center justify-between overflow-hidden flex-shrink-0">
          <div className="pointer-events-none absolute -top-2 -left-2 opacity-20 -rotate-12">
            <VeggieIcon resource="selada" size={54} />
          </div>
          <div className="pointer-events-none absolute -bottom-3 right-12 opacity-20 rotate-12">
            <VeggieIcon resource="tomat" size={48} />
          </div>

          <div className="relative z-10 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center">
              <Settings className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-wide leading-tight">
                {isId ? 'PENGATURAN' : 'SETTINGS'}
              </h2>
              <p className="text-[11px] text-lime-100/90 font-medium">
                {isId ? 'Suara, Bahasa & Konfigurasi Game' : 'Audio, Language & Game Setup'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              Sound.cardSelect(soundEnabled);
              setSettingsOpen(false);
            }}
            className="relative z-10 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 text-white flex items-center justify-center transition cursor-pointer"
            aria-label={isId ? 'Tutup' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-4 sm:p-5 bg-[#FCF8EE] space-y-4">
          {/* 1. Audio & Language Controls (Always at top & accessible online/solo!) */}
          <div className="bg-white rounded-2xl border-2 border-[#E2D3B8] p-3.5 space-y-3 shadow-2xs">
            <h3 className="text-xs font-black text-[#855726] uppercase tracking-wider">
              {isId ? 'Audio & Bahasa' : 'Audio & Language'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Master Sound / SFX */}
              <div className="bg-[#FFF8EB] border border-[#E5CCA0] rounded-xl px-3 py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-stone-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="text-xs font-black text-stone-800 block leading-tight">
                      {isId ? 'Suara' : 'Sound'}
                    </span>
                    <span className="text-[10px] font-bold text-stone-500">
                      {soundEnabled ? (isId ? 'Aktif' : 'On') : isId ? 'Mati' : 'Muted'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleSound}
                  className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                    soundEnabled ? 'bg-[#2E7D32]' : 'bg-stone-300'
                  }`}
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform ${
                      soundEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Background Music */}
              <div className="bg-[#FFF8EB] border border-[#E5CCA0] rounded-xl px-3 py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Music
                    className={`w-4 h-4 shrink-0 ${
                      soundEnabled && musicEnabled ? 'text-[#D97706]' : 'text-stone-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-black text-stone-800 block leading-tight">
                      {isId ? 'Musik' : 'Music'}
                    </span>
                    <span className="text-[10px] font-bold text-stone-500">
                      {soundEnabled && musicEnabled ? (isId ? 'Aktif' : 'On') : isId ? 'Mati' : 'Off'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleMusic}
                  className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                    soundEnabled && musicEnabled ? 'bg-[#D97706]' : 'bg-stone-300'
                  }`}
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform ${
                      soundEnabled && musicEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Language Switch */}
              <div className="bg-[#FFF8EB] border border-[#E5CCA0] rounded-xl px-3 py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Globe className="w-4 h-4 text-[#23583A] shrink-0" />
                  <span className="text-xs font-black text-stone-800 truncate">
                    {isId ? 'Bahasa' : 'Lang'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    Sound.cardSelect(soundEnabled);
                    setLang(isId ? 'en' : 'id');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-[#C9A46E] text-stone-800 font-black text-xs shadow-2xs cursor-pointer transition active:scale-95 shrink-0"
                >
                  {isId ? '🇮🇩 ID' : '🇬🇧 EN'}
                </button>
              </div>
            </div>
          </div>

          {/* 2. Local New Game Setup (hidden during Online Multiplayer so room isn't accidentally reset) */}
          {!isOnline && (
            <div className="bg-white rounded-2xl border-2 border-[#E2D3B8] p-3.5 space-y-4 shadow-2xs">
              <h3 className="text-xs font-black text-[#855726] uppercase tracking-wider">
                {isId ? 'Pengaturan Permainan Baru (Lokal)' : 'New Local Game Setup'}
              </h3>

              {/* Player Count */}
              <div>
                <label className="text-[11px] font-black text-stone-600 uppercase block mb-1.5">
                  {isId ? `Jumlah Pemain (${playerCount} Pemain)` : `Players (${playerCount})`}
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[2, 3, 4, 5, 6].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setPlayerCount(count)}
                      className={`py-1.5 rounded-xl font-black text-xs transition-all border-2 cursor-pointer ${
                        playerCount === count
                          ? 'bg-[#2E7D32] border-[#1B5E20] text-white shadow-sm'
                          : 'bg-[#FCF8EE] border-[#E5D7BE] text-stone-700 hover:border-[#C9A46E]'
                      }`}
                    >
                      {count}P
                      <span className="block text-[9px] font-bold opacity-80">{count * 18}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Game Mode */}
              <div>
                <label className="text-[11px] font-black text-stone-600 uppercase block mb-1.5">
                  {isId ? 'Mode Permainan' : 'Game Mode'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGameMode('special')}
                    className={`py-2 rounded-xl font-black text-xs transition-all border-2 cursor-pointer ${
                      gameMode === 'special'
                        ? 'bg-[#7B1FA2] border-[#4A148C] text-white shadow-sm'
                        : 'bg-[#FCF8EE] border-[#E5D7BE] text-stone-700 hover:border-[#C9A46E]'
                    }`}
                  >
                    ✨ {isId ? 'Mode Seru (Power-Up)' : 'Special Mode'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGameMode('classic')}
                    className={`py-2 rounded-xl font-black text-xs transition-all border-2 cursor-pointer ${
                      gameMode === 'classic'
                        ? 'bg-[#23583A] border-[#143522] text-white shadow-sm'
                        : 'bg-[#FCF8EE] border-[#E5D7BE] text-stone-700 hover:border-[#C9A46E]'
                    }`}
                  >
                    🥗 {isId ? 'Mode Klasik' : 'Classic Mode'}
                  </button>
                </div>
              </div>

              {/* Deck Size */}
              <div>
                <label className="text-[11px] font-black text-stone-600 uppercase block mb-1.5">
                  {isId
                    ? `Ukuran Dek (${deckSize ? `${deckSize} Kartu` : `Otomatis ${playerCount * 18}`})`
                    : `Deck Size (${deckSize ?? `Auto ${playerCount * 18}`})`}
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {([undefined, 36, 54, 72, 108] as Array<DeckSizeOption | undefined>).map((val) => (
                    <button
                      key={val ?? 'auto'}
                      type="button"
                      onClick={() => setDeckSize(val)}
                      className={`py-1.5 rounded-xl font-black text-xs transition-all border-2 cursor-pointer ${
                        deckSize === val
                          ? 'bg-[#D97706] border-[#92400E] text-white shadow-sm'
                          : 'bg-[#FCF8EE] border-[#E5D7BE] text-stone-700 hover:border-[#C9A46E]'
                      }`}
                    >
                      {val ? `${val}` : 'Auto'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Players Config */}
              <div>
                <label className="text-[11px] font-black text-stone-600 uppercase block mb-1.5">
                  {isId ? 'Konfigurasi Pemain' : 'Players Config'}
                </label>
                <div className="space-y-2">
                  {players.slice(0, playerCount).map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 bg-[#FCF8EE] border border-[#E5D7BE] rounded-xl px-2.5 py-1.5"
                    >
                      <span className="text-xs font-black text-[#855726] w-5 text-center shrink-0">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => handlePlayerNameChange(idx, e.target.value)}
                        className="flex-1 min-w-0 bg-white border border-[#DFCFAE] rounded-lg px-2 py-1 text-xs font-bold text-stone-800 focus:outline-none focus:border-[#2E7D32]"
                      />
                      <button
                        type="button"
                        onClick={() => handlePlayerBotToggle(idx, !p.isBot)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-black border cursor-pointer shrink-0 ${
                          p.isBot
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        }`}
                      >
                        {p.isBot ? '🤖 Bot' : '👤 Orang'}
                      </button>
                      {p.isBot && (
                        <select
                          value={p.botDifficulty}
                          onChange={(e) =>
                            handleBotDifficultyChange(idx, e.target.value as 'easy' | 'greedy')
                          }
                          className="bg-white border border-[#DFCFAE] rounded-lg px-1.5 py-1 text-[11px] font-bold text-stone-700 focus:outline-none"
                        >
                          <option value="greedy">{isId ? 'Pintar' : 'Smart'}</option>
                          <option value="easy">{isId ? 'Santai' : 'Easy'}</option>
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Custom Seed */}
              <div className="bg-[#FCF8EE] border border-[#E5D7BE] rounded-xl p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-stone-600 uppercase">
                    Seed RNG
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-stone-700">
                    <input
                      type="checkbox"
                      checked={useCustomSeed}
                      onChange={(e) => setUseCustomSeed(e.target.checked)}
                      className="rounded accent-[#2E7D32]"
                    />
                    {isId ? 'Kustom Seed' : 'Custom Seed'}
                  </label>
                </div>
                {useCustomSeed && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      value={customSeed}
                      onChange={(e) => setCustomSeed(parseInt(e.target.value) || 0)}
                      className="bg-white border border-[#DFCFAE] rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-stone-800 flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setCustomSeed(Math.floor(Math.random() * 1000000))}
                      className="bg-[#FFF8EB] hover:bg-[#F5E6C8] border border-[#C9A46E] text-xs px-2.5 py-1 rounded-lg text-[#5D4037] font-black cursor-pointer"
                    >
                      {isId ? 'Acak' : 'Random'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 bg-[#FFFDF8] border-t-2 border-[#EDE3D0] flex items-center justify-end gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              Sound.cardSelect(soundEnabled);
              setSettingsOpen(false);
            }}
            className="px-4 py-2 rounded-2xl bg-[#FFF8EB] hover:bg-[#F5E6C8] active:scale-95 text-[#5D4037] font-black text-xs sm:text-sm border-2 border-[#D7B98A] transition cursor-pointer"
          >
            {isId ? 'Tutup' : 'Close'}
          </button>

          {!isOnline && (
            <button
              type="button"
              onClick={handleStartGame}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-2xl bg-gradient-to-b from-[#43A047] to-[#2E7D32] hover:from-[#388E3C] hover:to-[#256628] active:scale-95 text-white font-black text-xs sm:text-sm border-2 border-[#1B5E20] shadow-md transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isId ? 'Mulai Permainan Baru' : 'Start New Game'}</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
