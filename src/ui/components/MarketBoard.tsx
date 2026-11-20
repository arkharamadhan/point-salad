import React from 'react';
import { useGameStore } from '../store/gameStore';
import { CardView } from './CardView';
import { Sound } from '../sound/soundEffects';

export const MarketBoard: React.FC = () => {
  const {
    gameState,
    selectedResourceSlots,
    selectResourceSlot,
    confirmTakeResources,
    takeScoringMarket,
    takeScoringPile,
    lang,
    soundEnabled,
  } = useGameStore();

  const handleConfirmResources = () => {
    Sound.confirmAction(soundEnabled);
    confirmTakeResources();
  };

  const handleTakeScoringMarket = (slotIndex: number) => {
    Sound.cardDraw(soundEnabled);
    takeScoringMarket(slotIndex);
  };

  const handleTakeScoringPile = (pileIndex: number) => {
    Sound.cardDraw(soundEnabled);
    takeScoringPile(pileIndex);
  };

  const { market, hasTakenMainActionThisTurn, phase } = gameState;
  const isActionAllowed = phase !== 'game_over' && !hasTakenMainActionThisTurn;

  const availableResourceCount = market.resourceSlots.filter(Boolean).length;
  const allPilesEmpty = market.piles.every((p) => p.length === 0);
  const neededResourcesCount = availableResourceCount === 1 && allPilesEmpty ? 1 : 2;
  const canConfirmResources =
    isActionAllowed && selectedResourceSlots.length === neededResourcesCount;

  return (
    <div className="w-full max-w-5xl mx-auto tatakan-kayu p-3 sm:p-5 md:p-6 transition-all">
      {/* Wooden Juice Groove / Tabletop Inlay */}
      <div className="tatakan-groove p-3 sm:p-4 md:p-6 flex flex-col gap-4">
        {/* Top Header bar on wood */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-3 border-b border-amber-950/60 gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl select-none">🪵</span>
            <div>
              <h2 className="text-base sm:text-xl font-black text-amber-200 font-fredoka tracking-wide drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]">
                PASAR BERSAMA (MARKET TABLE)
              </h2>
              <p className="text-[10px] sm:text-xs text-amber-300/70">
                Pilih <strong className="text-lime-300 font-bold">2 kartu Sayur</strong> ATAU{' '}
                <strong className="text-amber-300 font-bold">1 kartu Resep Poin</strong>
              </p>
            </div>
          </div>

          {/* Action Instruction / Confirm Button */}
          {isActionAllowed ? (
            <div className="flex items-center gap-2">
              {canConfirmResources ? (
                <button
                  onClick={handleConfirmResources}
                  className="bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 text-white font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer font-fredoka border border-lime-400/60 animate-pulse"
                >
                  <span>✓</span> Ambil {selectedResourceSlots.length} Sayur Terpilih
                </button>
              ) : (
                <div className="text-xs sm:text-sm font-bold text-amber-200/90 bg-black/40 px-3.5 py-1.5 rounded-xl border border-amber-900/60 shadow-inner font-fredoka">
                  {selectedResourceSlots.length === 1 ? (
                    <span className="text-lime-300">Pilih 1 kartu Sayur lagi...</span>
                  ) : (
                    <span>Klik 2 Sayur atau 1 Resep Poin</span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-amber-300/60 italic bg-black/30 px-3 py-1 rounded-lg border border-amber-900/30">
              {phase === 'game_over'
                ? 'Permainan telah selesai.'
                : 'Aksi utama selesai. Klik "Selesai Giliran" di bawah.'}
            </div>
          )}
        </div>

        {/* 1. TOP SHELF: 3 TUMPUKAN DEK (DRAW PILES) */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-amber-400 select-none">🂠</span>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-300/80 font-fredoka">
              3 Tumpukan Dek (Ambil Buta)
            </span>
            <div className="h-[1px] bg-amber-900/50 flex-1 ml-2" />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 justify-items-center">
            {[0, 1, 2].map((pileIndex) => {
              const pile = market.piles[pileIndex];

              return (
                <div key={pileIndex} className="flex flex-col items-center gap-1.5 w-full">
                  {/* Pile Info Bar */}
                  <div className="flex items-center justify-between w-full max-w-[140px] px-1 text-[11px] font-black font-fredoka text-amber-200/90">
                    <span>Tumpukan {pileIndex + 1}</span>
                    <span className="text-[10px] text-amber-300 font-mono bg-black/50 px-2 py-0.5 rounded-full border border-amber-800/60 shadow">
                      {pile.length}
                    </span>
                  </div>

                  {/* 3D Stacked Deck Card */}
                  {pile.length > 0 ? (
                    <div
                      onClick={isActionAllowed ? () => handleTakeScoringPile(pileIndex) : undefined}
                      className={`relative group ${isActionAllowed ? 'cursor-pointer' : ''}`}
                      title={`Ambil kartu skor buta dari Tumpukan ${pileIndex + 1}`}
                    >
                      {/* 3D Card Thickness Layers */}
                      {pile.length > 2 && (
                        <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-[#558B2F] rounded-2xl border-2 border-black/80 pointer-events-none opacity-70" />
                      )}
                      {pile.length > 1 && (
                        <div className="absolute inset-0 translate-x-0.5 translate-y-0.5 bg-[#689F38] rounded-2xl border-2 border-black/80 pointer-events-none opacity-85" />
                      )}

                      <CardView
                        side="back"
                        pileCount={pile.length}
                        isSelectable={isActionAllowed}
                        className="relative z-10 transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-2xl"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-34 sm:w-28 sm:h-40 md:w-32 md:h-46 rounded-2xl border-2 border-dashed border-amber-900/40 bg-black/25 flex flex-col items-center justify-center text-xs text-amber-700/60 font-fredoka shadow-inner select-none">
                      <span>Tumpukan</span>
                      <span>Habis</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. BARIS PERTAMA: 3 RESEP POIN (SCORING CARDS ROW) */}
        <div>
          <div className="flex items-center gap-2 mb-2 mt-1">
            <span className="text-xs text-amber-400 select-none">🎯</span>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 font-fredoka">
              Baris Resep Poin (3 Kolom Terbuka)
            </span>
            <div className="h-[1px] bg-amber-900/50 flex-1 ml-2" />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 justify-items-center">
            {[0, 1, 2].map((colIndex) => {
              const scoringCard = market.scoringSlots[colIndex];

              return (
                <div key={colIndex} className="flex flex-col items-center gap-1 w-full">
                  <span className="text-[10px] font-bold text-amber-300/60 font-fredoka">
                    Resep Kolom {colIndex + 1}
                  </span>

                  {scoringCard ? (
                    <CardView
                      card={scoringCard}
                      side="scoring"
                      lang={lang}
                      keyboardBadge={`[${colIndex + 1}]`}
                      isSelectable={isActionAllowed}
                      onClick={
                        isActionAllowed ? () => handleTakeScoringMarket(colIndex) : undefined
                      }
                      className="transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl"
                    />
                  ) : (
                    <div className="w-24 h-34 sm:w-28 sm:h-40 md:w-32 md:h-46 rounded-2xl border-2 border-dashed border-amber-900/40 bg-black/25 flex flex-col items-center justify-center text-xs text-amber-700/60 font-fredoka shadow-inner select-none">
                      <span>Resep</span>
                      <span>Kosong</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. BARIS KEDUA & KETIGA: PASAR SAYUR (6 SAYUR TERBUKA) */}
        <div>
          <div className="flex items-center gap-2 mb-2 mt-1">
            <span className="text-xs text-lime-400 select-none">🥗</span>
            <span className="text-[11px] font-black uppercase tracking-wider text-lime-400 font-fredoka">
              Pasar Sayur (2 Baris x 3 Kolom)
            </span>
            <div className="h-[1px] bg-lime-900/40 flex-1 ml-2" />
          </div>

          {/* Baris Sayur 1 (Row A) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 justify-items-center mb-3">
            {[0, 1, 2].map((colIndex) => {
              const slotIndex = colIndex * 2;
              const resCard = market.resourceSlots[slotIndex];
              const shortcutBadge = ['Q', 'W', 'E'][colIndex];

              return (
                <div key={slotIndex} className="flex flex-col items-center gap-1 w-full">
                  {resCard ? (
                    <CardView
                      card={resCard}
                      side="resource"
                      lang={lang}
                      keyboardBadge={`[${shortcutBadge}]`}
                      isSelectable={isActionAllowed}
                      isSelected={selectedResourceSlots.includes(slotIndex)}
                      onClick={
                        isActionAllowed ? () => selectResourceSlot(slotIndex) : undefined
                      }
                      className="transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl"
                    />
                  ) : (
                    <div className="w-24 h-34 sm:w-28 sm:h-40 md:w-32 md:h-46 rounded-2xl border-2 border-dashed border-amber-900/40 bg-black/25 flex flex-col items-center justify-center text-xs text-amber-700/60 font-fredoka shadow-inner select-none">
                      <span>Sayur</span>
                      <span>Kosong</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Baris Sayur 2 (Row B) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 justify-items-center">
            {[0, 1, 2].map((colIndex) => {
              const slotIndex = colIndex * 2 + 1;
              const resCard = market.resourceSlots[slotIndex];
              const shortcutBadge = ['A', 'S', 'D'][colIndex];

              return (
                <div key={slotIndex} className="flex flex-col items-center gap-1 w-full">
                  {resCard ? (
                    <CardView
                      card={resCard}
                      side="resource"
                      lang={lang}
                      keyboardBadge={`[${shortcutBadge}]`}
                      isSelectable={isActionAllowed}
                      isSelected={selectedResourceSlots.includes(slotIndex)}
                      onClick={
                        isActionAllowed ? () => selectResourceSlot(slotIndex) : undefined
                      }
                      className="transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl"
                    />
                  ) : (
                    <div className="w-24 h-34 sm:w-28 sm:h-40 md:w-32 md:h-46 rounded-2xl border-2 border-dashed border-amber-900/40 bg-black/25 flex flex-col items-center justify-center text-xs text-amber-700/60 font-fredoka shadow-inner select-none">
                      <span>Sayur</span>
                      <span>Kosong</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Navigation / Keyboard Shortcuts Hint */}
        <div className="mt-2 pt-2.5 border-t border-amber-950/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-amber-300/60 font-fredoka gap-1.5">
          <div className="flex items-center gap-2">
            <span>⌨️ Shortcut Keyboard:</span>
            <span className="text-amber-200">
              <kbd className="bg-black/40 border border-amber-800/60 px-1 py-0.5 rounded text-[10px] font-mono text-yellow-300">[1-3]</kbd> Resep Poin •{' '}
              <kbd className="bg-black/40 border border-amber-800/60 px-1 py-0.5 rounded text-[10px] font-mono text-yellow-300">[Q, W, E]</kbd> Sayur Atas •{' '}
              <kbd className="bg-black/40 border border-amber-800/60 px-1 py-0.5 rounded text-[10px] font-mono text-yellow-300">[A, S, D]</kbd> Sayur Bawah
            </span>
          </div>
          <div>
            <kbd className="bg-black/40 border border-amber-800/60 px-1.5 py-0.5 rounded text-[10px] font-mono text-yellow-300">[Spasi / Enter]</kbd> Konfirmasi
          </div>
        </div>
      </div>
    </div>
  );
};
