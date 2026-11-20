import { Card, MarketState } from './types';

/**
 * Finds the index of the pile to draw from when pile `p` is empty:
 * "Jika tumpukan itu sudah habis, ambil kartu teratas dari tumpukan terbesar yang masih ada.
 *  Jika ada beberapa yang terbesar, pilih bernomor paling kecil (0 < 1 < 2)."
 * Returns -1 if all piles are empty.
 */
export function getDrawPileIndex(piles: readonly Card[][], preferredPileIndex: number): number {
  if (piles[preferredPileIndex] && piles[preferredPileIndex].length > 0) {
    return preferredPileIndex;
  }

  // Find max length among all piles
  let maxLen = 0;
  for (let i = 0; i < piles.length; i++) {
    if (piles[i].length > maxLen) {
      maxLen = piles[i].length;
    }
  }

  if (maxLen === 0) {
    return -1; // All piles are empty
  }

  // Pick lowest index with max length
  for (let i = 0; i < piles.length; i++) {
    if (piles[i].length === maxLen) {
      return i;
    }
  }

  return -1;
}

/**
 * Pure market refill following authentic Point Salad rules:
 * Refill order: Column 0, 1, then 2.
 * Within each column:
 * - When a veggie (resource) slot is empty, the face-up scoring card (plate) at the top
 *   of that same column flips over and drops down into the veggie slot, and the next card
 *   from that column's pile is revealed as the new scoring card.
 * - If that column's scoring slot & pile are empty, draw from the largest remaining pile
 *   (lowest index tiebreak).
 * - Finally, if the scoring slot is empty, reveal a new card from that pile (or largest remaining pile).
 * - If all piles are empty, remaining empty slots stay null.
 */
export function refillMarket(currentMarket: MarketState): MarketState {
  // Deep clone piles and slots so the operation is strictly pure
  const piles: [Card[], Card[], Card[]] = [
    [...currentMarket.piles[0]],
    [...currentMarket.piles[1]],
    [...currentMarket.piles[2]],
  ];
  const scoringSlots: (Card | null)[] = [...currentMarket.scoringSlots];
  const resourceSlots: (Card | null)[] = [...currentMarket.resourceSlots];

  // Helper to draw a single card from pileIdx or largest remaining pile
  const drawFromPile = (pileIdx: number): Card | null => {
    const targetPile = getDrawPileIndex(piles, pileIdx);
    if (targetPile === -1) {
      return null;
    }
    return piles[targetPile].shift() ?? null;
  };

  // Helper to refill a veggie slot in column `col`:
  // The face-up scoring card in `col` drops down into the veggie slot first!
  const dropToResourceSlot = (col: number): Card | null => {
    if (scoringSlots[col] !== null) {
      const droppedCard = scoringSlots[col]!;
      scoringSlots[col] = piles[col].length > 0 ? (piles[col].shift() ?? null) : null;
      return droppedCard;
    }
    return drawFromPile(col);
  };

  // Iterate column by column: 0, 1, 2
  for (let col = 0; col < 3; col++) {
    // 1. First Resource slot of column `col`
    const resSlot1 = col * 2;
    if (resourceSlots[resSlot1] === null) {
      const dropped = dropToResourceSlot(col);
      if (dropped) {
        resourceSlots[resSlot1] = dropped;
      }
    }

    // 2. Second Resource slot of column `col`
    const resSlot2 = col * 2 + 1;
    if (resourceSlots[resSlot2] === null) {
      const dropped = dropToResourceSlot(col);
      if (dropped) {
        resourceSlots[resSlot2] = dropped;
      }
    }

    // 3. Scoring slot of column `col`
    if (scoringSlots[col] === null) {
      const drawn = drawFromPile(col);
      if (drawn) {
        scoringSlots[col] = drawn;
      }
    }
  }

  return {
    piles,
    scoringSlots,
    resourceSlots,
  };
}

/**
 * Checks whether the entire market is completely exhausted (all piles and slots empty).
 */
export function isMarketCompletelyEmpty(market: MarketState): boolean {
  const allPilesEmpty = market.piles.every((pile) => pile.length === 0);
  const allScoringEmpty = market.scoringSlots.every((slot) => slot === null);
  const allResourcesEmpty = market.resourceSlots.every((slot) => slot === null);
  return allPilesEmpty && allScoringEmpty && allResourcesEmpty;
}
