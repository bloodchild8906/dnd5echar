import { getAbilityModifier, getProficiencyBonus, getSpellSaveDc } from './derived';
import { createBlankCharacter } from './seeds';

describe('derived character math', () => {
  it('calculates ability modifiers and proficiency bonus', () => {
    const character = createBlankCharacter();
    character.level = 9;
    character.abilityScores.wisdom.score = 18;

    expect(getAbilityModifier(character, 'wisdom')).toBe(4);
    expect(getProficiencyBonus(character)).toBe(4);
  });

  it('calculates spell save dc from proficiency and spellcasting ability', () => {
    const character = createBlankCharacter();
    character.level = 5;
    character.abilityScores.wisdom.score = 18;
    character.spellbook.spellcastingAbility = 'wisdom';

    expect(getSpellSaveDc(character)).toBe(15);
  });
});
