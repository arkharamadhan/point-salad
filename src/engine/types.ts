export type ResourceId = 'tomat' | 'wortel' | 'paprika' | 'selada' | 'bawang' | 'kubis';

export const ALL_RESOURCES: readonly ResourceId[] = [
  'tomat',
  'wortel',
  'paprika',
  'selada',
  'bawang',
  'kubis',
] as const;

export type ResourceCounts = Record<ResourceId, number>;

export type ScoringType =
  | 'perItem'
  | 'perSet'
  | 'perDistinctSet'
  | 'parity'
  | 'majority'
  | 'perTypeAtLeast'
  | 'perMissingType'
  | 'perPairAny'
  | 'maxStack'
  | 'balanced';

export interface PerItemParams {
  items: Array<{ resource: ResourceId; points: number }>;
}

export interface PerSetParams {
  set: ResourceId[];
  points: number;
}

export interface PerDistinctSetParams {
  size: number;
  points: number;
}

export interface ParityParams {
  resource: ResourceId;
  evenPoints: number;
  oddPoints: number;
}

export interface MajorityParams {
  resource: ResourceId | 'all';
  mode: 'most' | 'least';
  points: number;
}

export interface PerTypeAtLeastParams {
  threshold: number;
  points: number;
}

export interface PerMissingTypeParams {
  resource?: ResourceId;
  points: number;
}

export interface PerPairAnyParams {
  points: number;
}

export interface MaxStackParams {
  pointsPerCard: number;
}

export interface BalancedParams {
  maxDifference: number;
  points: number;
}

export type ScoringParams =
  | PerItemParams
  | PerSetParams
  | PerDistinctSetParams
  | ParityParams
  | MajorityParams
  | PerTypeAtLeastParams
  | PerMissingTypeParams
  | PerPairAnyParams
  | MaxStackParams
  | BalancedParams;

export interface ScoringCondition {
  id: string;
  type: ScoringType;
  params: ScoringParams;
  text: {
    id: string;
    en: string;
  };
}

export interface Card {
  id: string;
  resource: ResourceId;
  scoringId: string;
}

export type GameMode = 'classic' | 'special';

export type SkillId =
  | 'refresh_market'
  | 'grab_three'
  | 'swap_veggie'
  | 'golden_touch'
  | 'steal_veggie'
  | 'clone_veggie';

export const ALL_SKILLS: readonly SkillId[] = [
  'refresh_market',
  'grab_three',
  'swap_veggie',
  'golden_touch',
  'steal_veggie',
  'clone_veggie',
] as const;

export type MarketEvent =
  | { type: 'golden_veggie'; slotIndex: number; bonusPoints: number }
  | { type: 'rotten_veggie'; slotIndex: number; penaltyPoints: number }
  | { type: 'bountiful_harvest' };

export interface PlayerState {
  id: string;
  name: string;
  isBot: boolean;
  botDifficulty?: 'easy' | 'greedy';
  scoringCards: Card[];
  draftedResourceCards: Card[];
  flippedCards: Card[];
  resources: ResourceCounts;
  assignedSkill?: SkillId | null;
  skillUsed?: boolean;
  goldenBonusPoints?: number;
  rottenPenaltyPoints?: number;
}

export interface MarketState {
  piles: [Card[], Card[], Card[]];
  scoringSlots: (Card | null)[]; // 3 slots (0, 1, 2 corresponding to piles 1, 2, 3)
  resourceSlots: (Card | null)[]; // 6 slots (0..5: 0-1 from pile 1, 2-3 from pile 2, 4-5 from pile 3)
}

export type TurnSubPhase = 'action' | 'post_action';

export interface CardScoreDetail {
  cardId: string;
  scoringId: string;
  score: number;
  isTentativeMajority?: boolean;
  description: string;
}

export interface FinalScoreReport {
  playerId: string;
  playerName: string;
  totalScore: number;
  totalResources: number;
  unflippedScoringCardsCount: number;
  cardScores: CardScoreDetail[];
  rank: number;
}

export interface GameState {
  players: PlayerState[];
  currentTurnPlayerIndex: number;
  turnSubPhase: TurnSubPhase;
  hasTakenMainActionThisTurn: boolean;
  market: MarketState;
  phase: 'in_progress' | 'game_over';
  turnCount: number;
  discardedCards: Card[];
  seed: number;
  log: string[];
  winnerIds?: string[];
  finalScores?: FinalScoreReport[];
  gameMode?: GameMode;
  extraVeggieAllowance?: number;
  activeEvent?: MarketEvent | null;
}

export type GameAction =
  | { type: 'TAKE_RESOURCES'; slotIndices: number[] }
  | { type: 'TAKE_SCORING_MARKET'; slotIndex: number }
  | { type: 'TAKE_SCORING_PILE'; pileIndex: number }
  | { type: 'FLIP_CARD'; cardId: string }
  | { type: 'USE_SKILL_REFRESH_MARKET' }
  | { type: 'USE_SKILL_GRAB_THREE' }
  | {
      type: 'USE_SKILL_SWAP_VEGGIE';
      targetPlayerIndex: number;
      myResource: ResourceId;
      targetResource: ResourceId;
    }
  | { type: 'USE_SKILL_GOLDEN_TOUCH' }
  | {
      type: 'USE_SKILL_STEAL_VEGGIE';
      targetPlayerIndex: number;
      targetResource: ResourceId;
    }
  | {
      type: 'USE_SKILL_CLONE_VEGGIE';
      myResource: ResourceId;
    }
  | { type: 'END_TURN' };
