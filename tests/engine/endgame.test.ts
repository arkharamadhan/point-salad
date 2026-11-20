import { describe, it, expect } from 'vitest';
import { checkGameEnd, finalizeGame, getLegalActions } from '../../src/engine/endgame';
import { calculateFinalScores } from '../../src/engine/scoring';
import { initializeGame } from '../../src/engine/setup';
import { Card, GameState, PlayerState, ResourceCounts } from '../../src/engine/types';
import { gameReducer } from '../../src/engine/actions';

function makePlayer(
  id: string,
  name: string,
  resources: Partial<ResourceCounts> = {},
  scoringCards: Card[] = [],
  flippedCards: Card[] = []
): PlayerState {
  const fullResources: ResourceCounts = {
    wortel: 0,
    jagung: 0,
    tomat: 0,
    terong: 0,
    jamur: 0,
    brokoli: 0,
    ...resources,
  };
  return {
    id,
    name,
    isBot: false,
    scoringCards,
    draftedResourceCards: [],
    flippedCards,
    resources: fullResources,
  };
}

describe('End Game Detection and Tiebreakers (RULES.md section 5 & 6)', () => {
  it('detects game end when market is completely empty', () => {
    const state = initializeGame({
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ],
      seed: 42,
    });

    expect(checkGameEnd(state)).toBe(false);

    const emptyMarketState: GameState = {
      ...state,
      market: {
        piles: [[], [], []],
        scoringSlots: [null, null, null],
        resourceSlots: [null, null, null, null, null, null],
      },
    };

    expect(checkGameEnd(emptyMarketState)).toBe(true);
  });

  it('getLegalActions returns empty array when game is over and handles 1-resource edge case', () => {
    const state = initializeGame({
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ],
      seed: 42,
    });

    const gameOverState: GameState = { ...state, phase: 'game_over' };
    expect(getLegalActions(gameOverState)).toEqual([]);

    // Single resource card remaining and piles empty
    const singleResState: GameState = {
      ...state,
      hasTakenMainActionThisTurn: false,
      market: {
        piles: [[], [], []],
        scoringSlots: [null, null, null],
        resourceSlots: [{ id: 'r1', resource: 'wortel', scoringId: 'S01' }, null, null, null, null, null],
      },
    };
    const actions = getLegalActions(singleResState);
    expect(actions).toContainEqual({
      type: 'TAKE_RESOURCES',
      slotIndices: [0],
    });

    // In post action subphase, returns END_TURN
    const postActionState: GameState = {
      ...state,
      hasTakenMainActionThisTurn: true,
      turnSubPhase: 'post_action',
    };
    const postActions = getLegalActions(postActionState);
    expect(postActions).toContainEqual({ type: 'END_TURN' });
  });

  it('detects game end when no legal main actions exist', () => {
    const state = initializeGame({
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ],
      seed: 42,
    });

    // Piles empty, scoring slots empty, but 0 resource cards
    const noActionsState: GameState = {
      ...state,
      hasTakenMainActionThisTurn: false,
      market: {
        piles: [[], [], []],
        scoringSlots: [null, null, null],
        resourceSlots: [null, null, null, null, null, null],
      },
    };

    expect(checkGameEnd(noActionsState)).toBe(true);
  });

  describe('Tiebreaker Rules', () => {
    it('Level 1: Highest total score wins outright', () => {
      // P1 has 15 pts, P2 has 12 pts
      const p1 = makePlayer('p1', 'Alice', { wortel: 5 }, [
        { id: 'c1', resource: 'wortel', scoringId: 'S01' }, // 5*3 = 15 pts
      ]);
      const p2 = makePlayer('p2', 'Bob', { wortel: 4 }, [
        { id: 'c2', resource: 'wortel', scoringId: 'S01' }, // 4*3 = 12 pts
      ]);

      const scores = calculateFinalScores([p1, p2]);
      expect(scores[0].playerId).toBe('p1');
      expect(scores[0].rank).toBe(1);
      expect(scores[1].playerId).toBe('p2');
      expect(scores[1].rank).toBe(2);
    });

    it('Level 2: When total score is tied, most total resources wins', () => {
      // Both score 12 pts:
      // P1: 4 jahe * 3 = 12 pts (total resources = 4)
      // P2: 4 jahe * 3 = 12 pts + 2 kunyit (total resources = 6)
      const p1 = makePlayer('p1', 'Alice', { wortel: 4 }, [
        { id: 'c1', resource: 'wortel', scoringId: 'S01' },
      ]);
      const p2 = makePlayer('p2', 'Bob', { wortel: 4, jagung: 2 }, [
        { id: 'c2', resource: 'wortel', scoringId: 'S01' },
      ]);

      const scores = calculateFinalScores([p1, p2]);
      expect(scores[0].totalScore).toBe(scores[1].totalScore);
      expect(scores[0].playerId).toBe('p2'); // P2 has more resources (6 vs 4)
      expect(scores[0].rank).toBe(1);
      expect(scores[1].rank).toBe(2);
    });

    it('Level 3: When score and resources are tied, most unflipped scoring cards wins', () => {
      // Both have 12 pts and 4 total resources.
      // P1: 2 jahe, 2 kunyit (total 4 resources)
      // S01 (+3 jahe): 2*3 = 6 pts
      // S02 (+3 kunyit): 2*3 = 6 pts -> total 12 pts (2 unflipped cards)
      const p1 = makePlayer('p1', 'Alice', { wortel: 2, jagung: 2 }, [
        { id: 'c1', resource: 'wortel', scoringId: 'S01' },
        { id: 'c2', resource: 'jagung', scoringId: 'S02' },
      ]);
      // P2: 4 jahe (total 4 resources)
      // S01 (+3 jahe): 4*3 = 12 pts (1 unflipped card)
      const p2 = makePlayer('p2', 'Bob', { wortel: 4 }, [
        { id: 'c3', resource: 'wortel', scoringId: 'S01' },
      ]);

      const scores = calculateFinalScores([p1, p2]);
      expect(scores[0].totalScore).toBe(scores[1].totalScore);
      expect(scores[0].totalScore).toBe(12);
      expect(scores[0].totalResources).toBe(scores[1].totalResources);
      expect(scores[0].totalResources).toBe(4);
      expect(scores[0].playerId).toBe('p1'); // P1 has 2 unflipped cards vs 1
      expect(scores[0].rank).toBe(1);
      expect(scores[1].rank).toBe(2);
    });

    it('Level 4: When score, resources, and scoring cards are all tied, shared victory', () => {
      // Exactly identical scores, resources, and cards count
      const p1 = makePlayer('p1', 'Alice', { wortel: 4 }, [
        { id: 'c1', resource: 'wortel', scoringId: 'S01' },
      ]);
      const p2 = makePlayer('p2', 'Bob', { wortel: 4 }, [
        { id: 'c2', resource: 'wortel', scoringId: 'S01' },
      ]);

      const scores = calculateFinalScores([p1, p2]);
      expect(scores[0].rank).toBe(1);
      expect(scores[1].rank).toBe(1); // Tied at rank 1

      const finalized = finalizeGame({
        players: [p1, p2],
        currentTurnPlayerIndex: 0,
        turnSubPhase: 'action',
        hasTakenMainActionThisTurn: false,
        market: {
          piles: [[], [], []],
          scoringSlots: [null, null, null],
          resourceSlots: [null, null, null, null, null, null],
        },
        phase: 'in_progress',
        turnCount: 10,
        discardedCards: [],
        seed: 123,
        log: [],
      });

      expect(finalized.phase).toBe('game_over');
      expect(finalized.winnerIds).toEqual(['p1', 'p2']);
      expect(finalized.log[finalized.log.length - 1]).toContain('Kemenangan bersama');
    });
  });

  it('triggers game over automatically on END_TURN when market becomes completely empty', () => {
    const baseState = initializeGame({
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ],
      seed: 99,
    });

    // Market with only 1 scoring card remaining, piles empty
    const nearEndState: GameState = {
      ...baseState,
      currentTurnPlayerIndex: 0,
      market: {
        piles: [[], [], []],
        scoringSlots: [{ id: 'last_s', resource: 'wortel', scoringId: 'S01' }, null, null],
        resourceSlots: [null, null, null, null, null, null],
      },
    };

    // P1 takes the last scoring card
    const stateAfterTake = gameReducer(nearEndState, {
      type: 'TAKE_SCORING_MARKET',
      slotIndex: 0,
    });

    // P1 ends turn
    const stateAfterEnd = gameReducer(stateAfterTake, {
      type: 'END_TURN',
    });

    expect(stateAfterEnd.phase).toBe('game_over');
    expect(stateAfterEnd.winnerIds).toBeDefined();
    expect(stateAfterEnd.finalScores).toHaveLength(2);
  });
});
