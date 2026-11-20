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
 * Pure market refill following RULES.md Section 4:
 * Refill order: Pile 0, 1, then 2.
 * Within each pile: Refill Resource slots first (slot 0 then 1), then Scoring slot.
 * If pile is empty, draw from largest remaining pile (lowest index tiebreak).
 * If all piles are empty, slot remains empty (null).
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

  // Helper to draw a single card
  const drawCard = (pileIdx: number): Card | null => {
    const targetPile = getDrawPileIndex(piles, pileIdx);
    if (targetPile === -1) {
      return null;
    }
    const card = piles[targetPile].shift();
    return card ?? null;
  };

  // Iterate pile by pile: 0, 1, 2
  for (let p = 0; p < 3; p++) {
    // 1. First Resource slot of pile p
    const resSlot1 = p * 2;
    if (resourceSlots[resSlot1] === null) {
      const drawn = drawCard(p);
      if (drawn) {
        resourceSlots[resSlot1] = drawn;
      }
    }

    // 2. Second Resource slot of pile p
    const resSlot2 = p * 2 + 1;
    if (resourceSlots[resSlot2] === null) {
      const drawn = drawCard(p);
      if (drawn) {
        resourceSlots[resSlot2] = drawn;
      }
    }

    // 3. Scoring slot of pile p
    if (scoringSlots[p] === null) {
      const drawn = drawCard(p);
      if (drawn) {
        scoringSlots[p] = drawn;
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
