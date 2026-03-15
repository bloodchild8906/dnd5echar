import { Ability, abilities } from '../../domain/models';

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;
export const POINT_BUY_BUDGET = 27;

export type BuilderAbilityMode = 'standard' | 'point-buy';

export const clampPointBuyScore = (score: number): number =>
  Math.max(8, Math.min(15, Math.trunc(score)));

export const getPointBuyCost = (score: number): number => {
  const normalized = clampPointBuyScore(score);

  if (normalized <= 13) {
    return normalized - 8;
  }

  if (normalized === 14) {
    return 7;
  }

  return 9;
};

export const getPointBuyTotal = (scores: number[]): number =>
  scores.reduce((total, score) => total + getPointBuyCost(score), 0);

export const getPointBuyRemaining = (scores: number[], budget = POINT_BUY_BUDGET): number =>
  budget - getPointBuyTotal(scores);

export const isStandardArray = (scores: number[]): boolean =>
  [...scores].sort((left, right) => right - left).join(',') === STANDARD_ARRAY.join(',');

export const inferAbilityBuilderMode = (scores: number[]): BuilderAbilityMode =>
  isStandardArray(scores) ? 'standard' : 'point-buy';

export const assignStandardArrayScore = (
  scores: Record<Ability, number>,
  ability: Ability,
  nextScore: number
): Record<Ability, number> => {
  if (!STANDARD_ARRAY.includes(nextScore as (typeof STANDARD_ARRAY)[number])) {
    return scores;
  }

  const updated = { ...scores };
  const currentScore = updated[ability];
  const conflictingAbility = abilities.find(
    (candidate) => candidate !== ability && updated[candidate] === nextScore
  );

  updated[ability] = nextScore;

  if (conflictingAbility) {
    updated[conflictingAbility] = currentScore;
  }

  return updated;
};
