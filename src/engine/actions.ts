import { checkGameEnd, finalizeGame } from './endgame';
import { refillMarket } from './market';
import { Card, GameAction, GameState, PlayerState } from './types';

function clonePlayer(player: PlayerState): PlayerState {
  return {
    ...player,
    scoringCards: [...player.scoringCards],
    draftedResourceCards: [...player.draftedResourceCards],
    flippedCards: [...player.flippedCards],
    resources: { ...player.resources },
  };
}

function clonePlayers(players: PlayerState[]): PlayerState[] {
  return players.map(clonePlayer);
}

/**
 * Pure Game Engine Reducer
 * Handles state transitions for all legal moves in the game.
 */
export function gameReducer(
  state: GameState,
  action: GameAction,
  lang: 'id' | 'en' = 'id'
): GameState {
  if (state.phase === 'game_over') {
    throw new Error('Cannot perform actions in a completed game.');
  }

  const activePlayer = state.players[state.currentTurnPlayerIndex];
  if (!activePlayer) {
    throw new Error('No active player found.');
  }

  switch (action.type) {
    case 'TAKE_RESOURCES': {
      if (state.hasTakenMainActionThisTurn) {
        throw new Error('Player has already taken their main action this turn.');
      }

      const indices = action.slotIndices;
      const allPilesEmpty = state.market.piles.every((p) => p.length === 0);
      const availableResourceCount = state.market.resourceSlots.filter((s) => s !== null).length;

      if (indices.length === 1) {
        if (!allPilesEmpty || availableResourceCount !== 1) {
          throw new Error('Taking 1 resource card is only permitted when exactly 1 card remains and all draw piles are empty.');
        }
      } else if (indices.length === 2) {
        if (indices[0] === indices[1]) {
          throw new Error('Cannot select the same resource card slot twice.');
        }
      } else {
        throw new Error(`Invalid number of resource slots selected: ${(indices as number[]).length}`);
      }

      // Verify all selected slots are valid and filled
      const takenCards: Card[] = [];
      const newResourceSlots = [...state.market.resourceSlots];

      for (const idx of indices) {
        if (idx < 0 || idx >= newResourceSlots.length) {
          throw new Error(`Resource slot index out of bounds: ${idx}`);
        }
        const card = newResourceSlots[idx];
        if (!card) {
          throw new Error(`Resource slot ${idx} is empty.`);
        }
        takenCards.push(card);
        newResourceSlots[idx] = null;
      }

      // Update player resources
      const newPlayers = clonePlayers(state.players);
      const newActivePlayer = newPlayers[state.currentTurnPlayerIndex];

      for (const card of takenCards) {
        newActivePlayer.draftedResourceCards.push(card);
        newActivePlayer.resources[card.resource] =
          (newActivePlayer.resources[card.resource] ?? 0) + 1;
      }

      const logMsg =
        takenCards.length === 2
          ? `${newActivePlayer.name} mengambil 2 kartu rempah (${takenCards[0].resource}, ${takenCards[1].resource}).`
          : `${newActivePlayer.name} mengambil 1 kartu rempah terakhir (${takenCards[0].resource}).`;

      return {
        ...state,
        players: newPlayers,
        market: {
          ...state.market,
          resourceSlots: newResourceSlots,
        },
        hasTakenMainActionThisTurn: true,
        turnSubPhase: 'post_action',
        log: [...state.log, logMsg],
      };
    }

    case 'TAKE_SCORING_MARKET': {
      if (state.hasTakenMainActionThisTurn) {
        throw new Error('Player has already taken their main action this turn.');
      }

      const { slotIndex } = action;
      if (slotIndex < 0 || slotIndex >= state.market.scoringSlots.length) {
        throw new Error(`Scoring slot index out of bounds: ${slotIndex}`);
      }

      const card = state.market.scoringSlots[slotIndex];
      if (!card) {
        throw new Error(`Scoring slot ${slotIndex} is empty.`);
      }

      const newScoringSlots = [...state.market.scoringSlots];
      newScoringSlots[slotIndex] = null;

      const newPlayers = clonePlayers(state.players);
      const newActivePlayer = newPlayers[state.currentTurnPlayerIndex];
      newActivePlayer.scoringCards.push(card);

      const logMsg = `${newActivePlayer.name} mengambil kartu skor (${card.scoringId}) dari pasar.`;

      return {
        ...state,
        players: newPlayers,
        market: {
          ...state.market,
          scoringSlots: newScoringSlots,
        },
        hasTakenMainActionThisTurn: true,
        turnSubPhase: 'post_action',
        log: [...state.log, logMsg],
      };
    }

    case 'TAKE_SCORING_PILE': {
      if (state.hasTakenMainActionThisTurn) {
        throw new Error('Player has already taken their main action this turn.');
      }

      const { pileIndex } = action;
      if (pileIndex < 0 || pileIndex >= state.market.piles.length) {
        throw new Error(`Pile index out of bounds: ${pileIndex}`);
      }

      const pile = state.market.piles[pileIndex];
      if (pile.length === 0) {
        throw new Error(`Draw pile ${pileIndex + 1} is empty.`);
      }

      const newPiles: [Card[], Card[], Card[]] = [
        [...state.market.piles[0]],
        [...state.market.piles[1]],
        [...state.market.piles[2]],
      ];
      const card = newPiles[pileIndex].shift();
      if (!card) {
        throw new Error(`Failed to draw card from pile ${pileIndex + 1}`);
      }

      const newPlayers = clonePlayers(state.players);
      const newActivePlayer = newPlayers[state.currentTurnPlayerIndex];
      newActivePlayer.scoringCards.push(card);

      const logMsg = `${newActivePlayer.name} mengambil kartu skor buta dari Tumpukan ${pileIndex + 1} (${card.scoringId}).`;

      return {
        ...state,
        players: newPlayers,
        market: {
          ...state.market,
          piles: newPiles,
        },
        hasTakenMainActionThisTurn: true,
        turnSubPhase: 'post_action',
        log: [...state.log, logMsg],
      };
    }

    case 'FLIP_CARD': {
      // Free action: can be executed before or after main action
      const newPlayers = clonePlayers(state.players);
      const newActivePlayer = newPlayers[state.currentTurnPlayerIndex];

      const cardIndex = newActivePlayer.scoringCards.findIndex((c) => c.id === action.cardId);
      if (cardIndex === -1) {
        throw new Error(`Card ${action.cardId} not found in player's scoring cards.`);
      }

      const [flippedCard] = newActivePlayer.scoringCards.splice(cardIndex, 1);
      newActivePlayer.flippedCards.push(flippedCard);
      newActivePlayer.resources[flippedCard.resource] =
        (newActivePlayer.resources[flippedCard.resource] ?? 0) + 1;

      const logMsg = `${newActivePlayer.name} membalik kartu skor (${flippedCard.scoringId}) menjadi rempah ${flippedCard.resource}.`;

      return {
        ...state,
        players: newPlayers,
        log: [...state.log, logMsg],
      };
    }

    case 'END_TURN': {
      if (!state.hasTakenMainActionThisTurn) {
        throw new Error('Cannot end turn before taking a main action.');
      }

      // 1. Refill market according to RULES.md section 4
      const refilledMarket = refillMarket(state.market);

      const stateWithRefilledMarket: GameState = {
        ...state,
        market: refilledMarket,
      };

      // 2. Check if game is over
      if (checkGameEnd(stateWithRefilledMarket)) {
        return finalizeGame(stateWithRefilledMarket, lang);
      }

      // 3. Advance to next player
      const nextPlayerIndex = (state.currentTurnPlayerIndex + 1) % state.players.length;
      const nextTurnCount = state.turnCount + 1;
      const nextPlayerName = state.players[nextPlayerIndex].name;

      const updatedState: GameState = {
        ...stateWithRefilledMarket,
        currentTurnPlayerIndex: nextPlayerIndex,
        turnCount: nextTurnCount,
        hasTakenMainActionThisTurn: false,
        turnSubPhase: 'action',
        log: [
          ...stateWithRefilledMarket.log,
          `Giliran beralih ke ${nextPlayerName} (Giliran ${nextTurnCount}).`,
        ],
      };

      // Re-verify if next player has any legal moves; if not, game ends
      if (checkGameEnd(updatedState)) {
        return finalizeGame(updatedState, lang);
      }

      return updatedState;
    }

    default: {
      const exhaustiveCheck: never = action;
      throw new Error(`Unhandled action type: ${(exhaustiveCheck as any)?.type}`);
    }
  }
}
