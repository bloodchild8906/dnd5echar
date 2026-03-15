// Feature: codex-arcanum, Property 11: HP clamping invariant
import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { clampHp } from '../../components/common/CombatBlock';

describe('Property 11: HP clamping invariant', () => {
  it('clampHp always satisfies 0 ≤ current ≤ max + temp', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 1000 }),
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 0, max: 200 }),
        (rawCurrent, max, temp) => {
          const result = clampHp(rawCurrent, max, temp);
          return result >= 0 && result <= max + temp;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('clampHp returns 0 when current is negative', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: -1 }),
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 0, max: 200 }),
        (current, max, temp) => clampHp(current, max, temp) === 0
      ),
      { numRuns: 200 }
    );
  });

  it('clampHp returns max + temp when current exceeds that', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 0, max: 200 }),
        (max, temp) => {
          const overMax = max + temp + 1;
          return clampHp(overMax, max, temp) === max + temp;
        }
      ),
      { numRuns: 200 }
    );
  });
});
