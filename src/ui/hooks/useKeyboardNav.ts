import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export const useKeyboardNav = () => {
  const {
    gameState,
    selectedResourceSlots,
    selectResourceSlot,
    confirmTakeResources,
    takeScoringMarket,
    takeScoringPile,
    endTurn,
    setSettingsOpen,
    isSettingsOpen,
  } = useGameStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if focused in an input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Escape') {
        if (isSettingsOpen) {
          setSettingsOpen(false);
          return;
        }
      }

      if (gameState.phase === 'game_over') return;

      const key = e.key.toLowerCase();

      // 1. Scoring card / Pile shortcuts: 1, 2, 3
      if (['1', '2', '3'].includes(key) && !gameState.hasTakenMainActionThisTurn) {
        const slotIdx = parseInt(key) - 1;
        if (gameState.market.scoringSlots[slotIdx]) {
          takeScoringMarket(slotIdx);
        } else if (gameState.market.piles[slotIdx].length > 0) {
          takeScoringPile(slotIdx);
        }
        return;
      }

      // 2. Resource card shortcuts:
      // Q, W, E for Top Veggie Row (cols 1, 2, 3 -> slots 0, 2, 4)
      // A, S, D for Bottom Veggie Row (cols 1, 2, 3 -> slots 1, 3, 5)
      const resourceKeyMap: Record<string, number> = {
        q: 0,
        w: 2,
        e: 4,
        a: 1,
        s: 3,
        d: 5,
        // Legacy aliases
        r: 1,
        t: 3,
        y: 5,
      };

      if (key in resourceKeyMap && !gameState.hasTakenMainActionThisTurn) {
        const slotIdx = resourceKeyMap[key];
        selectResourceSlot(slotIdx);
        return;
      }

      // 3. Confirm or End Turn: Space / Enter
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        if (!gameState.hasTakenMainActionThisTurn) {
          const availableCount = gameState.market.resourceSlots.filter(Boolean).length;
          const allPilesEmpty = gameState.market.piles.every((p) => p.length === 0);
          const needed = availableCount === 1 && allPilesEmpty ? 1 : 2;

          if (selectedResourceSlots.length === needed) {
            confirmTakeResources();
          }
        } else {
          // Main action already taken: end turn!
          endTurn();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    gameState,
    selectedResourceSlots,
    selectResourceSlot,
    confirmTakeResources,
    takeScoringMarket,
    takeScoringPile,
    endTurn,
    setSettingsOpen,
    isSettingsOpen,
  ]);
};
