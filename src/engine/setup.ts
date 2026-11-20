import cardsData from '../data/cards.json';
import { Card, GameState, PlayerState, ResourceCounts, ResourceId, ALL_RESOURCES } from './types';
import { createRNG, shuffle } from './rng';

export interface SetupOptions {
  players: Array<{
    id: string;
    name: string;
    isBot?: boolean;
    botDifficulty?: 'easy' | 'greedy';
  }>;
  seed?: number;
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

  // 1. Remove cards per resource according to player count:
  // 2 players: keep 6 per resource (12 removed, 36 used)
  // 3 players: keep 9 per resource (9 removed, 54 used)
  // 4 players: keep 12 per resource (6 removed, 72 used)
  // 5 players: keep 15 per resource (3 removed, 90 used)
  // 6 players: keep 18 per resource (0 removed, 108 used)
  const keptPerResource = playerCount * 3;
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
  const expectedTotalCards = playerCount * 18;
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
  const players: PlayerState[] = options.players.map((p) => ({
    id: p.id,
    name: p.name,
    isBot: Boolean(p.isBot),
    botDifficulty: p.botDifficulty ?? (p.isBot ? 'greedy' : undefined),
    scoringCards: [],
    draftedResourceCards: [],
    flippedCards: [],
    resources: createEmptyResourceCounts(),
  }));

  // 5. Starting player chosen at random using the seeded RNG
  const startingPlayerIndex = Math.floor(rng() * playerCount);

  return {
    players,
    currentTurnPlayerIndex: startingPlayerIndex,
    turnSubPhase: 'action',
    hasTakenMainActionThisTurn: false,
    market: {
      piles,
      scoringSlots,
      resourceSlots,
    },
    phase: 'in_progress',
    turnCount: 1,
    discardedCards,
    seed,
    log: [`Game started with seed ${seed}. Player ${players[startingPlayerIndex].name} goes first.`],
  };
}
