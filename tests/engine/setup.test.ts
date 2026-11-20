import { describe, it, expect } from 'vitest';
import { initializeGame } from '../../src/engine/setup';
import { ALL_RESOURCES } from '../../src/engine/types';

describe('Game Setup (RULES.md section 3)', () => {
  it('throws error for invalid player counts (< 2 or > 6)', () => {
    expect(() =>
      initializeGame({
        players: [{ id: 'p1', name: 'Player 1' }],
      })
    ).toThrowError(/Invalid player count/);

    expect(() =>
      initializeGame({
        players: [
          { id: 'p1', name: 'P1' },
          { id: 'p2', name: 'P2' },
          { id: 'p3', name: 'P3' },
          { id: 'p4', name: 'P4' },
          { id: 'p5', name: 'P5' },
          { id: 'p6', name: 'P6' },
          { id: 'p7', name: 'P7' },
        ],
      })
    ).toThrowError(/Invalid player count/);
  });

  it('correctly sets up a 2-player game (36 cards used, 72 discarded)', () => {
    const state = initializeGame({
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ],
      seed: 42,
    });

    // 72 discarded cards (12 per resource)
    expect(state.discardedCards).toHaveLength(72);
    for (const res of ALL_RESOURCES) {
      const count = state.discardedCards.filter((c) => c.resource === res).length;
      expect(count).toBe(12);
    }

    // 9 cards in initial market: 3 scoring, 6 resources
    expect(state.market.scoringSlots.filter(Boolean)).toHaveLength(3);
    expect(state.market.resourceSlots.filter(Boolean)).toHaveLength(6);

    // Initial piles: 36 total - 9 on market = 27 in piles (9 per pile)
    expect(state.market.piles[0]).toHaveLength(9);
    expect(state.market.piles[1]).toHaveLength(9);
    expect(state.market.piles[2]).toHaveLength(9);

    // Turn initialization
    expect(state.currentTurnPlayerIndex).toBeGreaterThanOrEqual(0);
    expect(state.currentTurnPlayerIndex).toBeLessThan(2);
    expect(state.phase).toBe('in_progress');
    expect(state.turnCount).toBe(1);

    // Total cards in game equals 108
    const allGameCards = [
      ...state.discardedCards,
      ...state.market.scoringSlots.filter((c): c is NonNullable<typeof c> => Boolean(c)),
      ...state.market.resourceSlots.filter((c): c is NonNullable<typeof c> => Boolean(c)),
      ...state.market.piles[0],
      ...state.market.piles[1],
      ...state.market.piles[2],
    ];
    expect(allGameCards).toHaveLength(108);
    const uniqueIds = new Set(allGameCards.map((c) => c.id));
    expect(uniqueIds.size).toBe(108);
  });

  it('correctly sets up a 3-player game (54 cards used, 54 discarded)', () => {
    const state = initializeGame({
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
        { id: 'p3', name: 'Charlie' },
      ],
      seed: 123,
    });

    expect(state.discardedCards).toHaveLength(54);
    for (const res of ALL_RESOURCES) {
      const count = state.discardedCards.filter((c) => c.resource === res).length;
      expect(count).toBe(9);
    }

    // 54 total - 9 on market = 45 in piles (15 per pile)
    expect(state.market.piles[0]).toHaveLength(15);
    expect(state.market.piles[1]).toHaveLength(15);
    expect(state.market.piles[2]).toHaveLength(15);
  });

  it('correctly sets up a 4-player game (72 cards used, 36 discarded)', () => {
    const state = initializeGame({
      players: [
        { id: 'p1', name: 'P1' },
        { id: 'p2', name: 'P2' },
        { id: 'p3', name: 'P3' },
        { id: 'p4', name: 'P4' },
      ],
      seed: 777,
    });

    expect(state.discardedCards).toHaveLength(36);
    for (const res of ALL_RESOURCES) {
      const count = state.discardedCards.filter((c) => c.resource === res).length;
      expect(count).toBe(6);
    }
    // 72 total - 9 on market = 63 in piles (21 per pile)
    expect(state.market.piles[0]).toHaveLength(21);
    expect(state.market.piles[1]).toHaveLength(21);
    expect(state.market.piles[2]).toHaveLength(21);
  });

  it('correctly sets up a 2-player game with custom deckSize (72 or 108 cards)', () => {
    const state72 = initializeGame({
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ],
      seed: 99,
      deckSize: 72,
    });

    expect(state72.discardedCards).toHaveLength(36);
    expect(state72.market.piles[0]).toHaveLength(21);
    expect(state72.market.piles[1]).toHaveLength(21);
    expect(state72.market.piles[2]).toHaveLength(21);

    const state108 = initializeGame({
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ],
      seed: 99,
      deckSize: 108,
    });

    expect(state108.discardedCards).toHaveLength(0);
    expect(state108.market.piles[0]).toHaveLength(33);
    expect(state108.market.piles[1]).toHaveLength(33);
    expect(state108.market.piles[2]).toHaveLength(33);
  });

  it('correctly sets up a 6-player game (108 cards used, 0 discarded)', () => {
    const state = initializeGame({
      players: [
        { id: 'p1', name: 'P1' },
        { id: 'p2', name: 'P2' },
        { id: 'p3', name: 'P3' },
        { id: 'p4', name: 'P4' },
        { id: 'p5', name: 'P5' },
        { id: 'p6', name: 'P6' },
      ],
      seed: 999,
    });

    expect(state.discardedCards).toHaveLength(0);
    // 108 total - 9 on market = 99 in piles (33 per pile)
    expect(state.market.piles[0]).toHaveLength(33);
    expect(state.market.piles[1]).toHaveLength(33);
    expect(state.market.piles[2]).toHaveLength(33);
  });

  it('produces identical games with the same seed', () => {
    const gameA = initializeGame({
      players: [
        { id: 'p1', name: 'P1' },
        { id: 'p2', name: 'P2' },
      ],
      seed: 8888,
    });

    const gameB = initializeGame({
      players: [
        { id: 'p1', name: 'P1' },
        { id: 'p2', name: 'P2' },
      ],
      seed: 8888,
    });

    expect(gameA.currentTurnPlayerIndex).toBe(gameB.currentTurnPlayerIndex);
    expect(gameA.discardedCards).toEqual(gameB.discardedCards);
    expect(gameA.market).toEqual(gameB.market);
  });
});
