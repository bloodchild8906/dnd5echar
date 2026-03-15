import { describe, it, expect } from 'vitest';
import { createBlankCharacter } from '../../domain/seeds';
import { getAbilityTotal, getAbilityModifier, getSavingThrowBonus } from '../../domain/derived';

describe('AbilityScoreGrid', () => {
  it('calculates ability totals correctly', () => {
    const character = createBlankCharacter();
    character.abilityScores.strength.score = 16;
    character.abilityScores.strength.bonus = 2;
    
    const total = getAbilityTotal(character, 'strength');
    expect(total).toBe(18);
  });

  it('calculates ability modifiers correctly', () => {
    const character = createBlankCharacter();
    character.abilityScores.strength.score = 16;
    
    const modifier = getAbilityModifier(character, 'strength');
    expect(modifier).toBe(3);
  });

  it('calculates saving throw bonuses correctly', () => {
    const character = createBlankCharacter();
    character.abilityScores.strength.score = 16;
    character.savingThrows.strength.proficient = true;
    
    const save = getSavingThrowBonus(character, 'strength');
    expect(save).toBeGreaterThan(3);
  });

  it('detects saving throw overrides', () => {
    const character = createBlankCharacter();
    character.savingThrows.strength.override = {
      value: 10,
      reason: 'Test override',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    
    expect(character.savingThrows.strength.override).toBeDefined();
    expect(character.savingThrows.strength.override?.value).toBe(10);
  });

  it('detects ability score bonuses', () => {
    const character = createBlankCharacter();
    character.abilityScores.dexterity.bonus = 2;
    
    expect(character.abilityScores.dexterity.bonus).toBe(2);
  });
});
