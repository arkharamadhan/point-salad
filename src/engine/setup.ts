import cardsData from '../data/cards.json';
import {
  ALL_RESOURCES,
  ALL_SKILLS,
  Card,
  GameMode,
  GameState,
  MarketEvent,
  MarketState,
  PlayerState,
  ResourceCounts,
  ResourceId,
} from './types';
import { createRNG, shuffle } from './rng';

export type DeckSizeOption = 36 | 54 | 72 | 90 | 108;

export interface SetupOptions {
  players: Array<{
    id: string;
    name: string;
    isBot?: boolean;
    botDifficulty?: 'easy' | 'greedy';
  }>;
  seed?: number;
  deckSize?: DeckSizeOption;
  gameMode?: GameMode;
}

/**
 * Deterministically rolls a random Market Event for a turn (~40% total chance):
 * - ~15% Golden Veggie (+3 bonus pts on an occupied veggie slot)
 * - ~15% Rotten Veggie (-2 penalty pts on an occupied veggie slot)
 * - ~10% Bountiful Harvest (may draft up to 3 veggies this turn)
 */
export function rollMarketEvent(
  market: MarketState,
  seed: number,
  turnCount: number,
  gameMode: GameMode
): MarketEvent | null {
  if (gameMode !== 'special') return null;

  const filledIndices: number[] = [];
  for (let i = 0; i < market.resourceSlots.length; i++) {
    if (market.resourceSlots[i] !== null) {
      filledIndices.push(i);
    }
  }
  if (filledIndices.length === 0) return null;

  const rng = createRNG(seed + turnCount * 313 + 17);
  const roll = rng();

  if (roll < 0.15) {
    const slotIndex = filledIndices[Math.floor(rng() * filledIndices.length)];
    return { type: 'golden_veggie', slotIndex, bonusPoints: 3 };
  }
  if (roll < 0.3) {
    const slotIndex = filledIndices[Math.floor(rng() * filledIndices.length)];
    return { type: 'rotten_veggie', slotIndex, penaltyPoints: -2 };
  }
  if (roll < 0.4 && filledIndices.length >= 3) {
    return { type: 'bountiful_harvest' };
  }
  return null;
}

export function createEmptyResourceCounts(): ResourceCounts {
  return {
    tomat: 0,
    wortel: 0,
    paprika: 0,
    selada: 0,
    bawang: 0,
    kubis: 0,
  };
}

/**
 * Validates and initializes a new game according to RULES.md section 3.
 */
export function initializeGame(options: SetupOptions): GameState {
  const playerCount = options.players.length;
  if (playerCount < 2 || playerCount > 6) {
    throw new Error(`Invalid player count: ${playerCount}. Must be between 2 and 6.`);
  }

  const seed = options.seed ?? Math.floor(Math.random() * 1000000);
  const rng = createRNG(seed);

  // Raw cards from cards.json (108 cards, 18 per resource)
  const rawCards: Card[] = cardsData.cards.map((c) => ({
    id: c.id,
    resource: c.resource as ResourceId,
    scoringId: c.scoring,
  }));

  if (rawCards.length !== 108) {
    throw new Error(`Expected 108 cards in cards.json, found ${rawCards.length}`);
  }

  // 1. Determine deck size (custom deckSize or automatic by player count):
  // Default: 2p=36, 3p=54, 4p=72, 5p=90, 6p=108
  const expectedTotalCards = options.deckSize ?? playerCount * 18;
  if (expectedTotalCards % 6 !== 0 || expectedTotalCards < 36 || expectedTotalCards > 108) {
    throw new Error(`Invalid deckSize: ${expectedTotalCards}. Must be 36, 54, 72, 90, or 108.`);
  }
  const keptPerResource = expectedTotalCards / 6;
  const removePerResource = 18 - keptPerResource;

  const usedCards: Card[] = [];
  const discardedCards: Card[] = [];

  for (const resource of ALL_RESOURCES) {
    const resourceCards = rawCards.filter((c) => c.resource === resource);
    if (resourceCards.length !== 18) {
      throw new Error(`Expected 18 cards for resource ${resource}, found ${resourceCards.length}`);
    }
    const shuffledResourceCards = shuffle(resourceCards, rng);
    const discarded = shuffledResourceCards.slice(0, removePerResource);
    const kept = shuffledResourceCards.slice(removePerResource);
    discardedCards.push(...discarded);
    usedCards.push(...kept);
  }

  // Shuffle the remaining cards
  const fullyShuffledCards = shuffle(usedCards, rng);

  // Divide into 3 equal draw piles
  if (fullyShuffledCards.length !== expectedTotalCards) {
    throw new Error(`Mismatch in used cards: expected ${expectedTotalCards}, got ${fullyShuffledCards.length}`);
  }

  const pileSize = expectedTotalCards / 3;
  const pile0 = fullyShuffledCards.slice(0, pileSize);
  const pile1 = fullyShuffledCards.slice(pileSize, pileSize * 2);
  const pile2 = fullyShuffledCards.slice(pileSize * 2);

  const piles: [Card[], Card[], Card[]] = [pile0, pile1, pile2];

  // 3. Fill initial market slots:
  // For each pile, top card goes to Scoring slot, next 2 cards go to Resource slots.
  // We represent "drawing from top" as popping or shifting from pile.
  // Let's use shift (front is top of pile) or pop (back is top of pile).
  // In array representation, let index 0 be the top of the pile!
  const scoringSlots: (Card | null)[] = [null, null, null];
  const resourceSlots: (Card | null)[] = [null, null, null, null, null, null];

  for (let p = 0; p < 3; p++) {
    // 1 scoring card
    const scoreCard = piles[p].shift();
    if (!scoreCard) throw new Error(`Pile ${p} was empty during initial setup`);
    scoringSlots[p] = scoreCard;

    // 2 resource cards (indices p*2 and p*2 + 1)
    const resCard1 = piles[p].shift();
    const resCard2 = piles[p].shift();
    if (!resCard1 || !resCard2) throw new Error(`Pile ${p} had insufficient cards for resource slots`);
    resourceSlots[p * 2] = resCard1;
    resourceSlots[p * 2 + 1] = resCard2;
  }

  // 4. Initialize players
  const gameMode: GameMode = options.gameMode ?? 'special';
  const players: PlayerState[] = options.players.map((p) => {
    const assignedSkill =
      gameMode === 'special'
        ? ALL_SKILLS[Math.floor(rng() * ALL_SKILLS.length)]
        : null;
    return {
      id: p.id,
      name: p.name,
      isBot: Boolean(p.isBot),
      botDifficulty: p.botDifficulty ?? (p.isBot ? 'greedy' : undefined),
      scoringCards: [],
      draftedResourceCards: [],
      flippedCards: [],
      resources: createEmptyResourceCounts(),
      assignedSkill,
      skillUsed: false,
      goldenBonusPoints: 0,
      rottenPenaltyPoints: 0,
    };
  });

  // 5. Starting player chosen at random using the seeded RNG
  const startingPlayerIndex = Math.floor(rng() * playerCount);
  const initialMarket: MarketState = {
    piles,
    scoringSlots,
    resourceSlots,
  };
  const initialEvent = rollMarketEvent(initialMarket, seed, 1, gameMode);

  return {
    players,
    currentTurnPlayerIndex: startingPlayerIndex,
    turnSubPhase: 'action',
    hasTakenMainActionThisTurn: false,
    market: initialMarket,
    phase: 'in_progress',
    turnCount: 1,
    discardedCards,
    seed,
    gameMode,
    extraVeggieAllowance: initialEvent?.type === 'bountiful_harvest' ? 1 : 0,
    activeEvent: initialEvent,
    log: [`Game started with seed ${seed}. Player ${players[startingPlayerIndex].name} goes first.`],
  };
}
