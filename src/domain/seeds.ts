import {
  Ability,
  AbilityScores,
  ActionEntry,
  AppSettings,
  Character,
  CharacterSpellbook,
  Companion,
  CompanionInventory,
  HomebrewEntry,
  Note,
  PersistedAppData,
  Skill,
  SourceReference,
  Spell,
  SpellPreparationState,
  TraitEntry,
  UiPreferences,
  WildShapeForm,
  abilities,
  skills,
} from './models';
import { createId } from '../utils/id';
import { isoNow } from '../utils/numbers';

const localSource = (sourceId = ''): SourceReference => ({
  sourceType: 'user-created',
  sourceId,
  sourceName: 'Local',
  fetchedAt: isoNow(),
});

const createAbilityScores = (score = 10): AbilityScores =>
  Object.fromEntries(
    abilities.map((ability) => [ability, { score, bonus: 0, temp: 0 }])
  ) as AbilityScores;

const createSavingThrows = () =>
  Object.fromEntries(
    abilities.map((ability) => [ability, { proficient: false, bonus: 0 }])
  ) as Record<Ability, { proficient: boolean; bonus: number }>;

const createSkills = () =>
  Object.fromEntries(skills.map((skill) => [skill, { proficiency: 'none', bonus: 0 }])) as Record<
    Skill,
    { proficiency: 'none'; bonus: number }
  >;

const createSpellbook = (): CharacterSpellbook => ({
  spellcastingAbility: 'wisdom',
  spellcastingClass: '',
  multiclassSummary: '',
  notes: '',
  slots: Array.from({ length: 9 }, (_, index) => ({ level: index + 1, max: 0, used: 0 })),
  pactMagic: {
    enabled: false,
    slotLevel: 1,
    slots: 0,
    used: 0,
  },
  spells: [],
  innateSpells: [],
  itemGrantedSpells: [],
  overrides: {},
});

const createInventory = (): CompanionInventory => ({
  containers: [
    {
      id: createId('container'),
      name: 'Backpack',
      notes: '',
      type: 'backpack',
      order: 0,
      parentId: null,
    },
  ],
  items: [],
  currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
});

export const createTrait = (name = 'New Trait', description = ''): TraitEntry => ({
  id: createId('trait'),
  name,
  description,
});

export const createAction = (name = 'New Action', description = ''): ActionEntry => ({
  id: createId('action'),
  name,
  description,
});

export const createBlankSpell = (name = 'New Spell'): Spell => ({
  id: createId('spell'),
  name,
  level: 0,
  school: 'Evocation',
  description: '',
  castingTime: '1 action',
  range: 'Self',
  duration: 'Instantaneous',
  classes: [],
  ritual: false,
  concentration: false,
  components: [],
  tags: [],
  sourceRef: localSource(),
});

export const createSpellEntry = (spell = createBlankSpell()): SpellPreparationState => ({
  id: createId('spell-entry'),
  spell,
  sourceKind: 'custom',
  sourceLabel: 'Custom',
  known: true,
  prepared: false,
  alwaysPrepared: false,
  pinned: false,
  castCount: 0,
  notes: '',
});

export const createBlankWildShapeForm = (name = 'New Form'): WildShapeForm => ({
  id: createId('form'),
  name,
  favorite: false,
  notes: '',
  rulesNotes: '',
  size: 'Medium',
  creatureType: 'Beast',
  challengeRating: '0',
  sourceRef: localSource(),
  stats: {
    abilities: createAbilityScores(10),
    skills: {},
    savingThrows: {},
    ac: 10,
    hp: { max: 10, current: 10, temp: 0 },
    speed: { walk: 30 },
    senses: [],
    languages: [],
    actions: [],
    traits: [],
    initiative: 0,
    hitDice: '2d8',
    notes: '',
  },
});

export const createBlankCharacter = (): Character => {
  const now = isoNow();
  return {
    id: createId('character'),
    name: 'New Adventurer',
    portraitUrl: '',
    level: 1,
    className: 'Fighter',
    subclassName: '',
    raceName: 'Human',
    subraceName: '',
    backgroundName: 'Acolyte',
    alignment: 'Neutral',
    experience: 0,
    abilityScores: createAbilityScores(10),
    savingThrows: createSavingThrows(),
    skills: createSkills(),
    languages: ['Common'],
    senses: [],
    movement: { walk: 30 },
    combat: {
      baseArmorClass: 10,
      initiativeBonus: 0,
      hitPoints: { max: 10, current: 10, temp: 0 },
      hitDice: '1d10',
      deathSaves: { successes: 0, failures: 0 },
      resistances: [],
      immunities: [],
      vulnerabilities: [],
      inspiration: false,
      passiveOverrides: {},
    },
    spellbook: createSpellbook(),
    inventory: createInventory(),
    wildShapes: { forms: [], activeForm: null },
    features: [],
    actions: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 15, pp: 0 },
    conditions: [],
    notes: '',
    featureNotes: '',
    sourceRef: localSource(),
    createdAt: now,
    updatedAt: now,
  };
};

export const createBlankCompanion = (parentCharacterId: string): Companion => {
  const now = isoNow();
  return {
    id: createId('companion'),
    parentCharacterId,
    name: 'New Companion',
    type: 'pet',
    tags: [],
    initiative: 0,
    notes: '',
    sourceRef: localSource(),
    stats: {
      abilities: createAbilityScores(10),
      skills: {},
      savingThrows: {},
      ac: 10,
      hp: { max: 5, current: 5, temp: 0 },
      speed: { walk: 30 },
      senses: [],
      languages: [],
      actions: [],
      traits: [],
      initiative: 0,
      hitDice: '1d8',
      notes: '',
    },
    inventory: createInventory(),
    spellbook: createSpellbook(),
    createdAt: now,
    updatedAt: now,
  };
};

export const createBlankNote = (): Note => {
  const now = isoNow();
  return {
    id: createId('note'),
    type: 'character',
    title: 'New Note',
    body: '',
    format: 'plain',
    tags: [],
    pinned: false,
    sections: [],
    createdAt: now,
    updatedAt: now,
  };
};

export const createBlankHomebrewEntry = (): HomebrewEntry => {
  const now = isoNow();
  return {
    id: createId('homebrew'),
    entityType: 'spell',
    name: 'New Homebrew Entry',
    summary: '',
    tags: [],
    sourceRef: { sourceType: 'homebrew', sourceName: 'Local Homebrew', fetchedAt: now },
    sourceData: null,
    overrideData: {},
    notes: '',
    createdAt: now,
    updatedAt: now,
  };
};

const seedSpellEntries = (): SpellPreparationState[] => {
  const spellSeeds = [
    {
      name: 'Entangle',
      level: 1,
      school: 'Conjuration',
      description: 'Grasping weeds and vines sprout from the ground in a 20-foot square.',
      concentration: true,
      classes: ['Druid'],
    },
    {
      name: 'Healing Word',
      level: 1,
      school: 'Evocation',
      description: 'A creature of your choice regains hit points.',
      concentration: false,
      classes: ['Druid'],
    },
    {
      name: 'Moonbeam',
      level: 2,
      school: 'Evocation',
      description: 'A silvery beam of pale light shines down in a 5-foot-radius cylinder.',
      concentration: true,
      classes: ['Druid'],
    },
  ];

  return spellSeeds.map((seed, index) =>
    createSpellEntry({
      ...createBlankSpell(seed.name),
      id: `seed-spell-${index + 1}`,
      level: seed.level,
      school: seed.school,
      description: seed.description,
      castingTime: '1 action',
      range: '60 feet',
      duration: seed.concentration ? 'Concentration, up to 1 minute' : 'Instantaneous',
      classes: seed.classes,
      concentration: seed.concentration,
      sourceRef: {
        sourceType: 'open5e',
        sourceId: seed.name.toLowerCase().replace(/\s+/g, '-'),
        sourceName: 'Open5e SRD',
        documentSlug: '5esrd',
        fetchedAt: isoNow(),
      },
      components: ['V', 'S'],
      tags: ['seed'],
    })
  );
};

const seedCharacter = (): Character => {
  const character = createBlankCharacter();
  character.id = 'character-seed-moon-druid';
  character.name = 'Maelis Thornstep';
  character.portraitUrl =
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80';
  character.level = 5;
  character.className = 'Druid';
  character.subclassName = 'Circle of the Moon';
  character.raceName = 'Elf';
  character.subraceName = 'Wood Elf';
  character.backgroundName = 'Outlander';
  character.alignment = 'Neutral Good';
  character.experience = 6500;
  character.abilityScores.strength.score = 10;
  character.abilityScores.dexterity.score = 14;
  character.abilityScores.constitution.score = 14;
  character.abilityScores.intelligence.score = 12;
  character.abilityScores.wisdom.score = 18;
  character.abilityScores.charisma.score = 11;
  character.savingThrows.intelligence.proficient = true;
  character.savingThrows.wisdom.proficient = true;
  character.skills.perception.proficiency = 'proficient';
  character.skills.survival.proficiency = 'proficient';
  character.skills.nature.proficiency = 'proficient';
  character.skills.animalHandling.proficiency = 'proficient';
  character.languages = ['Common', 'Elvish', 'Druidic'];
  character.senses = ['Darkvision 60 ft.'];
  character.movement = { walk: 35 };
  character.combat.baseArmorClass = 10;
  character.combat.hitPoints = { max: 38, current: 31, temp: 0 };
  character.combat.hitDice = '5d8';
  character.spellbook.spellcastingAbility = 'wisdom';
  character.spellbook.spellcastingClass = 'Druid';
  character.spellbook.multiclassSummary = 'Single-class druid casting progression.';
  character.spellbook.slots = [
    { level: 1, max: 4, used: 1 },
    { level: 2, max: 3, used: 0 },
    { level: 3, max: 2, used: 1 },
    { level: 4, max: 0, used: 0 },
    { level: 5, max: 0, used: 0 },
    { level: 6, max: 0, used: 0 },
    { level: 7, max: 0, used: 0 },
    { level: 8, max: 0, used: 0 },
    { level: 9, max: 0, used: 0 },
  ];
  character.spellbook.spells = seedSpellEntries().map((entry, index) => ({
    ...entry,
    prepared: true,
    pinned: index < 2,
    sourceKind: 'class',
    sourceLabel: 'Druid',
  }));
  character.features = [
    createTrait(
      'Combat Wild Shape',
      'Use Wild Shape as a bonus action and spend spell slots to heal while transformed.'
    ),
    createTrait('Circle Forms', 'Your beast form limit expands as your druid level increases.'),
  ];
  character.actions = [
    createAction('Scimitar', 'Melee Weapon Attack: +5 to hit, 1d6+2 slashing.'),
    createAction('Produce Flame', 'Ranged Spell Attack: +7 to hit, 2d8 fire.'),
  ];
  character.inventory.items = [
    {
      id: createId('item'),
      name: 'Scimitar',
      description: 'Curved martial melee weapon.',
      quantity: 1,
      weight: 3,
      value: { amount: 25, denomination: 'gp' },
      rarity: 'Common',
      attunementRequired: false,
      attuned: false,
      equipped: true,
      consumable: false,
      tags: ['weapon', 'finesse'],
      notes: '',
      containerId: null,
      sourceRef: { sourceType: 'user-created', sourceName: 'Seed Data', fetchedAt: isoNow() },
      damage: '1d6+2 slashing',
      properties: ['Finesse', 'Light'],
    },
    {
      id: createId('item'),
      name: 'Explorer Pack',
      description: 'Travel basics tucked in a rugged pack.',
      quantity: 1,
      weight: 10,
      value: { amount: 10, denomination: 'gp' },
      rarity: 'Common',
      attunementRequired: false,
      attuned: false,
      equipped: false,
      consumable: false,
      tags: ['container'],
      notes: 'Contains bedroll, tinderbox, and trail rations.',
      containerId: character.inventory.containers[0].id,
      sourceRef: { sourceType: 'user-created', sourceName: 'Seed Data', fetchedAt: isoNow() },
    },
    {
      id: createId('item'),
      name: 'Potion of Healing',
      description: 'Regain 2d4+2 hit points.',
      quantity: 2,
      weight: 0.5,
      value: { amount: 50, denomination: 'gp' },
      rarity: 'Common',
      attunementRequired: false,
      attuned: false,
      equipped: false,
      charges: { current: 1, max: 1 },
      consumable: true,
      tags: ['potion'],
      notes: 'Quick access slot.',
      containerId: null,
      sourceRef: { sourceType: 'user-created', sourceName: 'Seed Data', fetchedAt: isoNow() },
    },
  ];
  character.currency = { cp: 3, sp: 4, ep: 0, gp: 68, pp: 1 };
  character.notes = 'Travels with a leather folio of star charts and druidic sketches.';
  character.featureNotes = 'Prefers battlefield control and scouting through wild shape.';
  character.wildShapes.forms = [
    {
      ...createBlankWildShapeForm('Brown Bear'),
      id: 'form-brown-bear',
      favorite: true,
      challengeRating: '1',
      size: 'Large',
      stats: {
        ...createBlankWildShapeForm().stats,
        abilities: {
          strength: { score: 19, bonus: 0, temp: 0 },
          dexterity: { score: 10, bonus: 0, temp: 0 },
          constitution: { score: 16, bonus: 0, temp: 0 },
          intelligence: { score: 2, bonus: 0, temp: 0 },
          wisdom: { score: 13, bonus: 0, temp: 0 },
          charisma: { score: 7, bonus: 0, temp: 0 },
        },
        ac: 11,
        hp: { max: 34, current: 34, temp: 0 },
        speed: { walk: 40, climb: 30 },
        senses: ['Passive Perception 13'],
        languages: [],
        actions: [
          createAction('Multiattack', 'One bite and one claw attack.'),
          createAction('Bite', '+5 to hit, 1d8+4 piercing.'),
          createAction('Claws', '+5 to hit, 2d6+4 slashing.'),
        ],
        traits: [
          createTrait('Keen Smell', 'Advantage on Wisdom (Perception) checks that rely on smell.'),
        ],
        initiative: 0,
        hitDice: '4d10+12',
        notes: '',
        skills: { perception: 3 },
        savingThrows: {},
      },
      sourceRef: {
        sourceType: 'open5e',
        sourceId: 'brown-bear',
        sourceName: 'Open5e SRD',
        documentSlug: '5esrd',
        fetchedAt: isoNow(),
      },
      rulesNotes:
        'Retain mental ability scores and proficiencies per Wild Shape rules if applicable.',
    },
  ];
  character.wildShapes.activeForm = {
    formId: 'form-brown-bear',
    currentHp: 24,
    revertHp: 31,
    notes: 'Already spent a use this short rest.',
    retainedMentalStats: true,
    retainedSkillProficiencies: true,
  };
  return character;
};

const seedCompanion = (): Companion => {
  const companion = createBlankCompanion('character-seed-moon-druid');
  companion.id = 'companion-bramble-wolf';
  companion.name = 'Bramble';
  companion.type = 'pet';
  companion.tags = ['wolf', 'scout'];
  companion.initiative = 2;
  companion.stats.ac = 13;
  companion.stats.hp = { max: 11, current: 11, temp: 0 };
  companion.stats.speed = { walk: 40 };
  companion.stats.senses = ['Passive Perception 13'];
  companion.stats.actions = [createAction('Bite', '+4 to hit, 2d4+2 piercing.')];
  companion.stats.traits = [
    createTrait('Pack Tactics', 'Advantage on attack rolls when an ally is near the target.'),
  ];
  companion.notes = 'Takes first watch whenever the party camps outside city walls.';
  return companion;
};

const seedNotes = (): Note[] => {
  const note = createBlankNote();
  note.id = 'note-seed-session';
  note.type = 'session';
  note.title = 'Moonwell Expedition';
  note.body =
    '# Route\nFollow the ridge east of the moonwell.\n\n- Recover the silver acorn\n- Avoid the blighted wolves';
  note.format = 'markdown-lite';
  note.tags = ['quest', 'frontier'];
  note.pinned = true;
  note.relatedCharacterId = 'character-seed-moon-druid';
  return [note];
};

const seedHomebrew = (): HomebrewEntry[] => {
  const entry = createBlankHomebrewEntry();
  entry.id = 'homebrew-moonlit-veil';
  entry.entityType = 'spell';
  entry.name = 'Moonlit Veil';
  entry.summary = 'A defensive shimmer of silver mist that grants concealment under moonlight.';
  entry.tags = ['illusion', 'druid'];
  entry.overrideData = {
    name: 'Moonlit Veil',
    level: 2,
    school: 'Illusion',
    castingTime: '1 bonus action',
    range: 'Self',
    duration: 'Concentration, up to 10 minutes',
    description:
      'A veil of pale lunar mist wraps around you, lightly obscuring you and granting advantage on Stealth checks in dim light.',
  };
  entry.notes = 'Designed for nocturnal scouting and thematic Circle of the Moon play.';
  return [entry];
};

export const createDefaultSettings = (): AppSettings => ({
  referenceDocumentFilter: '5esrd',
  referenceCacheHours: 48,
  encumbranceMode: 'off',
  compactMode: false,
  seedLoaded: true,
  lastSelectedCharacterId: 'character-seed-moon-druid',
  printOptions: {
    showNotes: true,
    showSpellbook: true,
  },
  supabase: {
    autoSync: false,
    userId: null,
    lastSyncedAt: null,
    lastPulledAt: null,
  },
});

export const createDefaultUiPreferences = (): UiPreferences => ({
  navCollapsed: false,
  spellFiltersOpen: true,
  compactCards: false,
  activeNoteId: 'note-seed-session',
});

export const createSeedPersistedAppData = (): PersistedAppData => ({
  version: 2,
  exportedAt: isoNow(),
  source: 'dnd5e-character-sheet-manager',
  selectedCharacterId: 'character-seed-moon-druid',
  characters: [seedCharacter()],
  companions: [seedCompanion()],
  notes: seedNotes(),
  homebrew: seedHomebrew(),
  settings: createDefaultSettings(),
  uiPreferences: createDefaultUiPreferences(),
  referenceCache: { entries: [] },
});
