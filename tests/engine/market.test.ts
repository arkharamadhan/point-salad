import { describe, it, expect } from 'vitest';
import { getDrawPileIndex, isMarketCompletelyEmpty, refillMarket } from '../../src/engine/market';
import { Card, MarketState } from '../../src/engine/types';

function makeCard(id: string, resource: any = 'jahe', scoringId = 'S01'): Card {
  return { id, resource, scoringId };
}

describe('Market Refill Logic (RULES.md section 4)', () => {
  it('getDrawPileIndex picks preferred pile if non-empty', () => {
    const piles: Card[][] = [
      [makeCard('1'), makeCard('2')],
      [makeCard('3')],
      [makeCard('4'), makeCard('5'), makeCard('6')],
    ];
    expect(getDrawPileIndex(piles, 0)).toBe(0);
    expect(getDrawPileIndex(piles, 1)).toBe(1);
    expect(getDrawPileIndex(piles, 2)).toBe(2);
  });

  it('getDrawPileIndex falls back to largest pile when preferred pile is empty', () => {
    const piles: Card[][] = [
      [],
      [makeCard('3')],
      [makeCard('4'), makeCard('5'), makeCard('6')], // largest (3)
    ];
    expect(getDrawPileIndex(piles, 0)).toBe(2);
  });

  it('getDrawPileIndex breaks ties between largest piles with lowest index', () => {
    const piles: Card[][] = [
      [],
      [makeCard('a'), makeCard('b')], // pile 1 has 2
      [makeCard('c'), makeCard('d')], // pile 2 has 2
    ];
    // Both pile 1 and 2 have length 2. Preferred pile 0 is empty.
    // Lowest index among ties is 1.
    expect(getDrawPileIndex(piles, 0)).toBe(1);
  });

  it('refills empty slots in correct order (pile 1->2->3, resources then scoring)', () => {
    const market: MarketState = {
      piles: [
        [makeCard('p0_c1'), makeCard('p0_c2')],
        [makeCard('p1_c1')],
        [makeCard('p2_c1')],
      ],
      scoringSlots: [null, makeCard('s1'), makeCard('s2')],
      resourceSlots: [null, makeCard('r1'), makeCard('r2'), null, makeCard('r4'), makeCard('r5')],
    };

    // Refill will process:
    // Pile 0:
    //  - resourceSlot 0 is null -> drawn from pile 0 ('p0_c1')
    //  - resourceSlot 1 is filled
    //  - scoringSlot 0 is null -> drawn from pile 0 ('p0_c2')
    // Pile 1:
    //  - resourceSlot 2 is filled
    //  - resourceSlot 3 is null -> drawn from pile 1 ('p1_c1')
    //  - scoringSlot 1 is filled
    // Pile 2:
    //  - resourceSlot 4 is filled
    //  - resourceSlot 5 is filled
    //  - scoringSlot 2 is filled

    const refilled = refillMarket(market);

    expect(refilled.resourceSlots[0]?.id).toBe('p0_c1');
    expect(refilled.scoringSlots[0]?.id).toBe('p0_c2');
    expect(refilled.resourceSlots[3]?.id).toBe('p1_c1');

    expect(refilled.piles[0]).toHaveLength(0);
    expect(refilled.piles[1]).toHaveLength(0);
    expect(refilled.piles[2]).toHaveLength(1);
  });

  it('leaves slots empty if all draw piles are exhausted', () => {
    const market: MarketState = {
      piles: [[], [], []],
      scoringSlots: [null, null, makeCard('s2')],
      resourceSlots: [null, null, null, null, null, null],
    };

    const refilled = refillMarket(market);
    expect(refilled.scoringSlots[0]).toBeNull();
    expect(refilled.scoringSlots[1]).toBeNull();
    expect(refilled.scoringSlots[2]?.id).toBe('s2');
    expect(refilled.resourceSlots.every((s) => s === null)).toBe(true);
  });

  it('isMarketCompletelyEmpty returns true only when all piles and slots are empty', () => {
    expect(
      isMarketCompletelyEmpty({
        piles: [[], [], []],
        scoringSlots: [null, null, null],
        resourceSlots: [null, null, null, null, null, null],
      })
    ).toBe(true);

    expect(
      isMarketCompletelyEmpty({
        piles: [[], [], []],
        scoringSlots: [makeCard('1'), null, null],
        resourceSlots: [null, null, null, null, null, null],
      })
    ).toBe(false);

    expect(
      isMarketCompletelyEmpty({
        piles: [[makeCard('1')], [], []],
        scoringSlots: [null, null, null],
        resourceSlots: [null, null, null, null, null, null],
      })
    ).toBe(false);
  });
});
