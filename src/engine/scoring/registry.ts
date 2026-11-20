import cardsData from '../../data/cards.json';
import {
  BalancedParams,
  CardScoreDetail,
  FinalScoreReport,
  MajorityParams,
  MaxStackParams,
  ParityParams,
  PerDistinctSetParams,
  PerItemParams,
  PerMissingTypeParams,
  PerPairAnyParams,
  PerSetParams,
  PerTypeAtLeastParams,
  PlayerState,
  ScoringCondition,
  ScoringType,
} from '../types';
import {
  evaluateBalanced,
  evaluateMajority,
  evaluateMaxStack,
  evaluateParity,
  evaluatePerDistinctSet,
  evaluatePerItem,
  evaluatePerMissingType,
  evaluatePerPairAny,
  evaluatePerSet,
  evaluatePerTypeAtLeast,
} from './evaluators';

export const SCORING_CONDITIONS_MAP = new Map<string, ScoringCondition>();

// Populate registry from cardsData
for (const sc of cardsData.scoringConditions) {
  SCORING_CONDITIONS_MAP.set(sc.id, {
    id: sc.id,
    type: sc.type as ScoringType,
    params: sc.params as any,
    text: sc.text,
  });
}

/**
 * Pure evaluator for a single scoring card condition on a player.
 */
export function evaluateCard(
  cardId: string,
  scoringId: string,
  playerIndex: number,
  allPlayers: PlayerState[],
  lang: 'id' | 'en' = 'id'
): CardScoreDetail {
  const condition = SCORING_CONDITIONS_MAP.get(scoringId);
  if (!condition) {
    throw new Error(`Unknown scoring condition ID: ${scoringId}`);
  }

  const player = allPlayers[playerIndex];
  if (!player) {
    throw new Error(`Invalid player index: ${playerIndex}`);
  }

  const description = condition.text[lang] ?? condition.text.id;
  let score = 0;
  let isTentativeMajority = false;

  switch (condition.type) {
    case 'perItem':
      score = evaluatePerItem(player.resources, condition.params as PerItemParams);
      break;

    case 'perSet':
      score = evaluatePerSet(player.resources, condition.params as PerSetParams);
      break;

    case 'perDistinctSet':
      score = evaluatePerDistinctSet(
        player.resources,
        condition.params as PerDistinctSetParams
      );
      break;

    case 'parity':
      score = evaluateParity(player.resources, condition.params as ParityParams);
      break;

    case 'majority': {
      isTentativeMajority = true;
      const res = evaluateMajority(
        playerIndex,
        allPlayers,
        condition.params as MajorityParams
      );
      score = res.score;
      break;
    }

    case 'perTypeAtLeast':
      score = evaluatePerTypeAtLeast(
        player.resources,
        condition.params as PerTypeAtLeastParams
      );
      break;

    case 'perMissingType':
      score = evaluatePerMissingType(
        player.resources,
        condition.params as PerMissingTypeParams
      );
      break;

    case 'perPairAny':
      score = evaluatePerPairAny(
        player.resources,
        condition.params as PerPairAnyParams
      );
      break;

    case 'maxStack':
      score = evaluateMaxStack(
        player.resources,
        condition.params as MaxStackParams
      );
      break;

    case 'balanced':
      score = evaluateBalanced(
        player.resources,
        condition.params as BalancedParams
      );
      break;

    default:
      throw new Error(`Unhandled scoring condition type: ${(condition as any).type}`);
  }

  return {
    cardId,
    scoringId,
    score,
    isTentativeMajority,
    description,
  };
}

/**
 * Calculates total score and per-card breakdown for a player.
 * Evaluates all unflipped scoring cards against player's total resources.
 */
export function evaluatePlayerScore(
  playerIndex: number,
  allPlayers: PlayerState[],
  lang: 'id' | 'en' = 'id'
): { totalScore: number; cardScores: CardScoreDetail[] } {
  const player = allPlayers[playerIndex];
  if (!player) {
    return { totalScore: 0, cardScores: [] };
  }

  const cardScores: CardScoreDetail[] = [];
  let totalScore = 0;

  for (const card of player.scoringCards) {
    const detail = evaluateCard(card.id, card.scoringId, playerIndex, allPlayers, lang);
    cardScores.push(detail);
    totalScore += detail.score;
  }

  return { totalScore, cardScores };
}

/**
 * Computes scores and rankings for all players in the game,
 * adhering to RULES.md section 6 tiebreakers:
 * 1. Total score (highest wins)
 * 2. Total resources (including flipped cards)
 * 3. Total unflipped scoring cards
 * 4. Shared win
 */
export function calculateFinalScores(
  players: PlayerState[],
  lang: 'id' | 'en' = 'id'
): FinalScoreReport[] {
  const reports: FinalScoreReport[] = players.map((player, idx) => {
    const { totalScore, cardScores } = evaluatePlayerScore(idx, players, lang);
    const totalResources = Object.values(player.resources).reduce((a, b) => a + b, 0);
    const unflippedScoringCardsCount = player.scoringCards.length;

    return {
      playerId: player.id,
      playerName: player.name,
      totalScore,
      totalResources,
      unflippedScoringCardsCount,
      cardScores,
      rank: 1, // calculated below
    };
  });

  // Sort descending by tiebreakers
  reports.sort((a, b) => {
    // 1. Total score
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    // 2. Total resource cards
    if (b.totalResources !== a.totalResources) {
      return b.totalResources - a.totalResources;
    }
    // 3. Unflipped scoring cards
    if (b.unflippedScoringCardsCount !== a.unflippedScoringCardsCount) {
      return b.unflippedScoringCardsCount - a.unflippedScoringCardsCount;
    }
    // 4. Equal / Shared
    return 0;
  });

  // Assign ranks (handling ties)
  let currentRank = 1;
  for (let i = 0; i < reports.length; i++) {
    if (i > 0) {
      const prev = reports[i - 1];
      const curr = reports[i];
      const isTied =
        curr.totalScore === prev.totalScore &&
        curr.totalResources === prev.totalResources &&
        curr.unflippedScoringCardsCount === prev.unflippedScoringCardsCount;

      if (!isTied) {
        currentRank = i + 1;
      }
    }
    reports[i].rank = currentRank;
  }

  return reports;
}
