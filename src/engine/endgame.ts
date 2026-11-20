import { isMarketCompletelyEmpty } from './market';
import { calculateFinalScores } from './scoring';
import { GameAction, GameState } from './types';

/**
 * Returns all currently legal actions for the active player.
 */
export function getLegalActions(state: GameState): GameAction[] {
  if (state.phase === 'game_over') {
    return [];
  }

  const actions: GameAction[] = [];
  const activePlayer = state.players[state.currentTurnPlayerIndex];
  if (!activePlayer) return [];

  // 1. Flip actions (can be taken at any time during active player's turn)
  for (const card of activePlayer.scoringCards) {
    actions.push({ type: 'FLIP_CARD', cardId: card.id });
  }

  // 2. End turn action (only legal after main action has been taken)
  if (state.hasTakenMainActionThisTurn) {
    actions.push({ type: 'END_TURN' });
    // If main action already taken, player can flip cards or end turn.
    return actions;
  }

  // 3. Main actions (only legal if main action has NOT been taken yet)
  const availableResourceSlots: number[] = [];
  state.market.resourceSlots.forEach((slot, idx) => {
    if (slot !== null) {
      availableResourceSlots.push(idx);
    }
  });

  const allPilesEmpty = state.market.piles.every((p) => p.length === 0);

  // Aksi A — Ambil Rempah:
  if (availableResourceSlots.length >= 2) {
    for (let i = 0; i < availableResourceSlots.length; i++) {
      for (let j = i + 1; j < availableResourceSlots.length; j++) {
        actions.push({
          type: 'TAKE_RESOURCES',
          slotIndices: [availableResourceSlots[i], availableResourceSlots[j]],
        });
      }
    }
  } else if (availableResourceSlots.length === 1 && allPilesEmpty) {
    // Special rule: if only 1 resource card remains and all piles are empty, may take 1 card
    actions.push({
      type: 'TAKE_RESOURCES',
      slotIndices: [availableResourceSlots[0]],
    });
  }

  // Aksi B — Ambil Kartu Skor dari Pasar:
  state.market.scoringSlots.forEach((slot, idx) => {
    if (slot !== null) {
      actions.push({
        type: 'TAKE_SCORING_MARKET',
        slotIndex: idx,
      });
    }
  });

  // Aksi B — Ambil Kartu Skor dari Atas Tumpukan Tertutup:
  state.market.piles.forEach((pile, pileIndex) => {
    if (pile.length > 0) {
      actions.push({
        type: 'TAKE_SCORING_PILE',
        pileIndex,
      });
    }
  });

  return actions;
}

/**
 * Checks whether the game should end:
 * 1. Market is completely empty when a turn is about to start.
 * 2. Or the active player has no legal actions available at all.
 */
export function checkGameEnd(state: GameState): boolean {
  if (state.phase === 'game_over') return true;

  if (isMarketCompletelyEmpty(state.market)) {
    return true;
  }

  const legalActions = getLegalActions(state);
  // If player cannot perform any main action and cannot end turn
  const hasPlayableAction = legalActions.some(
    (a) => a.type !== 'FLIP_CARD' // Just flipping cards alone doesn't sustain an empty game
  );

  return !hasPlayableAction;
}

/**
 * Completes the game, evaluates final scores, applies tiebreakers, and populates final reports.
 */
export function finalizeGame(state: GameState, lang: 'id' | 'en' = 'id'): GameState {
  const finalScores = calculateFinalScores(state.players, lang);
  const highestRankScores = finalScores.filter((s) => s.rank === 1);
  const winnerIds = highestRankScores.map((s) => s.playerId);

  const winnerNames = highestRankScores.map((s) => s.playerName).join(' & ');
  const logMessage =
    highestRankScores.length > 1
      ? `Permainan berakhir! Kemenangan bersama: ${winnerNames} (Skor: ${highestRankScores[0].totalScore})`
      : `Permainan berakhir! Pemenang: ${winnerNames} (Skor: ${highestRankScores[0].totalScore})`;

  return {
    ...state,
    phase: 'game_over',
    winnerIds,
    finalScores,
    log: [...state.log, logMessage],
  };
}
