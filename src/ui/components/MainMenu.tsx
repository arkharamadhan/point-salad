import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  DoorOpen,
  KeyRound,
  Copy,
  Check,
  ArrowLeft,
  Volume2,
  VolumeX,
  Play,
  Users,
  Sparkles,
  Loader2,
  UserPlus,
  X,
  Crown,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { VeggieIcon } from './icons/SpiceIcon';
import { Sound } from '../sound/soundEffects';
import { ResourceId, GameMode } from '../../engine/types';
import { DeckSizeOption } from '../../engine';

const DECK_SIZE_CHOICES: Array<{ value: DeckSizeOption | undefined; labelId: string; labelEn: string }> = [
  { value: undefined, labelId: 'Auto', labelEn: 'Auto' },
  { value: 36, labelId: '36', labelEn: '36' },
  { value: 54, labelId: '54', labelEn: '54' },
  { value: 72, labelId: '72', labelEn: '72' },
  { value: 108, labelId: '108', labelEn: '108' },
];

type MenuView = 'home' | 'bot' | 'open-room' | 'join-room';

const FLOATING_VEGGIES: ResourceId[] = [
  'tomat',
  'wortel',
  'paprika',
  'selada',
  'bawang',
  'kubis',
];

const BG_DECOR_VEGGIES: {
  resource: ResourceId;
  size: number;
  className: string;
  rotate: number;
  duration: number;
  delay: number;
}[] = [
  { resource: 'tomat', size: 84, className: 'top-[8%] left-[4%] sm:left-[7%]', rotate: -14, duration: 5.5, delay: 0 },
  { resource: 'wortel', size: 92, className: 'top-[14%] right-[4%] sm:right-[8%]', rotate: 18, duration: 6.2, delay: 0.4 },
  { resource: 'selada', size: 88, className: 'top-[48%] left-[2%] sm:left-[5%]', rotate: 12, duration: 5.8, delay: 0.8 },
  { resource: 'paprika', size: 80, className: 'top-[52%] right-[3%] sm:right-[6%]', rotate: -16, duration: 6.0, delay: 0.2 },
  { resource: 'bawang', size: 78, className: 'bottom-[10%] left-[7%] sm:left-[12%]', rotate: -10, duration: 5.2, delay: 1.1 },
  { resource: 'kubis', size: 90, className: 'bottom-[8%] right-[6%] sm:right-[11%]', rotate: 15, duration: 6.5, delay: 0.6 },
];

export const MainMenu: React.FC = () => {
  const {
    lang,
    setLang,
    soundEnabled,
    toggleSound,
    startNewGame,
    setScreen,
    roomCode,
    mpRole,
    mpStatus,
    mpError,
    mpLobbyPlayers,
    mpPlayerName,
    mpHostDisconnected,
    openOnlineRoom,
    joinOnlineRoom,
    addLobbyBot,
    removeLobbyPlayer,
    startOnlineGame,
    leaveOnlineRoom,
    clearMpError,
  } = useGameStore();

  const [view, setView] = useState<MenuView>(() => {
    if (mpRole === 'host') return 'open-room';
    if (mpRole === 'guest') return 'join-room';
    return 'home';
  });
  const [playerName, setPlayerName] = useState<string>(() => mpPlayerName || 'Pemain 1');

  // Bot setup state
  const [botCount, setBotCount] = useState<number>(1);
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'greedy'>('greedy');
  const [selectedDeckSize, setSelectedDeckSize] = useState<DeckSizeOption | undefined>(undefined);
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>('special');

  // Copy feedback
  const [copied, setCopied] = useState<boolean>(false);

  // Join Room state
  const [inputCode, setInputCode] = useState<string>(() =>
    mpRole === 'guest' && roomCode ? roomCode : ''
  );
  const [localJoinError, setLocalJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (mpRole === 'host' && view === 'home') {
      setView('open-room');
    } else if (mpRole === 'guest' && view === 'home') {
      setView('join-room');
    } else if (mpRole === 'none' && mpError && (view === 'open-room' || view === 'join-room')) {
      setView('home');
    }
  }, [mpRole, mpError, view]);

  const isId = lang === 'id';

  const handleBackToHome = () => {
    Sound.cardSelect(soundEnabled);
    if (mpRole !== 'none') {
      leaveOnlineRoom();
    } else {
      clearMpError();
    }
    setLocalJoinError(null);
    setView('home');
  };

  const handleOpenRoomClick = () => {
    Sound.cardSelect(soundEnabled);
    clearMpError();
    setCopied(false);
    setView('open-room');
  };

  const handleCreateRoomNow = () => {
    Sound.confirmAction(soundEnabled);
    openOnlineRoom(playerName.trim() || (isId ? 'Host' : 'Host'));
  };

  const handleCopyCode = async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      Sound.confirmAction(soundEnabled);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleStartBotGame = () => {
    Sound.confirmAction(soundEnabled);
    const botNames = ['Bot Tomat', 'Bot Wortel', 'Bot Kubis'];
    const players = [
      {
        id: 'p1',
        name: playerName.trim() || (isId ? 'Pemain 1' : 'Player 1'),
        isBot: false,
      },
      ...Array.from({ length: botCount }, (_, idx) => ({
        id: `bot-${idx + 1}`,
        name: botNames[idx] ?? `Bot ${idx + 1}`,
        isBot: true,
        botDifficulty,
      })),
    ];

    startNewGame({
      players,
      seed: Math.floor(Math.random() * 1000000),
      deckSize: selectedDeckSize,
      gameMode: selectedGameMode,
    });
    setScreen('game');
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = inputCode.trim().toUpperCase();
    if (cleaned.length < 4) {
      setLocalJoinError(
        isId
          ? 'Masukkan kode room minimal 4 karakter.'
          : 'Please enter a room code (at least 4 characters).'
      );
      return;
    }
    setLocalJoinError(null);
    Sound.confirmAction(soundEnabled);
    joinOnlineRoom(cleaned, playerName.trim() || (isId ? 'Pemain 2' : 'Player 2'));
  };

  const isHostLobbyActive = view === 'open-room' && mpRole === 'host';
  const isGuestLobbyActive = view === 'join-room' && mpRole === 'guest' && mpStatus === 'connected';

  return (
    <div className="min-h-screen veggie-table-bg text-stone-900 flex flex-col justify-between relative overflow-hidden font-fredoka select-none">
      {/* Decorative Floating Background Veggies */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        {BG_DECOR_VEGGIES.map((item, idx) => (
          <motion.div
            key={`${item.resource}-${idx}`}
            initial={{ rotate: item.rotate, opacity: 0.28 }}
            animate={{
              y: [0, -14, 0],
              rotate: [item.rotate - 4, item.rotate + 4, item.rotate - 4],
            }}
            transition={{
              duration: item.duration,
              repeat: Infinity,
              delay: item.delay,
              ease: 'easeInOut',
            }}
            className={`absolute ${item.className} opacity-30 sm:opacity-45 drop-shadow-md`}
          >
            <VeggieIcon resource={item.resource} size={item.size} />
          </motion.div>
        ))}

        {/* Soft radial leafy glow behind center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-[#7CB342]/15 blur-3xl" />
      </div>

      {/* Top Bar: Sound & Language */}
      <header className="w-full flex items-center justify-end gap-2 p-4 z-20">
        <button
          type="button"
          onClick={() => toggleSound()}
          className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm transition active:scale-95 cursor-pointer ${
            soundEnabled
              ? 'bg-white/85 hover:bg-white text-[#23583A] border-stone-300'
              : 'bg-stone-200/90 hover:bg-stone-200 text-stone-500 border-stone-300'
          }`}
          title={
            soundEnabled
              ? isId
                ? 'Matikan Musik & Suara'
                : 'Mute Music & Sound'
              : isId
                ? 'Nyalakan Musik & Suara'
                : 'Unmute Music & Sound'
          }
          aria-label={soundEnabled ? 'Mute audio' : 'Unmute audio'}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        <button
          type="button"
          onClick={() => setLang(isId ? 'en' : 'id')}
          className="px-3 h-10 rounded-xl bg-white/85 hover:bg-white text-stone-800 border border-stone-300 font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
        >
          {isId ? '🇮🇩 ID' : '🇬🇧 EN'}
        </button>
      </header>

      {/* Center Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8 z-10">
        {/* Game Logo / Title */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="text-center mb-6 sm:mb-8"
        >
          {/* Floating Veggie Row */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3">
            {FLOATING_VEGGIES.map((veggie, idx) => (
              <motion.div
                key={veggie}
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  delay: idx * 0.2,
                  ease: 'easeInOut',
                }}
                className="drop-shadow-md"
              >
                <VeggieIcon resource={veggie} size={36} />
              </motion.div>
            ))}
          </div>

          <div className="relative inline-block">
            {/* Market Awning Stripes Accent */}
            <div className="mx-auto w-[86%] h-3.5 rounded-t-xl overflow-hidden flex border-x-2 border-t-2 border-[#1B5E20] shadow-sm">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 ${i % 2 === 0 ? 'bg-[#43A047]' : 'bg-[#FFF8EB]'}`}
                />
              ))}
            </div>

            {/* Peeking Veggies on Sign Corners */}
            <motion.div
              animate={{ rotate: [-12, -4, -12] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -left-5 -bottom-3 sm:-left-7 sm:-bottom-4 z-20 drop-shadow-lg"
            >
              <VeggieIcon resource="tomat" size={44} />
            </motion.div>
            <motion.div
              animate={{ rotate: [12, 4, 12] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -right-5 -bottom-3 sm:-right-7 sm:-bottom-4 z-20 drop-shadow-lg"
            >
              <VeggieIcon resource="wortel" size={46} />
            </motion.div>

            <div className="bg-[#FFF8EB] border-4 border-[#8B5A2B] rounded-3xl px-7 sm:px-11 py-3.5 sm:py-4 shadow-[0_8px_0_#6B421D] relative z-10">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#23583A] drop-shadow-sm">
                SAYUR HERYANA
              </h1>
              <p className="text-xs sm:text-sm font-bold text-[#7A542E] uppercase tracking-widest mt-1 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#7CB342]" />
                {isId ? 'Permainan Kartu Veggie Drafting' : 'Veggie Drafting Card Game'}
                <Sparkles className="w-3.5 h-3.5 text-[#7CB342]" />
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Card Container */}
        <div className="relative w-full max-w-md bg-[#FFFDF7]/95 backdrop-blur-md border-4 border-[#C9A46E] rounded-3xl p-5 sm:p-6 shadow-2xl">
          {/* Corner Veggie Badges on Card */}
          <div className="pointer-events-none absolute -top-4 -left-4 w-9 h-9 rounded-full bg-[#FFF8EB] border-2 border-[#C9A46E] shadow-md flex items-center justify-center">
            <VeggieIcon resource="selada" size={24} />
          </div>
          <div className="pointer-events-none absolute -top-4 -right-4 w-9 h-9 rounded-full bg-[#FFF8EB] border-2 border-[#C9A46E] shadow-md flex items-center justify-center">
            <VeggieIcon resource="paprika" size={24} />
          </div>
          <div className="pointer-events-none absolute -bottom-4 -left-4 w-9 h-9 rounded-full bg-[#FFF8EB] border-2 border-[#C9A46E] shadow-md flex items-center justify-center">
            <VeggieIcon resource="bawang" size={24} />
          </div>
          <div className="pointer-events-none absolute -bottom-4 -right-4 w-9 h-9 rounded-full bg-[#FFF8EB] border-2 border-[#C9A46E] shadow-md flex items-center justify-center">
            <VeggieIcon resource="kubis" size={24} />
          </div>

          {/* Global Multiplayer Disconnect/Error Banner */}
          {mpError && view === 'home' && (
            <div className="mb-3 px-3 py-2 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs font-bold flex items-center justify-between gap-2">
              <span>{mpError}</span>
              <button type="button" onClick={clearMpError} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* HOME VIEW */}
            {view === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5"
              >
                {/* 1. Main sama Bot */}
                <button
                  type="button"
                  onClick={() => {
                    Sound.cardSelect(soundEnabled);
                    clearMpError();
                    setView('bot');
                  }}
                  className="relative overflow-hidden w-full group flex items-center gap-4 p-4 rounded-2xl bg-[#2E7D32] hover:bg-[#256628] active:scale-[0.98] text-white border-b-4 border-[#1B5E20] shadow-md transition-all cursor-pointer text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform z-10">
                    <Bot className="w-7 h-7" />
                  </div>
                  <div className="flex-1 z-10 pr-8">
                    <div className="text-lg sm:text-xl font-black leading-tight">
                      {isId ? 'Main sama Bot' : 'Play vs Bot'}
                    </div>
                    <div className="text-xs text-lime-100 font-medium">
                      {isId
                        ? 'Lawan AI pintar atau santai secara solo'
                        : 'Play solo against smart or casual AI'}
                    </div>
                  </div>
                  <div className="pointer-events-none absolute -right-2 -bottom-2 opacity-25 group-hover:opacity-45 group-hover:scale-110 group-hover:-rotate-6 transition-all">
                    <VeggieIcon resource="wortel" size={56} />
                  </div>
                </button>

                {/* 2. Open Room */}
                <button
                  type="button"
                  onClick={handleOpenRoomClick}
                  className="relative overflow-hidden w-full group flex items-center gap-4 p-4 rounded-2xl bg-[#D97706] hover:bg-[#B45309] active:scale-[0.98] text-white border-b-4 border-[#92400E] shadow-md transition-all cursor-pointer text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform z-10">
                    <DoorOpen className="w-7 h-7" />
                  </div>
                  <div className="flex-1 z-10 pr-8">
                    <div className="text-lg sm:text-xl font-black leading-tight">
                      Open Room
                    </div>
                    <div className="text-xs text-amber-100 font-medium">
                      {isId
                        ? 'Buat ruangan online & bagikan kode ke pacar/teman'
                        : 'Create an online room & share the code'}
                    </div>
                  </div>
                  <div className="pointer-events-none absolute -right-2 -bottom-2 opacity-25 group-hover:opacity-45 group-hover:scale-110 group-hover:rotate-6 transition-all">
                    <VeggieIcon resource="tomat" size={56} />
                  </div>
                </button>

                {/* 3. Masukin Code */}
                <button
                  type="button"
                  onClick={() => {
                    Sound.cardSelect(soundEnabled);
                    clearMpError();
                    setLocalJoinError(null);
                    setView('join-room');
                  }}
                  className="relative overflow-hidden w-full group flex items-center gap-4 p-4 rounded-2xl bg-[#23583A] hover:bg-[#1B462E] active:scale-[0.98] text-white border-b-4 border-[#143522] shadow-md transition-all cursor-pointer text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform z-10">
                    <KeyRound className="w-7 h-7" />
                  </div>
                  <div className="flex-1 z-10 pr-8">
                    <div className="text-lg sm:text-xl font-black leading-tight">
                      {isId ? 'Masukin Code' : 'Enter Room Code'}
                    </div>
                    <div className="text-xs text-emerald-100 font-medium">
                      {isId
                        ? 'Gabung ke room online yang sudah dibuat'
                        : 'Join an existing online room with a code'}
                    </div>
                  </div>
                  <div className="pointer-events-none absolute -right-2 -bottom-2 opacity-25 group-hover:opacity-45 group-hover:scale-110 group-hover:-rotate-6 transition-all">
                    <VeggieIcon resource="kubis" size={56} />
                  </div>
                </button>
              </motion.div>
            )}

            {/* PLAY VS BOT VIEW */}
            {view === 'bot' && (
              <motion.div
                key="bot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
                  <button
                    type="button"
                    onClick={handleBackToHome}
                    className="p-1.5 rounded-lg hover:bg-stone-200/70 text-stone-700 cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-lg font-black text-[#23583A]">
                    {isId ? 'Main sama Bot' : 'Play vs Bot'}
                  </h2>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                    {isId ? 'Nama Kamu' : 'Your Name'}
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={18}
                    placeholder={isId ? 'Masukkan nama...' : 'Enter name...'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-stone-300 focus:border-[#2E7D32] focus:outline-none font-bold text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1.5">
                    {isId ? 'Jumlah Bot' : 'Number of Bots'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setBotCount(count)}
                        className={`py-2 rounded-xl font-bold text-sm border-2 transition cursor-pointer ${
                          botCount === count
                            ? 'bg-[#2E7D32] border-[#1B5E20] text-white shadow'
                            : 'bg-white border-stone-300 text-stone-700 hover:border-stone-400'
                        }`}
                      >
                        {count} Bot
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1.5">
                    {isId ? 'Tingkat Kesulitan' : 'Bot Difficulty'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBotDifficulty('easy')}
                      className={`py-2 rounded-xl font-bold text-sm border-2 transition cursor-pointer ${
                        botDifficulty === 'easy'
                          ? 'bg-[#D97706] border-[#92400E] text-white shadow'
                          : 'bg-white border-stone-300 text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {isId ? 'Santai (Mudah)' : 'Casual (Easy)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBotDifficulty('greedy')}
                      className={`py-2 rounded-xl font-bold text-sm border-2 transition cursor-pointer ${
                        botDifficulty === 'greedy'
                          ? 'bg-[#D97706] border-[#92400E] text-white shadow'
                          : 'bg-white border-stone-300 text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {isId ? 'Pintar (Susah)' : 'Smart (Hard)'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1.5">
                    {isId ? 'Mode Permainan' : 'Game Mode'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedGameMode('special')}
                      className={`py-2 px-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${
                        selectedGameMode === 'special'
                          ? 'bg-[#7B1FA2] border-[#4A148C] text-white shadow'
                          : 'bg-white border-stone-300 text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      ✨ {isId ? 'Mode Seru (Power-Up)' : 'Special (Power-Ups)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedGameMode('classic')}
                      className={`py-2 px-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${
                        selectedGameMode === 'classic'
                          ? 'bg-[#23583A] border-[#143522] text-white shadow'
                          : 'bg-white border-stone-300 text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      🥗 {isId ? 'Mode Klasik' : 'Classic Mode'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1.5">
                    {isId ? 'Jumlah Kartu (Ukuran Dek)' : 'Deck Size (Cards)'}
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {DECK_SIZE_CHOICES.map((opt) => (
                      <button
                        key={opt.labelId}
                        type="button"
                        onClick={() => setSelectedDeckSize(opt.value)}
                        className={`py-2 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${
                          selectedDeckSize === opt.value
                            ? 'bg-[#23583A] border-[#143522] text-white shadow'
                            : 'bg-white border-stone-300 text-stone-700 hover:border-stone-400'
                        }`}
                      >
                        {isId ? opt.labelId : opt.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartBotGame}
                  className="w-full py-3.5 rounded-2xl bg-[#2E7D32] hover:bg-[#256628] active:scale-[0.98] text-white font-black text-base border-b-4 border-[#1B5E20] shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  {isId ? 'Mulai Permainan' : 'Start Game'}
                </button>
              </motion.div>
            )}

            {/* OPEN ROOM VIEW (REAL ONLINE P2P LOBBY) */}
            {view === 'open-room' && (
              <motion.div
                key="open-room"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
                  <button
                    type="button"
                    onClick={handleBackToHome}
                    className="p-1.5 rounded-lg hover:bg-stone-200/70 text-stone-700 cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-lg font-black text-[#B45309]">
                    Open Room Online
                  </h2>
                </div>

                {!isHostLobbyActive ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                        {isId ? 'Nama Kamu (Host)' : 'Your Name (Host)'}
                      </label>
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        maxLength={18}
                        placeholder={isId ? 'Masukkan nama...' : 'Enter name...'}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-stone-300 focus:border-[#D97706] focus:outline-none font-bold text-stone-800"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleCreateRoomNow}
                      className="w-full py-3.5 rounded-2xl bg-[#D97706] hover:bg-[#B45309] active:scale-[0.98] text-white font-black text-base border-b-4 border-[#92400E] shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <DoorOpen className="w-5 h-5" />
                      {isId ? 'Buat Room Sekarang' : 'Create Room Now'}
                    </button>
                  </>
                ) : (
                  <>
                    {/* Room Code Box */}
                    <div className="bg-amber-50 border-2 border-dashed border-amber-400 rounded-2xl p-3.5 text-center">
                      <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1">
                        {isId ? 'Kode Room Online Kamu' : 'Your Online Room Code'}
                      </div>
                      {mpStatus === 'connecting' ? (
                        <div className="flex items-center justify-center gap-2 py-2 text-amber-700 font-bold text-sm">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{isId ? 'Menyiapkan room...' : 'Creating room...'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-3xl font-black tracking-[0.2em] text-[#23583A]">
                            {roomCode}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyCode}
                            className="p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition active:scale-95 cursor-pointer"
                            title={isId ? 'Salin Kode' : 'Copy Code'}
                          >
                            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                          </button>
                        </div>
                      )}
                      <p className="text-[11px] text-amber-700 mt-1.5 flex items-center justify-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {isId
                          ? 'Kirim kode ini ke pacar/teman untuk masuk'
                          : 'Share this code with your partner/friends'}
                      </p>
                    </div>

                    {mpError && (
                      <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs font-bold text-center">
                        {mpError}
                      </div>
                    )}

                    {/* Live Players List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-stone-600 uppercase">
                          {isId ? 'Pemain di Room' : 'Players in Room'} ({mpLobbyPlayers.length}/4)
                        </span>
                        {mpLobbyPlayers.length < 4 && mpStatus === 'connected' && (
                          <button
                            type="button"
                            onClick={() => {
                              Sound.cardSelect(soundEnabled);
                              addLobbyBot();
                            }}
                            className="text-xs font-bold text-[#2E7D32] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            {isId ? '+ Tambah Bot' : '+ Add Bot'}
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        {mpLobbyPlayers.map((p) => (
                          <div
                            key={p.peerId}
                            className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-stone-200 shadow-2xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base">
                                {p.isHost ? (
                                  <Crown className="w-4 h-4 text-amber-500" />
                                ) : p.isBot ? (
                                  '🤖'
                                ) : (
                                  '🥗'
                                )}
                              </span>
                              <span className="font-bold text-sm text-stone-800 truncate">
                                {p.name}
                              </span>
                              {p.isHost && (
                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                  HOST
                                </span>
                              )}
                            </div>
                            {!p.isHost && (
                              <button
                                type="button"
                                onClick={() => removeLobbyPlayer(p.peerId)}
                                className="text-stone-400 hover:text-red-500 p-1 cursor-pointer"
                                title="Keluarkan"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}

                        {mpLobbyPlayers.length < 2 && mpStatus === 'connected' && (
                          <div className="px-3 py-2.5 rounded-xl border-2 border-dashed border-stone-300 text-center text-xs font-bold text-stone-500 flex items-center justify-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                            {isId
                              ? 'Menunggu pacar/teman masuk...'
                              : 'Waiting for players to join...'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Game Mode Choice for Online Room */}
                    <div>
                      <label className="block text-[11px] font-black text-stone-600 uppercase mb-1">
                        {isId ? 'Mode Permainan' : 'Game Mode'}
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedGameMode('special')}
                          className={`py-1.5 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${
                            selectedGameMode === 'special'
                              ? 'bg-[#7B1FA2] border-[#4A148C] text-white shadow'
                              : 'bg-white border-stone-300 text-stone-700 hover:border-stone-400'
                          }`}
                        >
                          ✨ {isId ? 'Mode Seru' : 'Special'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedGameMode('classic')}
                          className={`py-1.5 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${
                            selectedGameMode === 'classic'
                              ? 'bg-[#23583A] border-[#143522] text-white shadow'
                              : 'bg-white border-stone-300 text-stone-700 hover:border-stone-400'
                          }`}
                        >
                          🥗 {isId ? 'Klasik' : 'Classic'}
                        </button>
                      </div>
                    </div>

                    {/* Deck Size Choice for Online Room */}
                    <div>
                      <label className="block text-[11px] font-black text-stone-600 uppercase mb-1">
                        {isId ? 'Jumlah Kartu (Bisa > 36 walau berdua!)' : 'Deck Size (Cards)'}
                      </label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {DECK_SIZE_CHOICES.map((opt) => (
                          <button
                            key={opt.labelId}
                            type="button"
                            onClick={() => setSelectedDeckSize(opt.value)}
                            className={`py-1.5 rounded-xl font-bold text-xs border-2 transition cursor-pointer ${
                              selectedDeckSize === opt.value
                                ? 'bg-[#D97706] border-[#92400E] text-white shadow'
                                : 'bg-white border-stone-300 text-stone-700 hover:border-stone-400'
                            }`}
                          >
                            {isId ? opt.labelId : opt.labelEn}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={mpLobbyPlayers.length < 2 || mpStatus !== 'connected'}
                      onClick={() => {
                        Sound.confirmAction(soundEnabled);
                        startOnlineGame(selectedDeckSize, selectedGameMode);
                      }}
                      className={`w-full py-3.5 rounded-2xl font-black text-base border-b-4 shadow-md flex items-center justify-center gap-2 transition-all ${
                        mpLobbyPlayers.length >= 2 && mpStatus === 'connected'
                          ? 'bg-[#2E7D32] hover:bg-[#256628] active:scale-[0.98] text-white border-[#1B5E20] cursor-pointer'
                          : 'bg-stone-300 text-stone-500 border-stone-400 cursor-not-allowed'
                      }`}
                    >
                      <Play className="w-5 h-5 fill-current" />
                      {isId ? 'Mulai Permainan' : 'Start Game'}
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {/* JOIN ROOM VIEW (REAL ONLINE P2P GUEST) */}
            {view === 'join-room' && (
              <motion.div
                key="join-room"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
                  <button
                    type="button"
                    onClick={handleBackToHome}
                    className="p-1.5 rounded-lg hover:bg-stone-200/70 text-stone-700 cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-lg font-black text-[#23583A]">
                    {isId ? 'Masukin Code' : 'Enter Room Code'}
                  </h2>
                </div>

                {!isGuestLobbyActive ? (
                  <form onSubmit={handleJoinSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                        {isId ? 'Nama Kamu' : 'Your Name'}
                      </label>
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        maxLength={18}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-stone-300 focus:border-[#23583A] focus:outline-none font-bold text-stone-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                        {isId ? 'Kode Room dari Host' : 'Room Code from Host'}
                      </label>
                      <input
                        type="text"
                        value={inputCode}
                        onChange={(e) => {
                          setInputCode(e.target.value.toUpperCase());
                          if (localJoinError) setLocalJoinError(null);
                          if (mpError) clearMpError();
                        }}
                        maxLength={8}
                        placeholder="CONTOH: A7K9P2"
                        className="w-full px-4 py-3 rounded-xl bg-white border-2 border-stone-300 focus:border-[#23583A] focus:outline-none font-black text-center text-2xl tracking-[0.2em] text-[#23583A] uppercase"
                      />
                      {(localJoinError || mpError) && (
                        <p className="text-xs font-bold text-red-600 mt-1.5 text-center">
                          {localJoinError ?? mpError}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={mpStatus === 'connecting'}
                      className="w-full py-3.5 rounded-2xl bg-[#23583A] hover:bg-[#1B462E] active:scale-[0.98] disabled:opacity-70 text-white font-black text-base border-b-4 border-[#143522] shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {mpStatus === 'connecting' ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{isId ? 'Menghubungkan...' : 'Connecting...'}</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-5 h-5" />
                          <span>{isId ? 'Gabung Room' : 'Join Room'}</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Guest Waiting Lobby */
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-3 text-center">
                      <div className="text-[11px] font-bold text-emerald-700 uppercase">
                        {isId ? 'Berhasil Masuk Room' : 'Connected to Room'}
                      </div>
                      <div className="text-2xl font-black tracking-[0.2em] text-[#23583A]">
                        {roomCode}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-xs font-black text-stone-600 uppercase">
                        {isId ? 'Pemain di Room' : 'Players in Room'} ({mpLobbyPlayers.length}/4)
                      </div>
                      {mpLobbyPlayers.map((p) => (
                        <div
                          key={p.peerId}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-stone-200 shadow-2xs"
                        >
                          <span className="text-base">
                            {p.isHost ? (
                              <Crown className="w-4 h-4 text-amber-500" />
                            ) : p.isBot ? (
                              '🤖'
                            ) : (
                              '🥗'
                            )}
                          </span>
                          <span className="font-bold text-sm text-stone-800 truncate">
                            {p.name}
                          </span>
                          {p.isHost && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                              HOST
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="py-3 px-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 font-bold text-xs flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                      <span>
                        {mpHostDisconnected
                          ? isId
                            ? 'Koneksi Host terputus, menunggu Host kembali...'
                            : 'Host disconnected, waiting for Host to return...'
                          : isId
                            ? 'Menunggu Host memulai permainan...'
                            : 'Waiting for Host to start the game...'}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-3 text-xs font-bold text-stone-700/80 z-10">
        Sayur Heryana • Online & Solo • 2–4 {isId ? 'Pemain' : 'Players'}
      </footer>
    </div>
  );
};
