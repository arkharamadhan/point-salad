import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, X } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

const QUICK_EMOJIS = ['😂', '😱', '🥺', '❤️', '🔥', '😈'];

const QUICK_CHATS_ID = [
  { emoji: '🥺', text: 'Jangan diambil dong!' },
  { emoji: '😱', text: 'Yah ketikung!' },
  { emoji: '😈', text: 'Hehehe aman!' },
  { emoji: '⏳', text: 'Lama mikirnya~' },
  { emoji: '🔥', text: 'Mantap!' },
  { emoji: '👋', text: 'Gantian dong!' },
];

const QUICK_CHATS_EN = [
  { emoji: '🥺', text: "Don't take that!" },
  { emoji: '😱', text: 'Stolen right from me!' },
  { emoji: '😈', text: 'Hehehe mine!' },
  { emoji: '⏳', text: 'Thinking so long~' },
  { emoji: '🔥', text: 'Nice move!' },
  { emoji: '👋', text: 'Your turn!' },
];

const SENDER_BADGE_BG = [
  'bg-[#2E7D32] border-[#1B5E20]',
  'bg-[#C0A018] border-[#8D6E00]',
  'bg-[#7B1FA2] border-[#4A148C]',
  'bg-[#E65100] border-[#BF360C]',
];

export const EmoteBar: React.FC = () => {
  const { activeReactions, sendReaction, lang } = useGameStore();
  const [isOpen, setIsOpen] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  const isId = lang === 'id';
  const quickChats = isId ? QUICK_CHATS_ID : QUICK_CHATS_EN;

  const triggerSend = (emoji: string, text?: string) => {
    if (cooldown) return;
    sendReaction(emoji, text);
    setIsOpen(false);
    setCooldown(true);
    window.setTimeout(() => setCooldown(false), 1000);
  };

  return (
    <>
      {/* Floating Reaction Bubbles Overlay */}
      <div className="pointer-events-none fixed bottom-36 sm:bottom-40 right-3 sm:right-6 z-50 flex flex-col items-end gap-2 max-w-[260px]">
        <AnimatePresence>
          {activeReactions.map((rx) => {
            const badgeStyle = SENDER_BADGE_BG[rx.senderIndex % SENDER_BADGE_BG.length];
            return (
              <motion.div
                key={rx.id}
                initial={{ opacity: 0, y: 26, scale: 0.65 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -28, scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                className="flex items-center gap-2 bg-[#FFFDF8]/95 backdrop-blur-sm border-2 border-[#C9A46E] rounded-2xl px-3 py-2 shadow-xl font-fredoka"
              >
                <span className="text-2xl sm:text-3xl leading-none">{rx.emoji}</span>
                <div className="flex flex-col min-w-0">
                  <span
                    className={`inline-block self-start text-[9px] font-black text-white px-1.5 py-0.5 rounded-md border leading-none mb-0.5 ${badgeStyle}`}
                  >
                    {rx.senderName}
                  </span>
                  {rx.text && (
                    <span className="text-xs sm:text-sm font-black text-stone-800 leading-tight">
                      {rx.text}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Bottom-Right Floating Emote Picker Trigger & Popover */}
      <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-40 font-fredoka">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              className="absolute bottom-12 right-0 w-64 sm:w-72 bg-[#FFFDF8] border-[3px] border-[#C9A46E] rounded-3xl p-3 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-black text-[#23583A] uppercase tracking-wide">
                  {isId ? 'Reaksi Cepat' : 'Quick Reactions'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 6 Quick Emojis */}
              <div className="grid grid-cols-6 gap-1 mb-2.5">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    disabled={cooldown}
                    onClick={() => triggerSend(emoji)}
                    className="h-9 rounded-xl bg-[#FFF8EB] hover:bg-[#F5E6C8] active:scale-90 border border-[#E5D2B0] flex items-center justify-center text-xl transition cursor-pointer disabled:opacity-50"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* 6 Quick Chat Phrases */}
              <div className="grid grid-cols-2 gap-1.5">
                {quickChats.map((item) => (
                  <button
                    key={item.text}
                    type="button"
                    disabled={cooldown}
                    onClick={() => triggerSend(item.emoji, item.text)}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#E8F5E9] active:scale-95 border border-stone-200 hover:border-[#7CB342] text-left text-[11px] font-bold text-stone-700 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <span className="shrink-0">{item.emoji}</span>
                    <span className="truncate">{item.text}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-white shadow-lg border transition-transform active:scale-95 cursor-pointer ${
            isOpen
              ? 'bg-[#D97706] border-[#92400E]'
              : 'bg-[#2E7D32] hover:bg-[#256628] border-[#1B5E20]'
          }`}
          title={isId ? 'Kirim Emoji & Quick Chat' : 'Send Emoji & Quick Chat'}
        >
          <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </>
  );
};
