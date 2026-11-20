import { describe, it, expect } from 'vitest';
import { gameReducer } from '../../src/engine/actions';
import { initializeGame } from '../../src/engine/setup';
import { evaluatePlayerScore } from '../../src/engine/scoring';
import { Card, GameState } from '../../src/engine/types';

function createTestGame(): GameState {
  return initializeGame({
    players: [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ],
    seed: 100,
  });
}

describe('Game Reducer & Actions (RULES.md section 4)', () => {
  it('TAKE_RESOURCES takes 2 cards, increments player resources, and clears slots', () => {
    const state = createTestGame();
    const activePlayerIndex = state.currentTurnPlayerIndex;

    const card0 = state.market.resourceSlots[0]!;
    const card1 = state.market.resourceSlots[1]!;
    expect(card0).not.toBeNull();
    expect(card1).not.toBeNull();

    const nextState = gameReducer(state, {
      type: 'TAKE_RESOURCES',
      slotIndices: [0, 1],
    });

    const updatedPlayer = nextState.players[activePlayerIndex];
    expect(nextState.market.resourceSlots[0]).toBeNull();
    expect(nextState.market.resourceSlots[1]).toBeNull();
    expect(nextState.hasTakenMainActionThisTurn).toBe(true);
    expect(nextState.turnSubPhase).toBe('post_action');

    expect(updatedPlayer.draftedResourceCards).toHaveLength(2);
    expect(updatedPlayer.resources[card0.resource]).toBeGreaterThanOrEqual(1);
    expect(updatedPlayer.resources[card1.resource]).toBeGreaterThanOrEqual(1);

    // Turn is not yet advanced until END_TURN
    expect(nextState.currentTurnPlayerIndex).toBe(activePlayerIndex);
  });

  it('TAKE_RESOURCES rejects invalid slot selections and empty slots', () => {
    const state = createTestGame();

    // Same slot twice
    expect(() =>
      gameReducer(state, {
        type: 'TAKE_RESOURCES',
        slotIndices: [0, 0] as any,
      })
    ).toThrowError(/same resource card slot twice/);

    // Out of bounds slot
    expect(() =>
      gameReducer(state, {
        type: 'TAKE_RESOURCES',
        slotIndices: [0, 9] as any,
      })
    ).toThrowError(/out of bounds/);

    // Invalid length (3 slots)
    expect(() =>
      gameReducer(state, {
        type: 'TAKE_RESOURCES',
        slotIndices: [0, 1, 2] as any,
      })
    ).toThrowError(/Invalid number of resource slots/);

    // 1 card when piles are not empty
    expect(() =>
      gameReducer(state, {
        type: 'TAKE_RESOURCES',
        slotIndices: [0] as any,
      })
    ).toThrowError(/only permitted when exactly 1 card remains/);

    // Selecting an empty slot
    const stateWithEmptySlot: GameState = {
      ...state,
      market: {
        ...state.market,
        resourceSlots: [null, state.market.resourceSlots[1], ...state.market.resourceSlots.slice(2)],
      },
    };
    expect(() =>
      gameReducer(stateWithEmptySlot, {
        type: 'TAKE_RESOURCES',
        slotIndices: [0, 1],
      })
    ).toThrowError(/Resource slot 0 is empty/);
  });

  it('TAKE_RESOURCES allows 1 card when exactly 1 remains and piles are empty', () => {
    const state = createTestGame();
    const activePlayerIndex = state.currentTurnPlayerIndex;

    const remainingCard: Card = { id: 'last_res', resource: 'wortel', scoringId: 'S01' };
    const endgameResourceState: GameState = {
      ...state,
      market: {
        piles: [[], [], []],
        scoringSlots: [null, null, null],
        resourceSlots: [remainingCard, null, null, null, null, null],
      },
    };

    const nextState = gameReducer(endgameResourceState, {
      type: 'TAKE_RESOURCES',
      slotIndices: [0],
    });

    expect(nextState.players[activePlayerIndex].resources.wortel).toBe(1);
    expect(nextState.market.resourceSlots[0]).toBeNull();
  });

  it('TAKE_SCORING_MARKET adds card to scoringCards and clears slot', () => {
    const state = createTestGame();
    const activePlayerIndex = state.currentTurnPlayerIndex;
    const targetCard = state.market.scoringSlots[0]!;

    const nextState = gameReducer(state, {
      type: 'TAKE_SCORING_MARKET',
      slotIndex: 0,
    });

    const player = nextState.players[activePlayerIndex];
    expect(nextState.market.scoringSlots[0]).toBeNull();
    expect(player.scoringCards).toContainEqual(targetCard);
    expect(nextState.hasTakenMainActionThisTurn).toBe(true);

    // Rejects out of bounds or empty slot
    expect(() =>
      gameReducer(state, {
        type: 'TAKE_SCORING_MARKET',
        slotIndex: 5,
      })
    ).toThrowError(/out of bounds/);

    expect(() =>
      gameReducer(nextState, {
        type: 'TAKE_SCORING_MARKET',
        slotIndex: 0,
      })
    ).toThrowError(/already taken their main action/);
  });

  it('TAKE_SCORING_PILE draws top card from chosen pile and rejects empty piles', () => {
    const state = createTestGame();
    const activePlayerIndex = state.currentTurnPlayerIndex;
    const initialPile0Count = state.market.piles[0].length;
    const topCard = state.market.piles[0][0];

    const nextState = gameReducer(state, {
      type: 'TAKE_SCORING_PILE',
      pileIndex: 0,
    });

    const player = nextState.players[activePlayerIndex];
    expect(nextState.market.piles[0]).toHaveLength(initialPile0Count - 1);
    expect(player.scoringCards).toContainEqual(topCard);
    expect(nextState.hasTakenMainActionThisTurn).toBe(true);

    // Out of bounds pile
    expect(() =>
      gameReducer(state, {
        type: 'TAKE_SCORING_PILE',
        pileIndex: 4,
      })
    ).toThrowError(/out of bounds/);

    // Empty pile
    const stateWithEmptyPile: GameState = {
      ...state,
      market: {
        ...state.market,
        piles: [[], state.market.piles[1], state.market.piles[2]],
      },
    };
    expect(() =>
      gameReducer(stateWithEmptyPile, {
        type: 'TAKE_SCORING_PILE',
        pileIndex: 0,
      })
    ).toThrowError(/empty/);
  });

  it('prevents taking a second main action on the same turn', () => {
    const state = createTestGame();
    const stateAfterAction = gameReducer(state, {
      type: 'TAKE_SCORING_MARKET',
      slotIndex: 0,
    });

    expect(() =>
      gameReducer(stateAfterAction, {
        type: 'TAKE_SCORING_MARKET',
        slotIndex: 1,
      })
    ).toThrowError(/already taken their main action/);

    expect(() =>
      gameReducer(stateAfterAction, {
        type: 'TAKE_RESOURCES',
        slotIndices: [0, 1],
      })
    ).toThrowError(/already taken their main action/);
  });

  it('FLIP_CARD flips a scoring card to resource side (before or after main action) and throws if not owned', () => {
    const state = createTestGame();
    const activePlayerIndex = state.currentTurnPlayerIndex;

    // Give player a scoring card
    const cardToFlip: Card = { id: 'flip_target', resource: 'paprika', scoringId: 'S02' };
    state.players[activePlayerIndex].scoringCards.push(cardToFlip);

    // Flipping non-existent card
    expect(() =>
      gameReducer(state, {
        type: 'FLIP_CARD',
        cardId: 'non_existent_card',
      })
    ).toThrowError(/not found in player's scoring cards/);

    // 1. Flip before main action
    const stateFlipped = gameReducer(state, {
      type: 'FLIP_CARD',
      cardId: 'flip_target',
    });

    const player = stateFlipped.players[activePlayerIndex];
    expect(player.scoringCards.find((c) => c.id === 'flip_target')).toBeUndefined();
    expect(player.flippedCards.find((c) => c.id === 'flip_target')).toBeDefined();
    expect(player.resources.paprika).toBe(1);

    // Main action still available
    expect(stateFlipped.hasTakenMainActionThisTurn).toBe(false);

    // Now take main action
    const stateAfterMain = gameReducer(stateFlipped, {
      type: 'TAKE_SCORING_MARKET',
      slotIndex: 0,
    });
    expect(stateAfterMain.hasTakenMainActionThisTurn).toBe(true);
  });

  it('END_TURN rejects if main action not taken, otherwise refills market and advances turn', () => {
    const state = createTestGame();
    const initialPlayerIndex = state.currentTurnPlayerIndex;

    // Reject end turn before taking action
    expect(() => gameReducer(state, { type: 'END_TURN' })).toThrowError(
      /Cannot end turn before taking a main action/
    );

    // Take resources
    const stateAfterAction = gameReducer(state, {
      type: 'TAKE_RESOURCES',
      slotIndices: [0, 1],
    });

    // Slots 0 and 1 are empty
    expect(stateAfterAction.market.resourceSlots[0]).toBeNull();
    expect(stateAfterAction.market.resourceSlots[1]).toBeNull();

    // Call END_TURN
    const stateAfterEnd = gameReducer(stateAfterAction, { type: 'END_TURN' });

    // Refilled
    expect(stateAfterEnd.market.resourceSlots[0]).not.toBeNull();
    expect(stateAfterEnd.market.resourceSlots[1]).not.toBeNull();

    // Next player's turn
    expect(stateAfterEnd.currentTurnPlayerIndex).toBe((initialPlayerIndex + 1) % 2);
    expect(stateAfterEnd.hasTakenMainActionThisTurn).toBe(false);
    expect(stateAfterEnd.turnSubPhase).toBe('action');
    expect(stateAfterEnd.turnCount).toBe(2);
  });

  it('rejects actions when game is already in game_over phase', () => {
    const state = createTestGame();
    const gameOverState: GameState = {
      ...state,
      phase: 'game_over',
    };

    expect(() =>
      gameReducer(gameOverState, {
        type: 'TAKE_SCORING_MARKET',
        slotIndex: 0,
      })
    ).toThrowError(/Cannot perform actions in a completed game/);
  });
});

describe('Special Mode: 1 Random Power-Up & Market Events (Golden / Rotten / Panen Raya)', () => {
  it('assigns 1 random Power-Up per player in special mode and none in classic mode', () => {
    const special = initializeGame({
      players: [
        { id: 'p1', name: 'A' },
        { id: 'p2', name: 'B' },
      ],
      seed: 101,
      gameMode: 'special',
    });
    expect(special.gameMode).toBe('special');
    expect(special.players[0].assignedSkill).toBeTruthy();
    expect(special.players[1].assignedSkill).toBeTruthy();

    const classic = initializeGame({
      players: [
        { id: 'p1', name: 'A' },
        { id: 'p2', name: 'B' },
      ],
      seed: 101,
      gameMode: 'classic',
    });
    expect(classic.gameMode).toBe('classic');
    expect(classic.players[0].assignedSkill).toBeNull();
    expect(classic.activeEvent).toBeNull();
  });

  it('supports USE_SKILL_GRAB_THREE allowing 3 veggies in one turn and marks skillUsed', () => {
    const state = initializeGame({
      players: [
        { id: 'p1', name: 'A' },
        { id: 'p2', name: 'B' },
      ],
      seed: 202,
      gameMode: 'special',
    });
    const idx = state.currentTurnPlayerIndex;
    state.players[idx].assignedSkill = 'grab_three';
    state.players[idx].skillUsed = false;

    const afterSkill = gameReducer(state, { type: 'USE_SKILL_GRAB_THREE' });
    expect(afterSkill.players[idx].skillUsed).toBe(true);
    expect(afterSkill.extraVeggieAllowance).toBe(1);

    const afterDraft3 = gameReducer(afterSkill, {
      type: 'TAKE_RESOURCES',
      slotIndices: [0, 1, 2],
    });
    expect(afterDraft3.players[idx].draftedResourceCards).toHaveLength(3);
  });

  it('supports USE_SKILL_SWAP_VEGGIE between active player and opponent', () => {
    const state = initializeGame({
      players: [
        { id: 'p1', name: 'A' },
        { id: 'p2', name: 'B' },
      ],
      seed: 303,
      gameMode: 'special',
    });
    const meIdx = state.currentTurnPlayerIndex;
    const oppIdx = (meIdx + 1) % 2;
    state.players[meIdx].assignedSkill = 'swap_veggie';
    state.players[meIdx].skillUsed = false;
    state.players[meIdx].resources.tomat = 2;
    state.players[oppIdx].resources.wortel = 1;

    const afterSwap = gameReducer(state, {
      type: 'USE_SKILL_SWAP_VEGGIE',
      targetPlayerIndex: oppIdx,
      myResource: 'tomat',
      targetResource: 'wortel',
    });

    expect(afterSwap.players[meIdx].skillUsed).toBe(true);
    expect(afterSwap.players[meIdx].resources.tomat).toBe(1);
    expect(afterSwap.players[meIdx].resources.wortel).toBe(1);
    expect(afterSwap.players[oppIdx].resources.tomat).toBe(1);
    expect(afterSwap.players[oppIdx].resources.wortel).toBe(0);
  });

  it('awards +3 for Golden Veggie and applies -2 for Rotten Veggie in evaluatePlayerScore', () => {
    const state = initializeGame({
      players: [
        { id: 'p1', name: 'A' },
        { id: 'p2', name: 'B' },
      ],
      seed: 404,
      gameMode: 'special',
    });
    const idx = state.currentTurnPlayerIndex;

    // Force Golden Veggie on slot 0
    state.activeEvent = { type: 'golden_veggie', slotIndex: 0, bonusPoints: 3 };
    const afterGolden = gameReducer(state, { type: 'TAKE_RESOURCES', slotIndices: [0, 1] });
    expect(afterGolden.players[idx].goldenBonusPoints).toBe(3);
    expect(evaluatePlayerScore(idx, afterGolden.players).totalScore).toBe(3);

    // Force Rotten Veggie on slot 2 in a fresh turn
    const state2 = initializeGame({
      players: [
        { id: 'p1', name: 'A' },
        { id: 'p2', name: 'B' },
      ],
      seed: 404,
      gameMode: 'special',
    });
    const idx2 = state2.currentTurnPlayerIndex;
    state2.activeEvent = { type: 'rotten_veggie', slotIndex: 2, penaltyPoints: -2 };
    const afterRotten = gameReducer(state2, { type: 'TAKE_RESOURCES', slotIndices: [2, 3] });
    expect(afterRotten.players[idx2].rottenPenaltyPoints).toBe(-2);
    expect(evaluatePlayerScore(idx2, afterRotten.players).totalScore).toBe(-2);
  });
});

describe('Additional Power-Ups: Golden Touch, Steal Veggie, Clone Veggie', () => {
  it('supports USE_SKILL_GOLDEN_TOUCH turning a board veggie into a Golden Veggie (+3)', () => {
    const state = initializeGame({
      players: [
        { id: 'p1', name: 'A' },
        { id: 'p2', name: 'B' },
      ],
      seed: 505,
      gameMode: 'special',
    });
    const idx = state.currentTurnPlayerIndex;
    state.players[idx].assignedSkill = 'golden_touch';
    state.players[idx].skillUsed = false;
    state.activeEvent = null;

    const afterTouch = gameReducer(state, { type: 'USE_SKILL_GOLDEN_TOUCH' });
    expect(afterTouch.players[idx].skillUsed).toBe(true);
    expect(afterTouch.activeEvent?.type).toBe('golden_veggie');
  });

  it('supports USE_SKILL_STEAL_VEGGIE taking 1 veggie from an opponent', () => {
    const state = initializeGame({
      players: [
        { id: 'p1', name: 'A' },
        { id: 'p2', name: 'B' },
      ],
      seed: 606,
      gameMode: 'special',
    });
    const meIdx = state.currentTurnPlayerIndex;
    const oppIdx = (meIdx + 1) % 2;
    state.players[meIdx].assignedSkill = 'steal_veggie';
    state.players[meIdx].skillUsed = false;
    state.players[oppIdx].resources.paprika = 2;

    const afterSteal = gameReducer(state, {
      type: 'USE_SKILL_STEAL_VEGGIE',
      targetPlayerIndex: oppIdx,
      targetResource: 'paprika',
    });
    expect(afterSteal.players[meIdx].skillUsed).toBe(true);
    expect(afterSteal.players[meIdx].resources.paprika).toBe(1);
    expect(afterSteal.players[oppIdx].resources.paprika).toBe(1);
  });

  it('supports USE_SKILL_CLONE_VEGGIE duplicating an owned veggie', () => {
    const state = initializeGame({
      players: [
        { id: 'p1', name: 'A' },
        { id: 'p2', name: 'B' },
      ],
      seed: 707,
      gameMode: 'special',
    });
    const idx = state.currentTurnPlayerIndex;
    state.players[idx].assignedSkill = 'clone_veggie';
    state.players[idx].skillUsed = false;
    state.players[idx].resources.kubis = 1;

    const afterClone = gameReducer(state, {
      type: 'USE_SKILL_CLONE_VEGGIE',
      myResource: 'kubis',
    });
    expect(afterClone.players[idx].skillUsed).toBe(true);
    expect(afterClone.players[idx].resources.kubis).toBe(2);
  });

  it('USE_SKILL_REFRESH_MARKET guarantees new vegetables even when only 3 tomatoes remain and draw piles are empty', () => {
    const state = initializeGame({
      players: [
        { id: 'p1', name: 'A' },
        { id: 'p2', name: 'B' },
      ],
      seed: 808,
      gameMode: 'special',
    });
    const idx = state.currentTurnPlayerIndex;
    state.players[idx].assignedSkill = 'refresh_market';
    state.players[idx].skillUsed = false;

    // Empty all draw piles & leave only 3 tomatoes on the board
    state.market.piles = [[], [], []];
    state.market.resourceSlots = [
      { id: 't1', resource: 'tomat', scoringId: 'S01' },
      null,
      { id: 't2', resource: 'tomat', scoringId: 'S02' },
      null,
      { id: 't3', resource: 'tomat', scoringId: 'S03' },
      null,
    ];

    const refreshed = gameReducer(state, { type: 'USE_SKILL_REFRESH_MARKET' });
    expect(refreshed.players[idx].skillUsed).toBe(true);
    expect(refreshed.market.resourceSlots[0]?.resource).not.toBe('tomat');
    expect(refreshed.market.resourceSlots[2]?.resource).not.toBe('tomat');
    expect(refreshed.market.resourceSlots[4]?.resource).not.toBe('tomat');
  });
});
