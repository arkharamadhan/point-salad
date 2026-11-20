import { describe, it, expect } from 'vitest';
import {
  evaluatePerItem,
  evaluatePerSet,
  evaluatePerDistinctSet,
  evaluateParity,
  evaluateMajority,
  evaluatePerTypeAtLeast,
  evaluatePerMissingType,
  evaluatePerPairAny,
  evaluateMaxStack,
  evaluateBalanced,
} from '../../src/engine/scoring/evaluators';
import {
  evaluateCard,
  evaluatePlayerScore,
} from '../../src/engine/scoring/registry';
import { PlayerState, ResourceCounts } from '../../src/engine/types';
import { createEmptyResourceCounts } from '../../src/engine/setup';

function makePlayer(
  id: string,
  name: string,
  resources: Partial<ResourceCounts> = {},
  scoringCards: Array<{ id: string; resource: any; scoringId: string }> = []
): PlayerState {
  const fullResources: ResourceCounts = {
    ...createEmptyResourceCounts(),
    ...resources,
  };
  return {
    id,
    name,
    isBot: false,
    scoringCards,
    draftedResourceCards: [],
    flippedCards: [],
    resources: fullResources,
  };
}

describe('Pure Scoring Evaluators (RULES.md section 6)', () => {
  it('1. evaluatePerItem handles positive, negative, and zero points', () => {
    const res: ResourceCounts = {
      wortel: 4,
      paprika: 2,
      tomat: 0,
      bawang: 0,
      kubis: 0,
      selada: 1,
    };
    // S01: +3 jahe, -1 lada -> 4*3 - 1*1 = 11
    const score = evaluatePerItem(res, {
      items: [
        { resource: 'wortel', points: 3 },
        { resource: 'selada', points: -1 },
      ],
    });
    expect(score).toBe(11);

    // Negative total is allowed
    const scoreNeg = evaluatePerItem(res, {
      items: [
        { resource: 'wortel', points: 1 },
        { resource: 'selada', points: -10 },
      ],
    });
    expect(scoreNeg).toBe(-6);
  });

  it('2. evaluatePerSet computes points based on minimum count in set', () => {
    const res: ResourceCounts = {
      wortel: 4,
      paprika: 2,
      tomat: 5,
      bawang: 0,
      kubis: 0,
      selada: 0,
    };
    // S07: 4 pts per set (wortel + kunyit) -> min(4, 2) = 2 -> 8 pts
    const score = evaluatePerSet(res, {
      set: ['wortel', 'paprika'],
      points: 4,
    });
    expect(score).toBe(8);

    // If one ingredient is missing, score is 0
    const scoreMissing = evaluatePerSet(res, {
      set: ['wortel', 'bawang'],
      points: 4,
    });
    expect(scoreMissing).toBe(0);
  });

  it('3. evaluatePerDistinctSet computes max disjoint sets using RULES.md formula', () => {
    // 3 different types, 2 pts each
    const res: ResourceCounts = {
      wortel: 4,
      paprika: 2,
      tomat: 1,
      bawang: 0,
      kubis: 0,
      selada: 0,
    };
    // Distinct set of size 3:
    // m=1: min(4,1)+min(2,1)+min(1,1) = 3 >= 3*1 -> yes
    // m=2: min(4,2)+min(2,2)+min(1,2) = 5 < 6 -> no
    // score = 1 * 2 = 2
    const score = evaluatePerDistinctSet(res, { size: 3, points: 2 });
    expect(score).toBe(2);

    // Size 6: 1 of each
    const allSix: ResourceCounts = {
      wortel: 2,
      paprika: 2,
      tomat: 2,
      bawang: 2,
      kubis: 2,
      selada: 2,
    };
    const scoreSix = evaluatePerDistinctSet(allSix, { size: 6, points: 6 });
    expect(scoreSix).toBe(12); // 2 sets * 6 pts = 12
  });

  it('4. evaluateParity handles even (including 0) and odd points', () => {
    const resEven: ResourceCounts = {
      ...createEmptyResourceCounts(),
      wortel: 0, // 0 is even
    };
    expect(
      evaluateParity(resEven, { resource: 'wortel', evenPoints: 7, oddPoints: 3 })
    ).toBe(7);

    const resOdd: ResourceCounts = {
      ...createEmptyResourceCounts(),
      wortel: 3,
    };
    expect(
      evaluateParity(resOdd, { resource: 'wortel', evenPoints: 7, oddPoints: 3 })
    ).toBe(3);
  });

  it('5. evaluateMajority handles most, least, ties (split points rounded down), and 0 counts', () => {
    const p1 = makePlayer('p1', 'Alice', { wortel: 5, bawang: 0 });
    const p2 = makePlayer('p2', 'Bob', { wortel: 5, bawang: 0 });
    const p3 = makePlayer('p3', 'Charlie', { wortel: 2, bawang: 3 });
    const players = [p1, p2, p3];

    // Majority most: p1 and p2 tie with 5 jahe. Points = 10 / 2 = 5 each.
    const resP1Most = evaluateMajority(0, players, {
      resource: 'wortel',
      mode: 'most',
      points: 10,
    });
    expect(resP1Most.score).toBe(5);
    expect(resP1Most.isWinner).toBe(true);
    expect(resP1Most.tieCount).toBe(2);

    // p3 does not have most
    const resP3Most = evaluateMajority(2, players, {
      resource: 'wortel',
      mode: 'most',
      points: 10,
    });
    expect(resP3Most.score).toBe(0);
    expect(resP3Most.isWinner).toBe(false);

    // Majority least: p1 and p2 tie with 0 cengkeh. 0 is valid! Points = 8 / 2 = 4.
    const resP1Least = evaluateMajority(0, players, {
      resource: 'bawang',
      mode: 'least',
      points: 8,
    });
    expect(resP1Least.score).toBe(4);
    expect(resP1Least.isWinner).toBe(true);

    const resP3Least = evaluateMajority(2, players, {
      resource: 'bawang',
      mode: 'least',
      points: 8,
    });
    expect(resP3Least.score).toBe(0);
  });

  it('6. evaluatePerTypeAtLeast scores points for each type reaching threshold', () => {
    const res: ResourceCounts = {
      wortel: 3,
      paprika: 4,
      tomat: 2,
      bawang: 0,
      kubis: 5,
      selada: 3,
    };
    // Threshold 3: jahe(3), kunyit(4), pala(5), lada(3) -> 4 types * 3 pts = 12
    const score = evaluatePerTypeAtLeast(res, { threshold: 3, points: 3 });
    expect(score).toBe(12);
  });

  it('7. evaluatePerMissingType scores points for each type with count 0', () => {
    const res: ResourceCounts = {
      wortel: 3,
      paprika: 0,
      tomat: 0,
      bawang: 1,
      kubis: 0,
      selada: 2,
    };
    // Missing types: kunyit, kayu_manis, pala -> 3 types * 6 pts = 18
    const score = evaluatePerMissingType(res, { points: 6 });
    expect(score).toBe(18);
  });

  it('8. evaluatePerPairAny sums floor(count / 2) across all 6 types', () => {
    const res: ResourceCounts = {
      wortel: 3, // 1 pair
      paprika: 4, // 2 pairs
      tomat: 1, // 0 pairs
      bawang: 2, // 1 pair
      kubis: 5, // 2 pairs
      selada: 0, // 0 pairs
    };
    // Total pairs = 1 + 2 + 0 + 1 + 2 + 0 = 6 pairs * 1 pt = 6
    const score = evaluatePerPairAny(res, { points: 1 });
    expect(score).toBe(6);
  });

  it('9. evaluateMaxStack scores pointsPerCard * largest count', () => {
    const res: ResourceCounts = {
      wortel: 1,
      paprika: 2,
      tomat: 6,
      bawang: 3,
      kubis: 4,
      selada: 0,
    };
    // Max stack is kayu_manis with 6. 6 * 2 = 12
    const score = evaluateMaxStack(res, { pointsPerCard: 2 });
    expect(score).toBe(12);
  });

  it('10. evaluateBalanced scores points if max - min <= maxDifference across all 6 types', () => {
    // Including 0s!
    const resUnbalanced: ResourceCounts = {
      wortel: 3,
      paprika: 2,
      tomat: 3,
      bawang: 2,
      kubis: 3,
      selada: 0, // min is 0! max is 3. diff = 3 > 2 -> 0 pts
    };
    expect(evaluateBalanced(resUnbalanced, { maxDifference: 2, points: 12 })).toBe(0);

    const resBalanced: ResourceCounts = {
      wortel: 2,
      paprika: 2,
      tomat: 3,
      bawang: 1,
      kubis: 2,
      selada: 2, // min is 1, max is 3. diff = 2 <= 2 -> 12 pts
    };
    expect(evaluateBalanced(resBalanced, { maxDifference: 2, points: 12 })).toBe(12);
  });
});

describe('Registry & Player Score Evaluation', () => {
  it('correctly evaluates all 30 conditions registered from cards.json', () => {
    const player = makePlayer('p1', 'Player', {
      wortel: 3,
      paprika: 3,
      tomat: 3,
      bawang: 3,
      kubis: 3,
      selada: 3,
    });
    const players = [player];

    for (let i = 1; i <= 30; i++) {
      const scoringId = `S${String(i).padStart(2, '0')}`;
      const result = evaluateCard(`C${i}`, scoringId, 0, players);
      expect(typeof result.score).toBe('number');
      expect(result.description.length).toBeGreaterThan(0);
    }
  });

  it('evaluates example from RULES.md section 7 correctly', () => {
    // RULES.md Section 7:
    // Jahe 4, Kunyit 2, Kayu Manis 3, Cengkeh 0, Pala 5, Lada 1
    // S01: "+3 per Jahe, -1 per Lada" -> 4*3 - 1*1 = 11
    // S07: "4 poin per set Jahe + Kunyit" -> min(4, 2) = 2 set -> 8
    // Total = 19
    const player = makePlayer(
      'p1',
      'TestPlayer',
      {
        wortel: 4,
        paprika: 2,
        tomat: 3,
        bawang: 0,
        kubis: 5,
        selada: 1,
      },
      [
        { id: 'c1', resource: 'wortel', scoringId: 'S01' },
        { id: 'c2', resource: 'paprika', scoringId: 'S07' },
      ]
    );

    const evalResult = evaluatePlayerScore(0, [player]);
    expect(evalResult.totalScore).toBe(19);
    expect(evalResult.cardScores).toHaveLength(2);
    expect(evalResult.cardScores[0].score).toBe(11);
    expect(evalResult.cardScores[1].score).toBe(8);
  });

  it('handles invalid inputs and errors in registry', () => {
    const player = makePlayer('p1', 'Alice');
    expect(() => evaluateCard('c1', 'INVALID_SCORING_ID', 0, [player])).toThrowError(
      /Unknown scoring condition ID/
    );
    expect(() => evaluateCard('c1', 'S01', 99, [player])).toThrowError(
      /Invalid player index/
    );
    expect(evaluatePlayerScore(99, [player])).toEqual({ totalScore: 0, cardScores: [] });
  });
});
