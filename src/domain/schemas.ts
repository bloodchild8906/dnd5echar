import { z } from 'zod';
import {
  abilities,
  companionTypes,
  homebrewEntityTypes,
  inventoryContainerTypes,
  noteTypes,
  proficiencyLevels,
  referenceResources,
  sourceTypes,
  spellSourceKinds,
  skills,
} from './models';

const manualOverrideSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    value: schema,
    reason: z.string().default(''),
    updatedAt: z.string(),
  });

const statAdjustmentSchema = z.object({
  score: z.number().int().min(1).max(30),
  bonus: z.number().int().default(0),
  temp: z.number().int().default(0),
});

const abilityScoresShape = Object.fromEntries(
  abilities.map((ability) => [ability, statAdjustmentSchema])
) as Record<string, typeof statAdjustmentSchema>;
const savingThrowShape = Object.fromEntries(
  abilities.map((ability) => [
    ability,
    z.object({
      proficient: z.boolean().default(false),
      bonus: z.number().int().default(0),
      override: manualOverrideSchema(z.number()).optional(),
    }),
  ])
) as Record<string, z.ZodTypeAny>;
const skillShape = Object.fromEntries(
  skills.map((skill) => [
    skill,
    z.object({
      proficiency: z.enum(proficiencyLevels),
      bonus: z.number().int().default(0),
      override: manualOverrideSchema(z.number()).optional(),
    }),
  ])
) as Record<string, z.ZodTypeAny>;

export const sourceReferenceSchema = z.object({
  sourceType: z.enum(sourceTypes),
  sourceId: z.string().optional(),
  sourceName: z.string().optional(),
  originId: z.string().optional(),
  originCollection: z.string().optional(),
  documentSlug: z.string().optional(),
  sourceUrl: z.string().optional(),
  canonicalUrl: z.string().optional(),
  fetchedAt: z.string().optional(),
});

export const abilityScoresSchema = z.object(abilityScoresShape);
export const skillStateSchema = z.object(skillShape);
export const savingThrowSchema = z.object(savingThrowShape);

export const speedSetSchema = z.object({
  walk: z.number().int().min(0),
  burrow: z.number().int().min(0).optional(),
  climb: z.number().int().min(0).optional(),
  fly: z.number().int().min(0).optional(),
  swim: z.number().int().min(0).optional(),
});

export const hitPointStateSchema = z.object({
  max: z.number().int().min(0),
  current: z.number().int().min(0),
  temp: z.number().int().min(0),
});

export const deathSaveStateSchema = z.object({
  successes: z.number().int().min(0).max(3),
  failures: z.number().int().min(0).max(3),
});

export const currencyWalletSchema = z.object({
  cp: z.number().int(),
  sp: z.number().int(),
  ep: z.number().int(),
  gp: z.number().int(),
  pp: z.number().int(),
});

export const traitEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  source: z.string().optional(),
});

export const actionEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  attackBonus: z.number().optional(),
  damage: z.string().optional(),
  notes: z.string().optional(),
});

export const spellSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number().int().min(0).max(9),
  school: z.string(),
  description: z.string(),
  higherLevel: z.string().optional(),
  castingTime: z.string(),
  range: z.string(),
  duration: z.string(),
  classes: z.array(z.string()),
  ritual: z.boolean(),
  concentration: z.boolean(),
  components: z.array(z.string()),
  tags: z.array(z.string()),
  notes: z.string().optional(),
  damageRoll: z.string().optional(),
  savingThrowAbility: z.string().optional(),
  attackRoll: z.boolean().optional(),
  sourceRef: sourceReferenceSchema,
  url: z.string().optional(),
});

export const spellPreparationStateSchema = z.object({
  id: z.string(),
  spell: spellSchema,
  sourceKind: z.enum(spellSourceKinds),
  sourceLabel: z.string(),
  known: z.boolean(),
  prepared: z.boolean(),
  alwaysPrepared: z.boolean(),
  pinned: z.boolean(),
  castCount: z.number().int().min(0),
  notes: z.string(),
});

export const spellSlotStateSchema = z.object({
  level: z.number().int().min(1).max(9),
  max: z.number().int().min(0),
  used: z.number().int().min(0),
});

export const pactMagicStateSchema = z.object({
  enabled: z.boolean(),
  slotLevel: z.number().int().min(1).max(9),
  slots: z.number().int().min(0),
  used: z.number().int().min(0),
});

export const characterSpellbookSchema = z.object({
  spellcastingAbility: z.enum(abilities),
  spellcastingClass: z.string(),
  multiclassSummary: z.string(),
  notes: z.string(),
  slots: z.array(spellSlotStateSchema),
  pactMagic: pactMagicStateSchema,
  spells: z.array(spellPreparationStateSchema),
  innateSpells: z.array(spellPreparationStateSchema),
  itemGrantedSpells: z.array(spellPreparationStateSchema),
  overrides: z.object({
    saveDc: manualOverrideSchema(z.number()).optional(),
    attackBonus: manualOverrideSchema(z.number()).optional(),
  }),
});

export const inventoryContainerSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable().optional(),
  notes: z.string(),
  type: z.enum(inventoryContainerTypes),
  order: z.number().int(),
});

export const inventoryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  quantity: z.number().int().min(0),
  weight: z.number().min(0),
  value: z.object({
    amount: z.number().min(0),
    denomination: z.enum(['cp', 'sp', 'ep', 'gp', 'pp']),
  }),
  rarity: z.string(),
  attunementRequired: z.boolean(),
  attuned: z.boolean(),
  equipped: z.boolean(),
  charges: z
    .object({
      current: z.number().int().min(0),
      max: z.number().int().min(0),
    })
    .optional(),
  consumable: z.boolean(),
  tags: z.array(z.string()),
  notes: z.string(),
  containerId: z.string().nullable().optional(),
  sourceRef: sourceReferenceSchema,
  armorClass: z.number().optional(),
  damage: z.string().optional(),
  properties: z.array(z.string()).optional(),
});

export const companionInventorySchema = z.object({
  containers: z.array(inventoryContainerSchema),
  items: z.array(inventoryItemSchema),
  currency: currencyWalletSchema,
});

export const actorStatBlockSchema = z.object({
  abilities: abilityScoresSchema,
  skills: z.record(z.string(), z.number()),
  savingThrows: z.record(z.string(), z.number()),
  ac: z.number().int().min(0),
  hp: hitPointStateSchema,
  speed: speedSetSchema,
  senses: z.array(z.string()),
  languages: z.array(z.string()),
  actions: z.array(actionEntrySchema),
  traits: z.array(traitEntrySchema),
  initiative: z.number().int(),
  hitDice: z.string(),
  notes: z.string(),
});

export const referenceCreatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.string(),
  creatureType: z.string(),
  alignment: z.string(),
  challengeRating: z.string(),
  description: z.string(),
  sourceRef: sourceReferenceSchema,
  stats: actorStatBlockSchema,
});

export const wildShapeFormSchema = z.object({
  id: z.string(),
  name: z.string(),
  favorite: z.boolean(),
  notes: z.string(),
  rulesNotes: z.string(),
  size: z.string(),
  creatureType: z.string(),
  challengeRating: z.string(),
  sourceRef: sourceReferenceSchema,
  stats: actorStatBlockSchema,
});

export const activeFormStateSchema = z.object({
  formId: z.string(),
  currentHp: z.number().int().min(0),
  revertHp: z.number().int().min(0),
  notes: z.string(),
  retainedMentalStats: z.boolean(),
  retainedSkillProficiencies: z.boolean(),
});

export const characterCombatStateSchema = z.object({
  baseArmorClass: z.number().int().min(0),
  armorClassOverride: manualOverrideSchema(z.number()).optional(),
  initiativeBonus: z.number().int(),
  initiativeOverride: manualOverrideSchema(z.number()).optional(),
  hitPoints: hitPointStateSchema,
  hitDice: z.string(),
  deathSaves: deathSaveStateSchema,
  resistances: z.array(z.string()),
  immunities: z.array(z.string()),
  vulnerabilities: z.array(z.string()),
  inspiration: z.boolean(),
  passiveOverrides: z.object({
    perception: manualOverrideSchema(z.number()).optional(),
    investigation: manualOverrideSchema(z.number()).optional(),
    insight: manualOverrideSchema(z.number()).optional(),
  }),
});

export const characterSchema = z.object({
  id: z.string(),
  name: z.string(),
  portraitUrl: z.string(),
  level: z.number().int().min(1).max(20),
  className: z.string(),
  subclassName: z.string(),
  raceName: z.string(),
  subraceName: z.string(),
  backgroundName: z.string(),
  alignment: z.string(),
  experience: z.number().int().min(0),
  proficiencyBonusOverride: manualOverrideSchema(z.number()).optional(),
  abilityScores: abilityScoresSchema,
  savingThrows: savingThrowSchema,
  skills: skillStateSchema,
  languages: z.array(z.string()),
  senses: z.array(z.string()),
  movement: speedSetSchema,
  combat: characterCombatStateSchema,
  spellbook: characterSpellbookSchema,
  inventory: companionInventorySchema,
  wildShapes: z.object({
    forms: z.array(wildShapeFormSchema),
    activeForm: activeFormStateSchema.nullish(),
  }),
  features: z.array(traitEntrySchema),
  actions: z.array(actionEntrySchema),
  currency: currencyWalletSchema,
  conditions: z.array(z.string()),
  notes: z.string(),
  featureNotes: z.string(),
  sourceRef: sourceReferenceSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const companionSchema = z.object({
  id: z.string(),
  parentCharacterId: z.string(),
  name: z.string(),
  type: z.enum(companionTypes),
  tags: z.array(z.string()),
  initiative: z.number().int(),
  notes: z.string(),
  sourceRef: sourceReferenceSchema,
  originLink: z
    .object({
      type: z.enum(['spell', 'feature', 'item', 'homebrew']),
      id: z.string().optional(),
      label: z.string().optional(),
    })
    .optional(),
  stats: actorStatBlockSchema,
  inventory: companionInventorySchema,
  spellbook: characterSpellbookSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const noteSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  collapsed: z.boolean(),
});

export const noteSchema = z.object({
  id: z.string(),
  type: z.enum(noteTypes),
  title: z.string(),
  body: z.string(),
  format: z.enum(['plain', 'markdown-lite']),
  tags: z.array(z.string()),
  pinned: z.boolean(),
  relatedCharacterId: z.string().optional(),
  relatedEntityId: z.string().optional(),
  relatedEntityType: z.string().optional(),
  sections: z.array(noteSectionSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const homebrewEntrySchema = z.object({
  id: z.string(),
  entityType: z.enum(homebrewEntityTypes),
  name: z.string(),
  summary: z.string(),
  tags: z.array(z.string()),
  sourceRef: sourceReferenceSchema,
  sourceData: z.any().nullable(),
  overrideData: z.any(),
  notes: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const referenceOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  summary: z.string(),
  resource: z.enum(referenceResources),
  tags: z.array(z.string()),
  sourceRef: sourceReferenceSchema,
  raw: z.record(z.string(), z.any()),
});

export const referenceEntrySnapshotSchema = z.union([
  spellSchema,
  referenceCreatureSchema,
  referenceOptionSchema,
]);

export const compendiumShelfEntrySchema = z.object({
  entryId: z.string(),
  resource: z.enum(referenceResources),
  snapshot: referenceEntrySnapshotSchema,
  savedAt: z.string(),
});

export const compendiumPreferencesSchema = z.object({
  pinnedEntries: z.array(compendiumShelfEntrySchema),
  recentEntries: z.array(compendiumShelfEntrySchema),
});

export const referenceCacheEntrySchema = z.object({
  cacheKey: z.string(),
  resource: z.enum(referenceResources),
  params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.undefined()])),
  fetchedAt: z.string(),
  source: z.literal('open5e'),
  items: z.array(z.any()),
});

export const referenceCacheStateSchema = z.object({
  entries: z.array(referenceCacheEntrySchema),
});

export const supabaseSyncSettingsSchema = z.object({
  autoSync: z.boolean(),
  userId: z.string().nullable().optional(),
  lastSyncedAt: z.string().nullable().optional(),
  lastPulledAt: z.string().nullable().optional(),
});

export const appSettingsSchema = z.object({
  referenceDocumentFilter: z.string(),
  referenceCacheHours: z.number().min(1),
  encumbranceMode: z.enum(['off', 'standard']),
  compactMode: z.boolean(),
  seedLoaded: z.boolean(),
  lastSelectedCharacterId: z.string().nullable().optional(),
  printOptions: z.object({
    showNotes: z.boolean(),
    showSpellbook: z.boolean(),
  }),
  supabase: supabaseSyncSettingsSchema,
});

export const uiPreferencesSchema = z.object({
  navCollapsed: z.boolean(),
  spellFiltersOpen: z.boolean(),
  compactCards: z.boolean(),
  activeNoteId: z.string().nullable().optional(),
  compendium: compendiumPreferencesSchema,
});

export const importExportBundleSchema = z.object({
  version: z.number().int().min(1),
  exportedAt: z.string(),
  source: z.string(),
  selectedCharacterId: z.string().nullable(),
  characters: z.array(characterSchema),
  companions: z.array(companionSchema),
  notes: z.array(noteSchema),
  homebrew: z.array(homebrewEntrySchema),
  settings: appSettingsSchema,
  uiPreferences: uiPreferencesSchema,
  referenceCache: referenceCacheStateSchema,
});

export const backupSnapshotSchema = z.object({
  id: z.string(),
  label: z.string(),
  createdAt: z.string(),
  bundle: importExportBundleSchema,
});

export const persistedAppDataSchema = importExportBundleSchema;
