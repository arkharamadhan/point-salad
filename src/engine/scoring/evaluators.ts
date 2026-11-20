import {
  BalancedParams,
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
  ResourceCounts,
  ALL_RESOURCES,
} from '../types';

/**
 * 1. perItem:
 * Sum points * count for each item specified. Points may be negative.
 */
export function evaluatePerItem(resources: ResourceCounts, params: PerItemParams): number {
  let total = 0;
  for (const item of params.items) {
    total += item.points * (resources[item.resource] ?? 0);
  }
  return total;
}

/**
 * 2. perSet:
 * points * count of complete sets. Complete set = min(count of each resource in the set).
 */
export function evaluatePerSet(resources: ResourceCounts, params: PerSetParams): number {
  if (params.set.length === 0) return 0;
  let minCount = Infinity;
  for (const res of params.set) {
    const count = resources[res] ?? 0;
    if (count < minCount) {
      minCount = count;
    }
  }
  return (minCount === Infinity ? 0 : minCount) * params.points;
}

/**
 * 3. perDistinctSet:
 * points * m, where m is the largest integer satisfying:
 * sum(min(count_i, m)) >= size * m (a set of `size` different resource types).
 * Each resource card belongs to at most one set.
 */
export function evaluatePerDistinctSet(
  resources: ResourceCounts,
  params: PerDistinctSetParams
): number {
  const size = params.size;
  if (size <= 0) return 0;

  const counts = ALL_RESOURCES.map((r) => resources[r] ?? 0);
  const totalCards = counts.reduce((acc, c) => acc + c, 0);
  const maxPossibleM = Math.floor(totalCards / size);

  let largestM = 0;
  for (let m = 1; m <= maxPossibleM; m++) {
    let sumMin = 0;
    for (const c of counts) {
      sumMin += Math.min(c, m);
    }
    if (sumMin >= size * m) {
      largestM = m;
    }
  }

  return largestM * params.points;
}

/**
 * 4. parity:
 * evenPoints if count is even (0 is even), oddPoints if count is odd.
 */
export function evaluateParity(resources: ResourceCounts, params: ParityParams): number {
  const count = resources[params.resource] ?? 0;
  const isEven = count % 2 === 0;
  return isEven ? params.evenPoints : params.oddPoints;
}

/**
 * 5. majority:
 * Compared across all players in the game.
 * mode 'most': highest count.
 * mode 'least': lowest count (0 is valid and counts).
 * Ties split points evenly, rounded down: Math.floor(points / tieCount).
 * If the card owner is not part of the best (most or least) tie/group, scores 0.
 */
export function evaluateMajority(
  targetPlayerIndex: number,
  allPlayers: PlayerState[],
  params: MajorityParams
): { score: number; tieCount: number; isWinner: boolean } {
  if (allPlayers.length === 0 || targetPlayerIndex < 0 || targetPlayerIndex >= allPlayers.length) {
    return { score: 0, tieCount: 0, isWinner: false };
  }

  const counts = allPlayers.map((p) => p.resources[params.resource] ?? 0);
  const targetCount = counts[targetPlayerIndex];

  if (params.mode === 'most') {
    const maxVal = Math.max(...counts);
    if (targetCount === maxVal) {
      const tieCount = counts.filter((c) => c === maxVal).length;
      const score = Math.floor(params.points / tieCount);
      return { score, tieCount, isWinner: true };
    }
    return { score: 0, tieCount: 0, isWinner: false };
  } else {
    // mode === 'least'
    const minVal = Math.min(...counts);
    if (targetCount === minVal) {
      const tieCount = counts.filter((c) => c === minVal).length;
      const score = Math.floor(params.points / tieCount);
      return { score, tieCount, isWinner: true };
    }
    return { score: 0, tieCount: 0, isWinner: false };
  }
}

/**
 * 6. perTypeAtLeast:
 * points for each of the 6 spice types that has count >= threshold.
 */
export function evaluatePerTypeAtLeast(
  resources: ResourceCounts,
  params: PerTypeAtLeastParams
): number {
  let qualifyingTypes = 0;
  for (const res of ALL_RESOURCES) {
    if ((resources[res] ?? 0) >= params.threshold) {
      qualifyingTypes++;
    }
  }
  return qualifyingTypes * params.points;
}

/**
 * 7. perMissingType:
 * points for each of the 6 spice types that has count === 0.
 */
export function evaluatePerMissingType(
  resources: ResourceCounts,
  params: PerMissingTypeParams
): number {
  let missingTypes = 0;
  for (const res of ALL_RESOURCES) {
    if ((resources[res] ?? 0) === 0) {
      missingTypes++;
    }
  }
  return missingTypes * params.points;
}

/**
 * 8. perPairAny:
 * points * sum(floor(count / 2)) across all 6 spice types.
 */
export function evaluatePerPairAny(
  resources: ResourceCounts,
  params: PerPairAnyParams
): number {
  let totalPairs = 0;
  for (const res of ALL_RESOURCES) {
    const count = resources[res] ?? 0;
    totalPairs += Math.floor(count / 2);
  }
  return totalPairs * params.points;
}

/**
 * 9. maxStack:
 * pointsPerCard * largest count among the 6 spice types.
 */
export function evaluateMaxStack(
  resources: ResourceCounts,
  params: MaxStackParams
): number {
  let maxCount = 0;
  for (const res of ALL_RESOURCES) {
    const count = resources[res] ?? 0;
    if (count > maxCount) {
      maxCount = count;
    }
  }
  return maxCount * params.pointsPerCard;
}

/**
 * 10. balanced:
 * points if (maxCount - minCount) <= maxDifference (counting all 6 types, including 0s); otherwise 0.
 */
export function evaluateBalanced(
  resources: ResourceCounts,
  params: BalancedParams
): number {
  const counts = ALL_RESOURCES.map((r) => resources[r] ?? 0);
  const maxVal = Math.max(...counts);
  const minVal = Math.min(...counts);
  const diff = maxVal - minVal;
  return diff <= params.maxDifference ? params.points : 0;
}
