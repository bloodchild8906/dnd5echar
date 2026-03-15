// Feature: codex-arcanum, Property 5: Ability score modifier formula
// Feature: codex-arcanum, Property 6: Proficiency bonus formula
// Feature: codex-arcanum, Property 9: Spell save DC and attack bonus derivation
// Feature: codex-arcanum, Property 10: Derived stats idempotence
// Feature: codex-arcanum, Property 12: Carry capacity formula
import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import {
  getAbilityModifier,
  getAbilityTotal,
  getArmorClass,
  getCarryCapacity,
  getEncumbranceStatus,
  getInitiative,
  getMergedHomebrewData,
  getPassiveScore,
  getProficiencyBonus,
  getSkillBonus,
  getSpellAttackBonus,
  getSpellSaveDc,
  getTotalCarriedWeight,
  compareFormToCharacter,
} from './derived';
import { createBlankCharacter } from './seeds';
import { Character } from './models';

// ─── Helpers ────────────────────────────────────────────────────────────────

const charWithScore = (ability: keyof Character['abilityScores'], score: number): Character => {
  const c = createBlankCharacter();
  c.abilityScores[ability].score = score;
  c.abilityScores[ability].bonus = 0;
  c.abilityScores[ability].temp = 0;
  return c;
};

// ─── Existing tests ──────────────────────────────────────────────────────────

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

// ─── Unit coverage: getArmorClass, getInitiative, getPassiveScore ────────────

describe('getArmorClass', () => {
  it('adds dex modifier to base AC', () => {
    const c = charWithScore('dexterity', 16); // +3
    c.combat.baseArmorClass = 10;
    expect(getArmorClass(c)).toBe(13);
  });

  it('uses override when set', () => {
    const c = createBlankCharacter();
    c.combat.armorClassOverride = { value: 20, reason: 'test', updatedAt: '' };
    expect(getArmorClass(c)).toBe(20);
  });

  it('clamps negative dex modifier to 0 contribution', () => {
    const c = charWithScore('dexterity', 6); // -2
    c.combat.baseArmorClass = 12;
    expect(getArmorClass(c)).toBe(12);
  });
});

describe('getInitiative', () => {
  it('equals dex modifier plus initiative bonus', () => {
    const c = charWithScore('dexterity', 14); // +2
    c.combat.initiativeBonus = 1;
    expect(getInitiative(c)).toBe(3);
  });

  it('uses override when set', () => {
    const c = createBlankCharacter();
    c.combat.initiativeOverride = { value: 5, reason: 'test', updatedAt: '' };
    expect(getInitiative(c)).toBe(5);
  });
});

describe('getPassiveScore', () => {
  it('equals 10 + skill bonus for perception', () => {
    const c = createBlankCharacter();
    const bonus = getSkillBonus(c, 'perception');
    expect(getPassiveScore(c, 'perception')).toBe(10 + bonus);
  });

  it('uses override when set', () => {
    const c = createBlankCharacter();
    c.combat.passiveOverrides.perception = { value: 18, reason: 'test', updatedAt: '' };
    expect(getPassiveScore(c, 'perception')).toBe(18);
  });
});

describe('getEncumbranceStatus', () => {
  it('returns light when under capacity', () => {
    const c = createBlankCharacter();
    c.abilityScores.strength.score = 10;
    c.inventory.items = [];
    expect(getEncumbranceStatus(c)).toBe('light');
  });

  it('returns encumbered when over capacity', () => {
    const c = createBlankCharacter();
    c.abilityScores.strength.score = 10; // capacity = 150
    c.inventory.items = [
      {
        id: 'i1',
        name: 'Heavy Rock',
        description: '',
        quantity: 1,
        weight: 200,
        value: { amount: 0, denomination: 'gp' },
        rarity: 'Common',
        attunementRequired: false,
        attuned: false,
        equipped: false,
        consumable: false,
        tags: [],
        notes: '',
        containerId: null,
        sourceRef: { sourceType: 'user-created', sourceName: 'Local' },
      },
    ];
    expect(getEncumbranceStatus(c)).toBe('encumbered');
  });
});

describe('compareFormToCharacter', () => {
  it('returns null when no form provided', () => {
    expect(compareFormToCharacter(createBlankCharacter())).toBeNull();
  });

  it('returns comparison object with base and form stats', () => {
    const c = createBlankCharacter();
    const form = c.wildShapes.forms[0];
    if (!form) return; // skip if no seed forms
    const result = compareFormToCharacter(c, form);
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('baseAc');
    expect(result).toHaveProperty('formAc');
  });
});

describe('getMergedHomebrewData', () => {
  it('merges override data on top of source data', () => {
    const entry = {
      id: 'h1',
      entityType: 'spell' as const,
      name: 'Test',
      summary: '',
      tags: [],
      sourceRef: { sourceType: 'homebrew' as const, sourceName: 'Local' },
      sourceData: { damage: '1d6', range: '30 ft' },
      overrideData: { damage: '2d6' },
      notes: '',
      createdAt: '',
      updatedAt: '',
    };
    const merged = getMergedHomebrewData<{ damage: string; range: string }>(entry);
    expect(merged.damage).toBe('2d6');
    expect(merged.range).toBe('30 ft');
  });
});

// ─── Property 5: Ability score modifier formula ──────────────────────────────

describe('Property 5: Ability score modifier formula', () => {
  it('getAbilityModifier returns floor((score - 10) / 2) for all scores 1–30', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 30 }), (score) => {
        const c = charWithScore('strength', score);
        return getAbilityModifier(c, 'strength') === Math.floor((score - 10) / 2);
      }),
      { numRuns: 200 }
    );
  });
});

// ─── Property 6: Proficiency bonus formula ───────────────────────────────────

describe('Property 6: Proficiency bonus formula', () => {
  it('getProficiencyBonus returns max(2, ceil(1 + level/4)) for levels 1–20', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), (level) => {
        const c = createBlankCharacter();
        c.level = level;
        c.proficiencyBonusOverride = undefined;
        return getProficiencyBonus(c) === Math.max(2, Math.ceil(1 + level / 4));
      }),
      { numRuns: 200 }
    );
  });
});

// ─── Property 9: Spell save DC and attack bonus derivation ───────────────────

describe('Property 9: Spell save DC and attack bonus derivation', () => {
  it('getSpellSaveDc = 8 + profBonus + abilMod when no override', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 1, max: 30 }),
        (level, wisScore) => {
          const c = createBlankCharacter();
          c.level = level;
          c.abilityScores.wisdom.score = wisScore;
          c.abilityScores.wisdom.bonus = 0;
          c.abilityScores.wisdom.temp = 0;
          c.spellbook.spellcastingAbility = 'wisdom';
          c.spellbook.overrides.saveDc = undefined;
          c.proficiencyBonusOverride = undefined;
          const profBonus = Math.max(2, Math.ceil(1 + level / 4));
          const abilMod = Math.floor((wisScore - 10) / 2);
          return getSpellSaveDc(c) === 8 + profBonus + abilMod;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('getSpellAttackBonus = profBonus + abilMod when no override', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 1, max: 30 }),
        (level, wisScore) => {
          const c = createBlankCharacter();
          c.level = level;
          c.abilityScores.wisdom.score = wisScore;
          c.abilityScores.wisdom.bonus = 0;
          c.abilityScores.wisdom.temp = 0;
          c.spellbook.spellcastingAbility = 'wisdom';
          c.spellbook.overrides.attackBonus = undefined;
          c.proficiencyBonusOverride = undefined;
          const profBonus = Math.max(2, Math.ceil(1 + level / 4));
          const abilMod = Math.floor((wisScore - 10) / 2);
          return getSpellAttackBonus(c) === profBonus + abilMod;
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ─── Property 10: Derived stats idempotence ──────────────────────────────────

describe('Property 10: Derived stats idempotence', () => {
  it('calling derived functions twice with same input returns same value', () => {
    const c = createBlankCharacter();
    c.level = 7;
    c.abilityScores.wisdom.score = 16;

    expect(getArmorClass(c)).toBe(getArmorClass(c));
    expect(getInitiative(c)).toBe(getInitiative(c));
    expect(getProficiencyBonus(c)).toBe(getProficiencyBonus(c));
    expect(getSpellSaveDc(c)).toBe(getSpellSaveDc(c));
    expect(getSpellAttackBonus(c)).toBe(getSpellAttackBonus(c));
    expect(getCarryCapacity(c)).toBe(getCarryCapacity(c));
    expect(getTotalCarriedWeight(c.inventory.items)).toBe(
      getTotalCarriedWeight(c.inventory.items)
    );
  });

  it('idempotence holds for arbitrary levels and scores', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 1, max: 30 }),
        (level, score) => {
          const c = createBlankCharacter();
          c.level = level;
          c.abilityScores.wisdom.score = score;
          c.abilityScores.wisdom.bonus = 0;
          c.abilityScores.wisdom.temp = 0;
          return (
            getProficiencyBonus(c) === getProficiencyBonus(c) &&
            getAbilityModifier(c, 'wisdom') === getAbilityModifier(c, 'wisdom') &&
            getSpellSaveDc(c) === getSpellSaveDc(c)
          );
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ─── Property 12: Carry capacity formula ────────────────────────────────────

describe('Property 12: Carry capacity formula', () => {
  it('getCarryCapacity equals strength total * 15', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 30 }), (score) => {
        const c = charWithScore('strength', score);
        return getCarryCapacity(c) === getAbilityTotal(c, 'strength') * 15;
      }),
      { numRuns: 200 }
    );
  });
});
