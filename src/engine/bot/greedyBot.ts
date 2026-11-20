import { gameReducer } from '../actions';
import { getLegalActions } from '../endgame';
import { evaluatePlayerScore } from '../scoring';
import { GameAction, GameState } from '../types';
import { BotAI } from './interface';

/**
 * Evaluates whether flipping any scoring card currently in hand strictly increases the player's total score.
 * If so, generates a list of FLIP_CARD actions and returns the updated state.
 */
function findProfitableFlips(state: GameState, playerIndex: number): { flips: GameAction[]; updatedState: GameState } {
  let currentState = state;
  const flips: GameAction[] = [];
  let improved = true;

  // Greedily check each scoring card to see if flipping it yields a higher total score
  while (improved) {
    improved = false;
    const player = currentState.players[playerIndex];
    if (!player || player.scoringCards.length === 0) break;

    const currentScore = evaluatePlayerScore(playerIndex, currentState.players).totalScore;
    let bestFlipCardId: string | null = null;
    let bestScoreGain = 0;

    for (const card of player.scoringCards) {
      try {
        const simulatedState = gameReducer(currentState, {
          type: 'FLIP_CARD',
          cardId: card.id,
        });
        const simulatedScore = evaluatePlayerScore(playerIndex, simulatedState.players).totalScore;
        const gain = simulatedScore - currentScore;

        if (gain > bestScoreGain) {
          bestScoreGain = gain;
          bestFlipCardId = card.id;
        }
      } catch {
        // Skip illegal flip if any
      }
    }

    if (bestFlipCardId && bestScoreGain > 0) {
      flips.push({ type: 'FLIP_CARD', cardId: bestFlipCardId });
      currentState = gameReducer(currentState, {
        type: 'FLIP_CARD',
        cardId: bestFlipCardId,
      });
      improved = true;
    }
  }

  return { flips, updatedState: currentState };
}

/**
 * Greedy Bot:
 * Evaluates all legal moves on its turn and selects the action that maximizes immediate score gain.
 */
export class GreedyBot implements BotAI {
  readonly id = 'bot-greedy';
  readonly name = 'Bot (Pintar)';
  readonly difficulty = 'greedy' as const;

  planTurn(state: GameState, playerIndex: number): GameAction[] {
    const player = state.players[playerIndex];
    if (!player) return [{ type: 'END_TURN' }];

    // 1. Initial profitable flips before main action
    const { flips: preFlips, updatedState: stateAfterPreFlips } = findProfitableFlips(state, playerIndex);

    // 2. Enumerate candidate main actions
    const allActions = getLegalActions(stateAfterPreFlips);
    const mainActions = allActions.filter(
      (a) =>
        a.type === 'TAKE_RESOURCES' ||
        a.type === 'TAKE_SCORING_MARKET' ||
        a.type === 'TAKE_SCORING_PILE'
    );

    if (mainActions.length === 0) {
      return [...preFlips, { type: 'END_TURN' }];
    }

    let bestMainAction = mainActions[0];
    let bestTotalScore = -Infinity;
    let bestPostFlips: GameAction[] = [];

    for (const action of mainActions) {
      try {
        // For TAKE_SCORING_PILE, top card is hidden, but gameReducer simulates drawing it deterministically
        const stateAfterMain = gameReducer(stateAfterPreFlips, action);

        // Check if any further flips are profitable after main action
        const { flips: postFlips, updatedState: stateAfterPostFlips } = findProfitableFlips(
          stateAfterMain,
          playerIndex
        );

        const simulatedScore = evaluatePlayerScore(
          playerIndex,
          stateAfterPostFlips.players
        ).totalScore;

        // Score tiebreaker: if scores are equal, prefer action giving more resources
        const totalResources = Object.values(stateAfterPostFlips.players[playerIndex].resources).reduce(
          (a, b) => a + b,
          0
        );
        const weightedScore = simulatedScore + totalResources * 0.01;

        if (weightedScore > bestTotalScore) {
          bestTotalScore = weightedScore;
          bestMainAction = action;
          bestPostFlips = postFlips;
        }
      } catch {
        // Action was illegal or failed simulation
      }
    }

    return [...preFlips, bestMainAction, ...bestPostFlips, { type: 'END_TURN' }];
  }
}

/**
 * Easy Bot:
 * Chooses randomly among legal main actions.
 */
export class EasyBot implements BotAI {
  readonly id = 'bot-easy';
  readonly name = 'Bot (Mudah)';
  readonly difficulty = 'easy' as const;

  planTurn(state: GameState, _playerIndex: number): GameAction[] {
    const actions = getLegalActions(state);
    const mainActions = actions.filter(
      (a) =>
        a.type === 'TAKE_RESOURCES' ||
        a.type === 'TAKE_SCORING_MARKET' ||
        a.type === 'TAKE_SCORING_PILE'
    );

    if (mainActions.length === 0) {
      return [{ type: 'END_TURN' }];
    }

    // Pick random main action
    const randomIndex = Math.floor(Math.random() * mainActions.length);
    const chosenAction = mainActions[randomIndex];

    return [chosenAction, { type: 'END_TURN' }];
  }
}

export function createBot(difficulty: 'easy' | 'greedy'): BotAI {
  return difficulty === 'easy' ? new EasyBot() : new GreedyBot();
}
