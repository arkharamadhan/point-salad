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
  ResourceId,
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
 * points * count of complete sets. Complete set = min(floor(resources[res] / requiredCount)).
 */
export function evaluatePerSet(resources: ResourceCounts, params: PerSetParams): number {
  if (params.set.length === 0) return 0;
  const requiredCounts: Partial<Record<ResourceId, number>> = {};
  for (const res of params.set) {
    requiredCounts[res] = (requiredCounts[res] ?? 0) + 1;
  }
  let minSets = Infinity;
  for (const [res, req] of Object.entries(requiredCounts) as [ResourceId, number][]) {
    const available = resources[res] ?? 0;
    const setsForThisRes = Math.floor(available / req);
    if (setsForThisRes < minSets) {
      minSets = setsForThisRes;
    }
  }
  return (minSets === Infinity ? 0 : minSets) * params.points;
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
 * evenPoints if count is even, oddPoints if count is odd.
 * Per official Point Salad rules: count of 0 is NOT counted as even (scores 0 points).
 */
export function evaluateParity(resources: ResourceCounts, params: ParityParams): number {
  const count = resources[params.resource] ?? 0;
  if (count === 0) return 0;
  const isEven = count % 2 === 0;
  return isEven ? params.evenPoints : params.oddPoints;
}

/**
 * 5. majority:
 * Compared across all players in the game (for a specific resource or total of all veggies).
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

  const counts = allPlayers.map((p) => {
    if (params.resource === 'all') {
      return ALL_RESOURCES.reduce((sum, r) => sum + (p.resources[r] ?? 0), 0);
    }
    return p.resources[params.resource] ?? 0;
  });
  const targetCount = counts[targetPlayerIndex];

  if (params.mode === 'most') {
    const maxVal = Math.max(...counts);
    if (targetCount === maxVal) {
      const tieCount = counts.filter((c) => c === maxVal).length;
      return { score: params.points, tieCount, isWinner: true };
    }
    return { score: 0, tieCount: 0, isWinner: false };
  } else {
    // mode === 'least'
    const minVal = Math.min(...counts);
    if (targetCount === minVal) {
      const tieCount = counts.filter((c) => c === minVal).length;
      return { score: params.points, tieCount, isWinner: true };
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
 * - If `params.resource` is specified: awards `params.points` (+5) when that specific veggie count === 0.
 * - Otherwise (generic fallback): awards `params.points` for each veggie type with count === 0.
 */
export function evaluatePerMissingType(
  resources: ResourceCounts,
  params: PerMissingTypeParams
): number {
  if (params.resource) {
    return (resources[params.resource] ?? 0) === 0 ? params.points : 0;
  }

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
