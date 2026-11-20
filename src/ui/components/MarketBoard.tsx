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
    <div className="w-full max-w-5xl mx-auto bg-stone-900/90 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between pb-4 mb-4 border-b border-stone-800 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-base sm:text-lg font-bold text-amber-100 font-cinzel tracking-wide">
            PASAR BERSAMA (MARKET)
          </h2>
        </div>

        {/* Action instruction or confirmation button */}
        {isActionAllowed ? (
          <div className="flex items-center gap-2">
            {canConfirmResources ? (
              <button
                onClick={handleConfirmResources}
                className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center gap-1.5 cursor-pointer"
              >
                <span>✓</span> Ambil {selectedResourceSlots.length} Rempah Terpilih
              </button>
            ) : (
              <div className="text-xs sm:text-sm font-medium text-amber-200/80 bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-800/40">
                Pilih <strong className="text-emerald-400">2 kartu Rempah</strong> ATAU <strong className="text-amber-400">1 kartu Skor</strong>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-stone-400 italic">
            {phase === 'game_over'
              ? 'Permainan telah usai.'
              : 'Aksi utama telah selesai. Anda dapat membalik kartu atau mengakhiri giliran.'}
          </div>
        )}
      </div>

      {/* Market Grid: 3 columns (one for each Pile) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {[0, 1, 2].map((pileIndex) => {
          const pile = market.piles[pileIndex];
          const scoringCard = market.scoringSlots[pileIndex];
          const resCard1 = market.resourceSlots[pileIndex * 2];
          const resCard2 = market.resourceSlots[pileIndex * 2 + 1];

          const resSlotIndex1 = pileIndex * 2;
          const resSlotIndex2 = pileIndex * 2 + 1;

          return (
            <div
              key={pileIndex}
              className="bg-stone-950/60 border border-stone-800/80 rounded-xl p-3 flex flex-col gap-3 shadow-inner"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-stone-400 px-1 font-cinzel">
                <span>Tumpukan {pileIndex + 1}</span>
                <span className="text-[11px] text-stone-500 font-mono">
                  {pile.length} kartu tersisa
                </span>
              </div>

              {/* Top Row: Draw Pile + Scoring Slot */}
              <div className="grid grid-cols-2 gap-2 justify-items-center">
                {/* Draw Pile (Blind Skor Draft) */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-stone-400 font-medium">Tumpukan (Buta)</span>
                  {pile.length > 0 ? (
                    <CardView
                      side="back"
                      pileCount={pile.length}
                      isSelectable={isActionAllowed}
                      onClick={isActionAllowed ? () => handleTakeScoringPile(pileIndex) : undefined}
                      className="hover:border-amber-400"
                    />
                  ) : (
                    <div className="w-28 h-40 sm:w-32 sm:h-44 md:w-36 md:h-52 rounded-xl border-2 border-dashed border-stone-800 flex items-center justify-center text-xs text-stone-600 font-mono">
                      Habis
                    </div>
                  )}
                </div>

                {/* Scoring Slot (Face-up) */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-stone-400 font-medium">Slot Skor Terbuka</span>
                  {scoringCard ? (
                    <CardView
                      card={scoringCard}
                      side="scoring"
                      lang={lang}
                      keyboardBadge={`[${pileIndex + 1}]`}
                      isSelectable={isActionAllowed}
                      onClick={isActionAllowed ? () => handleTakeScoringMarket(pileIndex) : undefined}
                    />
                  ) : (
                    <div className="w-28 h-40 sm:w-32 sm:h-44 md:w-36 md:h-52 rounded-xl border-2 border-dashed border-stone-800 flex items-center justify-center text-xs text-stone-600 font-mono">
                      Kosong
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row: 2 Resource Slots */}
              <div className="mt-1 pt-2 border-t border-stone-800/80 flex flex-col gap-1">
                <span className="text-[10px] text-stone-400 font-medium px-1">
                  Slot Rempah Terbuka
                </span>
                <div className="grid grid-cols-2 gap-2 justify-items-center">
                  {/* Resource 1 */}
                  {resCard1 ? (
                    <CardView
                      card={resCard1}
                      side="resource"
                      lang={lang}
                      keyboardBadge={['Q', 'E', 'T'][pileIndex]}
                      isSelectable={isActionAllowed}
                      isSelected={selectedResourceSlots.includes(resSlotIndex1)}
                      onClick={isActionAllowed ? () => selectResourceSlot(resSlotIndex1) : undefined}
                    />
                  ) : (
                    <div className="w-28 h-40 sm:w-32 sm:h-44 md:w-36 md:h-52 rounded-xl border-2 border-dashed border-stone-800 flex items-center justify-center text-xs text-stone-600 font-mono">
                      Kosong
                    </div>
                  )}

                  {/* Resource 2 */}
                  {resCard2 ? (
                    <CardView
                      card={resCard2}
                      side="resource"
                      lang={lang}
                      keyboardBadge={['W', 'R', 'Y'][pileIndex]}
                      isSelectable={isActionAllowed}
                      isSelected={selectedResourceSlots.includes(resSlotIndex2)}
                      onClick={isActionAllowed ? () => selectResourceSlot(resSlotIndex2) : undefined}
                    />
                  ) : (
                    <div className="w-28 h-40 sm:w-32 sm:h-44 md:w-36 md:h-52 rounded-xl border-2 border-dashed border-stone-800 flex items-center justify-center text-xs text-stone-600 font-mono">
                      Kosong
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Keyboard Shortcut Banner */}
      <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-500">
        <span className="flex items-center gap-1.5">
          <span>⌨️</span>
          <span>
            Shortcut Keyboard: Tekan <kbd className="bg-stone-800 text-stone-300 px-1 py-0.5 rounded font-mono">[1-3]</kbd> untuk Skor, <kbd className="bg-stone-800 text-stone-300 px-1 py-0.5 rounded font-mono">[Q-Y]</kbd> untuk Rempah, <kbd className="bg-stone-800 text-stone-300 px-1 py-0.5 rounded font-mono">[Spasi / Enter]</kbd> untuk Konfirmasi.
          </span>
        </span>
      </div>
    </div>
  );
};
