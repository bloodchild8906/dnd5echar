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
