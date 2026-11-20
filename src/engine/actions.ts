import { checkGameEnd, finalizeGame } from './endgame';
import { refillMarket } from './market';
import { createRNG, shuffle } from './rng';
import { rollMarketEvent } from './setup';
import { ALL_RESOURCES, Card, GameAction, GameState, PlayerState } from './types';

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
      const extraAllowance = state.extraVeggieAllowance ?? 0;
      const maxAllowed = Math.min(2 + extraAllowance, availableResourceCount);

      if (indices.length === 1) {
        if (!allPilesEmpty || availableResourceCount !== 1) {
          throw new Error('Taking 1 resource card is only permitted when exactly 1 card remains and all draw piles are empty.');
        }
      } else if (indices.length === 2 || (indices.length === 3 && extraAllowance >= 1)) {
        const unique = new Set(indices);
        if (unique.size !== indices.length) {
          throw new Error('Cannot select the same resource card slot twice.');
        }
        if (indices.length > maxAllowed) {
          throw new Error(`Cannot select ${indices.length} resource slots when only ${maxAllowed} allowed.`);
        }
      } else {
        throw new Error(`Invalid number of resource slots selected: ${indices.length}`);
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

      // Update player resources & check Golden / Rotten veggie event
      const newPlayers = clonePlayers(state.players);
      const newActivePlayer = newPlayers[state.currentTurnPlayerIndex];

      for (const card of takenCards) {
        newActivePlayer.draftedResourceCards.push(card);
        newActivePlayer.resources[card.resource] =
          (newActivePlayer.resources[card.resource] ?? 0) + 1;
      }

      let eventSuffix = '';
      if (state.activeEvent?.type === 'golden_veggie' && indices.includes(state.activeEvent.slotIndex)) {
        newActivePlayer.goldenBonusPoints =
          (newActivePlayer.goldenBonusPoints ?? 0) + state.activeEvent.bonusPoints;
        eventSuffix = ` (+${state.activeEvent.bonusPoints} Bonus Sayur Emas!)`;
      } else if (state.activeEvent?.type === 'rotten_veggie' && indices.includes(state.activeEvent.slotIndex)) {
        newActivePlayer.rottenPenaltyPoints =
          (newActivePlayer.rottenPenaltyPoints ?? 0) + state.activeEvent.penaltyPoints;
        eventSuffix = ` (${state.activeEvent.penaltyPoints} Penalti Sayur Busuk!)`;
      }

      const veggieList = takenCards.map((c) => c.resource).join(', ');
      const logMsg = `${newActivePlayer.name} mengambil ${takenCards.length} kartu sayur (${veggieList})${eventSuffix}.`;

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

      const logMsg = `${newActivePlayer.name} membalik kartu skor (${flippedCard.scoringId}) menjadi sayur ${flippedCard.resource}.`;

      return {
        ...state,
        players: newPlayers,
        log: [...state.log, logMsg],
      };
    }

    case 'USE_SKILL_REFRESH_MARKET': {
      if (state.gameMode !== 'special') {
        throw new Error('Skills are only available in Special Mode.');
      }
      if (state.hasTakenMainActionThisTurn) {
        throw new Error('Skills can only be used before taking your main action.');
      }
      if (activePlayer.assignedSkill !== 'refresh_market' || activePlayer.skillUsed) {
        throw new Error('Refresh Market skill is not available for this player.');
      }

      const rng = createRNG(state.seed + state.turnCount * 97 + 13);
      const oldMarketCards: Card[] = [];
      const filledSlotIndices: number[] = [];
      for (let i = 0; i < 6; i++) {
        const c = state.market.resourceSlots[i];
        if (c) {
          oldMarketCards.push(c);
          filledSlotIndices.push(i);
        }
      }
      const currentSlotsCount = filledSlotIndices.length;

      // 1. Collect candidate replacement cards from draw piles FIRST (excluding current board cards!)
      const pileLengths = state.market.piles.map((p) => p.length);
      const pilePool: Card[] = [];
      for (const p of state.market.piles) {
        pilePool.push(...p);
      }
      const shuffledPilePool = shuffle(pilePool, rng);

      // Prioritize cards from pilePool whose resource differs from the old slot's resource
      const remainingPool = [...shuffledPilePool];
      const newResourceSlots: (Card | null)[] = [null, null, null, null, null, null];
      const newDiscardedCards = [...state.discardedCards];
      const unplacedOldCards: Card[] = [];

      for (let idx = 0; idx < filledSlotIndices.length; idx++) {
        const slotIdx = filledSlotIndices[idx];
        const oldCard = oldMarketCards[idx];

        // Try to pick a card from remainingPool with a DIFFERENT resource than oldCard
        let pickedPoolIdx = remainingPool.findIndex((c) => c.resource !== oldCard.resource);
        if (pickedPoolIdx === -1 && remainingPool.length > 0) {
          pickedPoolIdx = 0;
        }

        if (pickedPoolIdx !== -1) {
          const [replacement] = remainingPool.splice(pickedPoolIdx, 1);
          newResourceSlots[slotIdx] = replacement;
          unplacedOldCards.push(oldCard);
        } else if (newDiscardedCards.length > 0) {
          // Draw piles are empty! Pull a fresh card from discardedCards (prefer different resource)
          const shuffledDiscard = shuffle(newDiscardedCards, rng);
          let discIdx = shuffledDiscard.findIndex((c) => c.resource !== oldCard.resource);
          if (discIdx === -1) discIdx = 0;
          const [fromDiscard] = shuffledDiscard.splice(discIdx, 1);
          newResourceSlots[slotIdx] = fromDiscard;
          shuffledDiscard.push(oldCard);
          newDiscardedCards.length = 0;
          newDiscardedCards.push(...shuffledDiscard);
        } else {
          // Both piles and discardedCards are empty (e.g. 108-card endgame):
          // Mutate this card's vegetable to a guaranteed different vegetable!
          const otherResources = ALL_RESOURCES.filter((r) => r !== oldCard.resource);
          const newRes = otherResources[Math.floor(rng() * otherResources.length)];
          newResourceSlots[slotIdx] = {
            ...oldCard,
            resource: newRes,
          };
        }

        // Final guarantee: if the chosen card STILL has the exact same resource as oldCard,
        // shift its resource to a different vegetable so the slot visibly refreshes!
        const assigned = newResourceSlots[slotIdx];
        if (assigned && assigned.resource === oldCard.resource) {
          const otherResources = ALL_RESOURCES.filter((r) => r !== oldCard.resource);
          const newRes = otherResources[Math.floor(rng() * otherResources.length)];
          newResourceSlots[slotIdx] = {
            ...assigned,
            resource: newRes,
          };
        }
      }

      // Return the old market cards back into the draw piles and shuffle
      const rebuiltPilePool = shuffle([...remainingPool, ...unplacedOldCards], rng);
      const newPiles: [Card[], Card[], Card[]] = [[], [], []];
      let cursor = 0;
      for (let p = 0; p < 3; p++) {
        const len = pileLengths[p];
        newPiles[p] = rebuiltPilePool.slice(cursor, cursor + len);
        cursor += len;
      }
      if (cursor < rebuiltPilePool.length) {
        newPiles[0].push(...rebuiltPilePool.slice(cursor));
      }

      const newPlayers = clonePlayers(state.players);
      newPlayers[state.currentTurnPlayerIndex].skillUsed = true;

      return {
        ...state,
        players: newPlayers,
        discardedCards: newDiscardedCards,
        market: {
          ...state.market,
          piles: newPiles,
          resourceSlots: newResourceSlots,
        },
        log: [
          ...state.log,
          `${activePlayer.name} memakai Skill 🔄 Kocok Pasar (${currentSlotsCount} sayur diperbarui)!`,
        ],
      };
    }

    case 'USE_SKILL_GRAB_THREE': {
      if (state.gameMode !== 'special') {
        throw new Error('Skills are only available in Special Mode.');
      }
      if (state.hasTakenMainActionThisTurn) {
        throw new Error('Skills can only be used before taking your main action.');
      }
      if (activePlayer.assignedSkill !== 'grab_three' || activePlayer.skillUsed) {
        throw new Error('Grab Three skill is not available for this player.');
      }

      const newPlayers = clonePlayers(state.players);
      newPlayers[state.currentTurnPlayerIndex].skillUsed = true;

      return {
        ...state,
        players: newPlayers,
        extraVeggieAllowance: Math.max(1, state.extraVeggieAllowance ?? 0),
        log: [
          ...state.log,
          `${activePlayer.name} memakai Skill 🧲 Ambil 3 Sayur untuk giliran ini!`,
        ],
      };
    }

    case 'USE_SKILL_SWAP_VEGGIE': {
      if (state.gameMode !== 'special') {
        throw new Error('Skills are only available in Special Mode.');
      }
      if (state.hasTakenMainActionThisTurn) {
        throw new Error('Skills can only be used before taking your main action.');
      }
      if (activePlayer.assignedSkill !== 'swap_veggie' || activePlayer.skillUsed) {
        throw new Error('Swap Veggie skill is not available for this player.');
      }
      const { targetPlayerIndex, myResource, targetResource } = action;
      if (
        targetPlayerIndex < 0 ||
        targetPlayerIndex >= state.players.length ||
        targetPlayerIndex === state.currentTurnPlayerIndex
      ) {
        throw new Error('Invalid target player for Swap Veggie.');
      }

      const newPlayers = clonePlayers(state.players);
      const me = newPlayers[state.currentTurnPlayerIndex];
      const target = newPlayers[targetPlayerIndex];

      if ((me.resources[myResource] ?? 0) < 1) {
        throw new Error(`You do not have any ${myResource} to swap.`);
      }
      if ((target.resources[targetResource] ?? 0) < 1) {
        throw new Error(`${target.name} does not have any ${targetResource} to swap.`);
      }

      me.resources[myResource] -= 1;
      me.resources[targetResource] = (me.resources[targetResource] ?? 0) + 1;
      target.resources[targetResource] -= 1;
      target.resources[myResource] = (target.resources[myResource] ?? 0) + 1;
      me.skillUsed = true;

      return {
        ...state,
        players: newPlayers,
        log: [
          ...state.log,
          `${me.name} memakai Skill 🎭 Tukar Sayur: menukar ${myResource} dengan ${targetResource} milik ${target.name}!`,
        ],
      };
    }

    case 'USE_SKILL_GOLDEN_TOUCH': {
      if (state.gameMode !== 'special') {
        throw new Error('Skills are only available in Special Mode.');
      }
      if (state.hasTakenMainActionThisTurn) {
        throw new Error('Skills can only be used before taking your main action.');
      }
      if (activePlayer.assignedSkill !== 'golden_touch' || activePlayer.skillUsed) {
        throw new Error('Golden Touch skill is not available for this player.');
      }

      const filledIndices: number[] = [];
      for (let i = 0; i < state.market.resourceSlots.length; i++) {
        if (state.market.resourceSlots[i] !== null) {
          filledIndices.push(i);
        }
      }
      if (filledIndices.length === 0) {
        throw new Error('No vegetables available on the board to turn golden.');
      }

      const rng = createRNG(state.seed + state.turnCount * 53 + 7);
      const goldenSlot = filledIndices[Math.floor(rng() * filledIndices.length)];
      const newPlayers = clonePlayers(state.players);
      newPlayers[state.currentTurnPlayerIndex].skillUsed = true;

      return {
        ...state,
        players: newPlayers,
        activeEvent: { type: 'golden_veggie', slotIndex: goldenSlot, bonusPoints: 3 },
        log: [
          ...state.log,
          `${activePlayer.name} memakai Skill ✨ Sentuhan Emas! 1 sayur di talenan berubah jadi Emas (+3 poin)!`,
        ],
      };
    }

    case 'USE_SKILL_STEAL_VEGGIE': {
      if (state.gameMode !== 'special') {
        throw new Error('Skills are only available in Special Mode.');
      }
      if (state.hasTakenMainActionThisTurn) {
        throw new Error('Skills can only be used before taking your main action.');
      }
      if (activePlayer.assignedSkill !== 'steal_veggie' || activePlayer.skillUsed) {
        throw new Error('Steal Veggie skill is not available for this player.');
      }
      const { targetPlayerIndex, targetResource } = action;
      if (
        targetPlayerIndex < 0 ||
        targetPlayerIndex >= state.players.length ||
        targetPlayerIndex === state.currentTurnPlayerIndex
      ) {
        throw new Error('Invalid target player for Steal Veggie.');
      }

      const newPlayers = clonePlayers(state.players);
      const me = newPlayers[state.currentTurnPlayerIndex];
      const target = newPlayers[targetPlayerIndex];

      if ((target.resources[targetResource] ?? 0) < 1) {
        throw new Error(`${target.name} does not have any ${targetResource} to steal.`);
      }

      target.resources[targetResource] -= 1;
      me.resources[targetResource] = (me.resources[targetResource] ?? 0) + 1;
      me.skillUsed = true;

      return {
        ...state,
        players: newPlayers,
        log: [
          ...state.log,
          `${me.name} memakai Skill 🦝 Curi Sayur: mencuri 1 ${targetResource} milik ${target.name}!`,
        ],
      };
    }

    case 'USE_SKILL_CLONE_VEGGIE': {
      if (state.gameMode !== 'special') {
        throw new Error('Skills are only available in Special Mode.');
      }
      if (state.hasTakenMainActionThisTurn) {
        throw new Error('Skills can only be used before taking your main action.');
      }
      if (activePlayer.assignedSkill !== 'clone_veggie' || activePlayer.skillUsed) {
        throw new Error('Clone Veggie skill is not available for this player.');
      }

      const { myResource } = action;
      const newPlayers = clonePlayers(state.players);
      const me = newPlayers[state.currentTurnPlayerIndex];

      if ((me.resources[myResource] ?? 0) < 1) {
        throw new Error(`You need at least 1 ${myResource} to duplicate.`);
      }

      me.resources[myResource] += 1;
      me.skillUsed = true;

      return {
        ...state,
        players: newPlayers,
        log: [
          ...state.log,
          `${me.name} memakai Skill 🧬 Gandakan Sayur: mendapat +1 ${myResource} tambahan!`,
        ],
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

      // 3. Advance to next player & roll random Market Event for Special Mode
      const nextPlayerIndex = (state.currentTurnPlayerIndex + 1) % state.players.length;
      const nextTurnCount = state.turnCount + 1;
      const nextPlayerName = state.players[nextPlayerIndex].name;
      const nextEvent = rollMarketEvent(
        refilledMarket,
        state.seed,
        nextTurnCount,
        state.gameMode ?? 'classic'
      );

      const updatedState: GameState = {
        ...stateWithRefilledMarket,
        currentTurnPlayerIndex: nextPlayerIndex,
        turnCount: nextTurnCount,
        hasTakenMainActionThisTurn: false,
        turnSubPhase: 'action',
        extraVeggieAllowance: nextEvent?.type === 'bountiful_harvest' ? 1 : 0,
        activeEvent: nextEvent,
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
