import * as fc from 'fast-check';
import {
  POINT_BUY_BUDGET,
  STANDARD_ARRAY,
  assignStandardArrayScore,
  getPointBuyCost,
  getPointBuyRemaining,
  getPointBuyTotal,
  inferAbilityBuilderMode,
  isStandardArray,
} from './builderMath';
import { Ability, abilities } from '../../domain/models';

describe('builderMath', () => {
  it('calculates point buy costs using the 5e progression', () => {
    expect(getPointBuyCost(8)).toBe(0);
    expect(getPointBuyCost(13)).toBe(5);
    expect(getPointBuyCost(14)).toBe(7);
    expect(getPointBuyCost(15)).toBe(9);
  });

  it('tracks total and remaining point buy budget', () => {
    const scores = [15, 15, 15, 8, 8, 8];

    expect(getPointBuyTotal(scores)).toBe(27);
    expect(getPointBuyRemaining(scores, POINT_BUY_BUDGET)).toBe(0);
  });

  it('detects when a score set matches the standard array', () => {
    expect(isStandardArray([15, 14, 13, 12, 10, 8])).toBe(true);
    expect(isStandardArray([15, 14, 13, 12, 10, 10])).toBe(false);
    expect(inferAbilityBuilderMode([...STANDARD_ARRAY])).toBe('standard');
    expect(inferAbilityBuilderMode([15, 15, 13, 8, 8, 8])).toBe('point-buy');
  });

  // Feature: codex-arcanum, Property 7: Point buy cost schedule and budget invariant
  // Validates: Requirements 3.8, 12.5
  it('getPointBuyTotal equals sum of individual costs, and valid assignments stay within budget', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 8, max: 15 }), { minLength: 6, maxLength: 6 }),
        (scores) => {
          // Part 1: total equals sum of individual costs
          const expectedTotal = scores.reduce((sum, s) => sum + getPointBuyCost(s), 0);
          expect(getPointBuyTotal(scores)).toBe(expectedTotal);

          // Part 2: if total is within budget, it must not exceed POINT_BUY_BUDGET
          if (getPointBuyTotal(scores) <= POINT_BUY_BUDGET) {
            expect(getPointBuyTotal(scores)).toBeLessThanOrEqual(POINT_BUY_BUDGET);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  // Feature: codex-arcanum, Property 8: Standard array assignment preserves multiset
  // Validates: Requirements 12.6
  it('preserves the standard array multiset after any valid assignment', () => {
    const standardArrayScores = [...STANDARD_ARRAY] as number[];

    const validStandardArrayRecord = fc.shuffledSubarray([...abilities] as string[], { minLength: 6, maxLength: 6 }).map(
      (shuffledAbilities) => {
        const record = {} as Record<Ability, number>;
        (shuffledAbilities as Ability[]).forEach((ability, i) => {
          record[ability] = standardArrayScores[i];
        });
        return record;
      }
    );

    fc.assert(
      fc.property(
        validStandardArrayRecord,
        fc.constantFrom(...abilities),
        fc.constantFrom(...STANDARD_ARRAY),
        (scores, ability, newScore) => {
          const result = assignStandardArrayScore(scores, ability, newScore);
          const resultValues = abilities.map((a) => result[a]).sort((a, b) => b - a);
          const expected = [...STANDARD_ARRAY].sort((a, b) => b - a);
          expect(resultValues).toEqual(expected);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('swaps conflicting standard array assignments instead of duplicating a score', () => {
    const assigned = assignStandardArrayScore(
      {
        strength: 15,
        dexterity: 14,
        constitution: 13,
        intelligence: 12,
        wisdom: 10,
        charisma: 8,
      },
      'dexterity',
      10
    );

    expect(assigned.dexterity).toBe(10);
    expect(assigned.wisdom).toBe(14);
  });
});
