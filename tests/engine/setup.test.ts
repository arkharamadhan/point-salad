import { describe, it, expect } from 'vitest';
import { initializeGame } from '../../src/engine/setup';
import { ALL_RESOURCES } from '../../src/engine/types';

describe('Game Setup (RULES.md section 3)', () => {
  it('throws error for invalid player counts', () => {
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
        ],
      })
    ).toThrowError(/Invalid player count/);
  });

  it('correctly sets up a 2-player game (60 cards used, 30 discarded)', () => {
    const state = initializeGame({
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ],
      seed: 42,
    });

    // 30 discarded cards (5 per resource)
    expect(state.discardedCards).toHaveLength(30);
    for (const res of ALL_RESOURCES) {
      const count = state.discardedCards.filter((c) => c.resource === res).length;
      expect(count).toBe(5);
    }

    // 9 cards in initial market: 3 scoring, 6 resources
    expect(state.market.scoringSlots.filter(Boolean)).toHaveLength(3);
    expect(state.market.resourceSlots.filter(Boolean)).toHaveLength(6);

    // Initial piles: 60 total - 9 on market = 51 in piles (17 per pile)
    expect(state.market.piles[0]).toHaveLength(17);
    expect(state.market.piles[1]).toHaveLength(17);
    expect(state.market.piles[2]).toHaveLength(17);

    // Turn initialization
    expect(state.currentTurnPlayerIndex).toBeGreaterThanOrEqual(0);
    expect(state.currentTurnPlayerIndex).toBeLessThan(2);
    expect(state.phase).toBe('in_progress');
    expect(state.turnCount).toBe(1);

    // Total cards in game equals 90
    const allGameCards = [
      ...state.discardedCards,
      ...state.market.scoringSlots.filter((c): c is NonNullable<typeof c> => Boolean(c)),
      ...state.market.resourceSlots.filter((c): c is NonNullable<typeof c> => Boolean(c)),
      ...state.market.piles[0],
      ...state.market.piles[1],
      ...state.market.piles[2],
    ];
    expect(allGameCards).toHaveLength(90);
    const uniqueIds = new Set(allGameCards.map((c) => c.id));
    expect(uniqueIds.size).toBe(90);
  });

  it('correctly sets up a 3-player game (72 cards used, 18 discarded)', () => {
    const state = initializeGame({
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
        { id: 'p3', name: 'Charlie' },
      ],
      seed: 123,
    });

    expect(state.discardedCards).toHaveLength(18);
    for (const res of ALL_RESOURCES) {
      const count = state.discardedCards.filter((c) => c.resource === res).length;
      expect(count).toBe(3);
    }

    // 72 total - 9 on market = 63 in piles (21 per pile)
    expect(state.market.piles[0]).toHaveLength(21);
    expect(state.market.piles[1]).toHaveLength(21);
    expect(state.market.piles[2]).toHaveLength(21);
  });

  it('correctly sets up a 4-player game (90 cards used, 0 discarded)', () => {
    const state = initializeGame({
      players: [
        { id: 'p1', name: 'P1' },
        { id: 'p2', name: 'P2' },
        { id: 'p3', name: 'P3' },
        { id: 'p4', name: 'P4' },
      ],
      seed: 777,
    });

    expect(state.discardedCards).toHaveLength(0);
    // 90 total - 9 on market = 81 in piles (27 per pile)
    expect(state.market.piles[0]).toHaveLength(27);
    expect(state.market.piles[1]).toHaveLength(27);
    expect(state.market.piles[2]).toHaveLength(27);
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
