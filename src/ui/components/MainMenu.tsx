import React, { useState } from 'react';
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
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { VeggieIcon } from './icons/SpiceIcon';
import { Sound } from '../sound/soundEffects';
import { ResourceId } from '../../engine/types';

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

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const MainMenu: React.FC = () => {
  const {
    lang,
    setLang,
    soundEnabled,
    toggleSound,
    startNewGame,
    setScreen,
    setRoomCode,
  } = useGameStore();

  const [view, setView] = useState<MenuView>('home');
  const [playerName, setPlayerName] = useState<string>('Pemain 1');

  // Bot setup state
  const [botCount, setBotCount] = useState<number>(1);
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'greedy'>('greedy');

  // Open Room state
  const [createdCode, setCreatedCode] = useState<string>(() => generateRoomCode());
  const [copied, setCopied] = useState<boolean>(false);

  // Join Room state
  const [inputCode, setInputCode] = useState<string>('');
  const [joinStatus, setJoinStatus] = useState<string | null>(null);

  const isId = lang === 'id';

  const handleOpenRoomView = () => {
    Sound.cardSelect(soundEnabled);
    setCreatedCode(generateRoomCode());
    setCopied(false);
    setView('open-room');
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(createdCode);
      setCopied(true);
      Sound.confirmAction(soundEnabled);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleStartBotGame = () => {
    Sound.confirmAction(soundEnabled);
    const botNames = ['Bot Tomat', 'Bot Wortel', 'Bot Kubis', 'Bot Paprika', 'Bot Selada'];
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

    setRoomCode(null);
    startNewGame({
      players,
      seed: Math.floor(Math.random() * 1000000),
    });
    setScreen('game');
  };

  const handleStartRoomDemo = (code: string) => {
    Sound.confirmAction(soundEnabled);
    setRoomCode(code);
    startNewGame({
      players: [
        {
          id: 'p1',
          name: playerName.trim() || (isId ? 'Pemain 1' : 'Player 1'),
          isBot: false,
        },
        {
          id: 'p2',
          name: isId ? 'Pemain 2' : 'Player 2',
          isBot: false,
        },
      ],
      seed: Math.floor(Math.random() * 1000000),
    });
    setScreen('game');
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = inputCode.trim().toUpperCase();
    if (cleaned.length < 4) {
      setJoinStatus(
        isId
          ? 'Masukkan kode room minimal 4 karakter.'
          : 'Please enter a room code (at least 4 characters).'
      );
      return;
    }
    setJoinStatus(null);
    handleStartRoomDemo(cleaned);
  };

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
          onClick={() => {
            toggleSound();
          }}
          className="w-10 h-10 rounded-xl bg-white/85 hover:bg-white text-[#23583A] border border-stone-300 flex items-center justify-center shadow-sm transition active:scale-95 cursor-pointer"
          title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
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
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-10 z-10">
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
                  onClick={handleOpenRoomView}
                  className="relative overflow-hidden w-full group flex items-center gap-4 p-4 rounded-2xl bg-[#D97706] hover:bg-[#B45309] active:scale-[0.98] text-white border-b-4 border-[#92400E] shadow-md transition-all cursor-pointer text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform z-10">
                    <DoorOpen className="w-7 h-7" />
                  </div>
                  <div className="flex-1 z-10 pr-8">
                    <div className="text-lg sm:text-xl font-black leading-tight">
                      {isId ? 'Open Room' : 'Open Room'}
                    </div>
                    <div className="text-xs text-amber-100 font-medium">
                      {isId
                        ? 'Buat ruangan baru & bagikan kode ke pacar/teman'
                        : 'Create a room & share the code with friends'}
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
                    setJoinStatus(null);
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
                        ? 'Gabung ke room yang sudah dibuat'
                        : 'Join an existing room with a code'}
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
                    onClick={() => setView('home')}
                    className="p-1.5 rounded-lg hover:bg-stone-200/70 text-stone-700 cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-lg font-black text-[#23583A]">
                    {isId ? 'Main sama Bot' : 'Play vs Bot'}
                  </h2>
                </div>

                {/* Player Name */}
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

                {/* Bot Count */}
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1.5">
                    {isId ? 'Jumlah Bot' : 'Number of Bots'}
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setBotCount(count)}
                        className={`py-2 rounded-xl font-bold text-xs sm:text-sm border-2 transition cursor-pointer ${
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

                {/* Bot Difficulty */}
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

            {/* OPEN ROOM VIEW */}
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
                    onClick={() => setView('home')}
                    className="p-1.5 rounded-lg hover:bg-stone-200/70 text-stone-700 cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-lg font-black text-[#B45309]">
                    {isId ? 'Open Room' : 'Open Room'}
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-stone-300 focus:border-[#D97706] focus:outline-none font-bold text-stone-800"
                  />
                </div>

                {/* Room Code Box */}
                <div className="bg-amber-50 border-2 border-dashed border-amber-400 rounded-2xl p-4 text-center">
                  <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                    {isId ? 'Kode Room Kamu' : 'Your Room Code'}
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl font-black tracking-[0.2em] text-[#23583A]">
                      {createdCode}
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
                  <p className="text-[11px] text-amber-700 mt-2 flex items-center justify-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {isId
                      ? 'Bagikan kode ini ke pacar/teman untuk bergabung'
                      : 'Share this code with your partner/friends to join'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartRoomDemo(createdCode)}
                  className="w-full py-3.5 rounded-2xl bg-[#D97706] hover:bg-[#B45309] active:scale-[0.98] text-white font-black text-base border-b-4 border-[#92400E] shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  {isId ? 'Masuk ke Room' : 'Enter Room'}
                </button>
              </motion.div>
            )}

            {/* JOIN ROOM VIEW */}
            {view === 'join-room' && (
              <motion.form
                key="join-room"
                onSubmit={handleJoinSubmit}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
                  <button
                    type="button"
                    onClick={() => setView('home')}
                    className="p-1.5 rounded-lg hover:bg-stone-200/70 text-stone-700 cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-lg font-black text-[#23583A]">
                    {isId ? 'Masukin Code' : 'Enter Room Code'}
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-stone-300 focus:border-[#23583A] focus:outline-none font-bold text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
                    {isId ? 'Kode Room' : 'Room Code'}
                  </label>
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => {
                      setInputCode(e.target.value.toUpperCase());
                      if (joinStatus) setJoinStatus(null);
                    }}
                    maxLength={8}
                    placeholder="CONTOH: A7K9P2"
                    className="w-full px-4 py-3 rounded-xl bg-white border-2 border-stone-300 focus:border-[#23583A] focus:outline-none font-black text-center text-2xl tracking-[0.2em] text-[#23583A] uppercase"
                  />
                  {joinStatus && (
                    <p className="text-xs font-bold text-red-600 mt-1.5 text-center">
                      {joinStatus}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-[#23583A] hover:bg-[#1B462E] active:scale-[0.98] text-white font-black text-base border-b-4 border-[#143522] shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-5 h-5" />
                  {isId ? 'Gabung Room' : 'Join Room'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-3 text-xs font-bold text-stone-700/80 z-10">
        Sayur Heryana • 2–6 {isId ? 'Pemain' : 'Players'}
      </footer>
    </div>
  );
};
