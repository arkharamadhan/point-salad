import { GameAction, GameState } from '../types';

export interface BotAI {
  readonly id: string;
  readonly name: string;
  readonly difficulty: 'easy' | 'greedy';

  /**
   * Evaluates the game state and returns the complete sequence of actions
   * the bot intends to take for this turn (e.g. optional flips, main action, optional flips, END_TURN).
   */
  planTurn(state: GameState, playerIndex: number): GameAction[];
}
