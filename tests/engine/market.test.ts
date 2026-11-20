import { describe, it, expect } from 'vitest';
import { getDrawPileIndex, isMarketCompletelyEmpty, refillMarket } from '../../src/engine/market';
import { Card, MarketState } from '../../src/engine/types';

function makeCard(id: string, resource: any = 'tomat', scoringId = 'S01'): Card {
  return { id, resource, scoringId };
}

describe('Market Refill Logic (Point Salad column drop-down)', () => {
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
    expect(getDrawPileIndex(piles, 0)).toBe(1);
  });

  it('drops the face-up scoring card in the same column into the empty veggie slot and reveals next card from pile', () => {
    const market: MarketState = {
      piles: [
        [makeCard('p0_c1', 'wortel'), makeCard('p0_c2', 'kubis')],
        [makeCard('p1_c1', 'selada')],
        [makeCard('p2_c1', 'paprika')],
      ],
      scoringSlots: [null, makeCard('s1_tomat', 'tomat'), makeCard('s2_bawang', 'bawang')],
      resourceSlots: [null, makeCard('r1'), makeCard('r2'), null, makeCard('r4'), makeCard('r5')],
    };

    // Column 0: scoringSlot 0 is null -> resourceSlot 0 draws 'p0_c1', scoringSlot 0 draws 'p0_c2'
    // Column 1: resourceSlot 3 is null -> scoringSlot 1 ('s1_tomat') DROPS DOWN to resourceSlot 3,
    //           and scoringSlot 1 reveals 'p1_c1' from pile 1!
    // Column 2: all slots filled -> untouched
    const refilled = refillMarket(market);

    expect(refilled.resourceSlots[0]?.id).toBe('p0_c1');
    expect(refilled.scoringSlots[0]?.id).toBe('p0_c2');

    expect(refilled.resourceSlots[3]?.id).toBe('s1_tomat');
    expect(refilled.resourceSlots[3]?.resource).toBe('tomat');
    expect(refilled.scoringSlots[1]?.id).toBe('p1_c1');

    expect(refilled.piles[0]).toHaveLength(0);
    expect(refilled.piles[1]).toHaveLength(0);
    expect(refilled.piles[2]).toHaveLength(1);
  });

  it('drops two consecutive cards down when both veggie slots in a column are taken', () => {
    const market: MarketState = {
      piles: [
        [makeCard('p0_next1', 'wortel'), makeCard('p0_next2', 'kubis')],
        [],
        [],
      ],
      scoringSlots: [makeCard('s0_tomat', 'tomat'), null, null],
      resourceSlots: [null, null, makeCard('r2'), makeCard('r3'), makeCard('r4'), makeCard('r5')],
    };

    const refilled = refillMarket(market);

    expect(refilled.resourceSlots[0]?.id).toBe('s0_tomat');
    expect(refilled.resourceSlots[1]?.id).toBe('p0_next1');
    expect(refilled.scoringSlots[0]?.id).toBe('p0_next2');
    expect(refilled.piles[0]).toHaveLength(0);
  });

  it('drops remaining scoring card down to its column veggie slot when piles are exhausted', () => {
    const market: MarketState = {
      piles: [[], [], []],
      scoringSlots: [null, null, makeCard('s2', 'tomat')],
      resourceSlots: [null, null, null, null, null, null],
    };

    const refilled = refillMarket(market);
    expect(refilled.scoringSlots[0]).toBeNull();
    expect(refilled.scoringSlots[1]).toBeNull();
    expect(refilled.scoringSlots[2]).toBeNull();
    expect(refilled.resourceSlots[4]?.id).toBe('s2');
    expect(refilled.resourceSlots[5]).toBeNull();
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
