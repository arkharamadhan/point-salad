import { describe, it, expect } from 'vitest';
import { createRNG, shuffle, randomInt } from '../../src/engine/rng';

describe('RNG and Shuffle', () => {
  it('generates deterministic sequences given the same seed', () => {
    const rng1 = createRNG(12345);
    const rng2 = createRNG(12345);

    const seq1 = [rng1(), rng1(), rng1(), rng1()];
    const seq2 = [rng2(), rng2(), rng2(), rng2()];

    expect(seq1).toEqual(seq2);
  });

  it('generates different sequences for different seeds', () => {
    const rng1 = createRNG(111);
    const rng2 = createRNG(222);

    expect(rng1()).not.toEqual(rng2());
  });

  it('shuffles arrays deterministically and does not mutate the original array', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const rng1 = createRNG(999);
    const rng2 = createRNG(999);

    const shuffled1 = shuffle(original, rng1);
    const shuffled2 = shuffle(original, rng2);

    expect(shuffled1).toEqual(shuffled2);
    expect(shuffled1).toHaveLength(original.length);
    expect(new Set(shuffled1)).toEqual(new Set(original));
    // Verify pure function (original not modified)
    expect(original).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('generates randomInt within inclusive bounds', () => {
    const rng = createRNG(42);
    for (let i = 0; i < 100; i++) {
      const val = randomInt(2, 5, rng);
      expect(val).toBeGreaterThanOrEqual(2);
      expect(val).toBeLessThanOrEqual(5);
    }
  });
});
