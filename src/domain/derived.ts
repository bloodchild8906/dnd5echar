import {
  Ability,
  Character,
  CharacterSummary,
  Companion,
  HomebrewEntry,
  ManualOverride,
  Skill,
  SpeedSet,
  WildShapeForm,
  abilities,
} from './models';
import { deepMerge } from '../utils/object';

export const skillAbilityMap: Record<Skill, Ability> = {
  acrobatics: 'dexterity',
  animalHandling: 'wisdom',
  arcana: 'intelligence',
  athletics: 'strength',
  deception: 'charisma',
  history: 'intelligence',
  insight: 'wisdom',
  intimidation: 'charisma',
  investigation: 'intelligence',
  medicine: 'wisdom',
  nature: 'intelligence',
  perception: 'wisdom',
  performance: 'charisma',
  persuasion: 'charisma',
  religion: 'intelligence',
  sleightOfHand: 'dexterity',
  stealth: 'dexterity',
  survival: 'wisdom',
};

const applyOverride = (autoValue: number, override?: ManualOverride<number>): number =>
  override?.value ?? autoValue;

export const getAbilityTotal = (
  character: Character | Companion['stats'],
  ability: Ability
): number => {
  const block = 'abilityScores' in character ? character.abilityScores : character.abilities;
  const value = block[ability];
  return value.score + value.bonus + value.temp;
};

export const getAbilityModifier = (
  character: Character | Companion['stats'],
  ability: Ability
): number => {
  return Math.floor((getAbilityTotal(character, ability) - 10) / 2);
};

export const getProficiencyBonus = (character: Character): number => {
  const auto = Math.max(2, Math.ceil(1 + character.level / 4));
  return applyOverride(auto, character.proficiencyBonusOverride);
};

export const getSavingThrowBonus = (character: Character, ability: Ability): number => {
  const auto =
    getAbilityModifier(character, ability) +
    (character.savingThrows[ability].proficient ? getProficiencyBonus(character) : 0) +
    character.savingThrows[ability].bonus;
  return applyOverride(auto, character.savingThrows[ability].override);
};

export const getSkillBonus = (character: Character, skill: Skill): number => {
  const skillState = character.skills[skill];
  const proficiencyMultiplier =
    skillState.proficiency === 'expertise' ? 2 : skillState.proficiency === 'proficient' ? 1 : 0;
  const auto =
    getAbilityModifier(character, skillAbilityMap[skill]) +
    proficiencyMultiplier * getProficiencyBonus(character) +
    skillState.bonus;
  return applyOverride(auto, skillState.override);
};

export const getPassiveScore = (
  character: Character,
  skill: 'perception' | 'investigation' | 'insight'
): number => {
  const auto = 10 + getSkillBonus(character, skill);
  return applyOverride(auto, character.combat.passiveOverrides[skill]);
};

export const getArmorClass = (character: Character): number => {
  const auto =
    character.combat.baseArmorClass + Math.max(0, getAbilityModifier(character, 'dexterity'));
  return applyOverride(auto, character.combat.armorClassOverride);
};

export const getInitiative = (character: Character): number => {
  const auto = getAbilityModifier(character, 'dexterity') + character.combat.initiativeBonus;
  return applyOverride(auto, character.combat.initiativeOverride);
};

export const getSpellSaveDc = (character: Character): number => {
  const auto =
    8 +
    getProficiencyBonus(character) +
    getAbilityModifier(character, character.spellbook.spellcastingAbility);
  return applyOverride(auto, character.spellbook.overrides.saveDc);
};

export const getSpellAttackBonus = (character: Character): number => {
  const auto =
    getProficiencyBonus(character) +
    getAbilityModifier(character, character.spellbook.spellcastingAbility);
  return applyOverride(auto, character.spellbook.overrides.attackBonus);
};

export const getTotalCarriedWeight = (
  items: Companion['inventory']['items'] | Character['inventory']['items']
): number => {
  return items.reduce((total, item) => total + item.weight * item.quantity, 0);
};

export const getAttunedItemCount = (
  items: Companion['inventory']['items'] | Character['inventory']['items']
): number => {
  return items.filter((item) => item.attuned).length;
};

export const getCarryCapacity = (character: Character): number =>
  getAbilityTotal(character, 'strength') * 15;

export const getEncumbranceStatus = (character: Character): 'light' | 'encumbered' => {
  return getTotalCarriedWeight(character.inventory.items) > getCarryCapacity(character)
    ? 'encumbered'
    : 'light';
};

export const summarizeSpeed = (speed: SpeedSet): string => {
  const entries = Object.entries(speed).filter(
    ([, value]) => typeof value === 'number' && value > 0
  );
  return entries.map(([type, value]) => `${type} ${value} ft.`).join(', ');
};

export const getCharacterSummary = (character: Character): CharacterSummary => ({
  id: character.id,
  name: character.name,
  portraitUrl: character.portraitUrl,
  level: character.level,
  className: character.className,
  subclassName: character.subclassName,
  raceName: character.raceName,
  currentHp: character.combat.hitPoints.current,
  maxHp: character.combat.hitPoints.max,
  conditions: character.conditions,
});

export const compareFormToCharacter = (character: Character, form?: WildShapeForm) => {
  if (!form) {
    return null;
  }

  return {
    baseAc: getArmorClass(character),
    formAc: form.stats.ac,
    baseSpeed: summarizeSpeed(character.movement),
    formSpeed: summarizeSpeed(form.stats.speed),
    baseMental: {
      intelligence: getAbilityTotal(character, 'intelligence'),
      wisdom: getAbilityTotal(character, 'wisdom'),
      charisma: getAbilityTotal(character, 'charisma'),
    },
    formPhysical: {
      strength: form.stats.abilities.strength.score,
      dexterity: form.stats.abilities.dexterity.score,
      constitution: form.stats.abilities.constitution.score,
    },
  };
};

export const getMergedHomebrewData = <T>(entry: HomebrewEntry): T => {
  const base = (entry.sourceData ?? {}) as T;
  return deepMerge(base, entry.overrideData) as T;
};

export const getAbilityArray = (character: Character) =>
  abilities.map((ability) => ({
    ability,
    total: getAbilityTotal(character, ability),
    modifier: getAbilityModifier(character, ability),
    save: getSavingThrowBonus(character, ability),
  }));
