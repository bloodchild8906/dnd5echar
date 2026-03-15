export const abilities = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
] as const;

export const skills = [
  'acrobatics',
  'animalHandling',
  'arcana',
  'athletics',
  'deception',
  'history',
  'insight',
  'intimidation',
  'investigation',
  'medicine',
  'nature',
  'perception',
  'performance',
  'persuasion',
  'religion',
  'sleightOfHand',
  'stealth',
  'survival',
] as const;

export const noteTypes = [
  'character',
  'session',
  'quest',
  'npc',
  'location',
  'item',
  'spell',
  'companion',
] as const;

export const spellSourceKinds = [
  'class',
  'subclass',
  'race',
  'feat',
  'item',
  'innate',
  'companion',
  'homebrew',
  'custom',
] as const;

export const sourceTypes = ['open5e', 'homebrew', 'cloned-from-open5e', 'user-created'] as const;

export const proficiencyLevels = ['none', 'proficient', 'expertise'] as const;

export const companionTypes = ['pet', 'familiar', 'summoned', 'mount', 'npc-follower'] as const;

export const homebrewEntityTypes = [
  'race',
  'class',
  'subclass',
  'feat',
  'item',
  'spell',
  'creature',
  'background',
  'companion',
  'form',
] as const;

export const inventoryContainerTypes = [
  'backpack',
  'belt',
  'pouch',
  'mount-pack',
  'custom',
] as const;

export const referenceResources = [
  'classes',
  'races',
  'backgrounds',
  'feats',
  'spells',
  'monsters',
  'weapons',
  'armor',
  'magicitems',
] as const;

export type Ability = (typeof abilities)[number];
export type Skill = (typeof skills)[number];
export type NoteType = (typeof noteTypes)[number];
export type SpellSourceKind = (typeof spellSourceKinds)[number];
export type SourceType = (typeof sourceTypes)[number];
export type ProficiencyLevel = (typeof proficiencyLevels)[number];
export type CompanionType = (typeof companionTypes)[number];
export type HomebrewEntityType = (typeof homebrewEntityTypes)[number];
export type InventoryContainerType = (typeof inventoryContainerTypes)[number];
export type ReferenceResource = (typeof referenceResources)[number];
export type CurrencyDenomination = 'cp' | 'sp' | 'ep' | 'gp' | 'pp';

export interface ManualOverride<T> {
  value: T;
  reason: string;
  updatedAt: string;
}

export interface StatAdjustment {
  score: number;
  bonus: number;
  temp: number;
}

export type AbilityScores = Record<Ability, StatAdjustment>;

export interface SkillState {
  proficiency: ProficiencyLevel;
  bonus: number;
  override?: ManualOverride<number>;
}

export interface SavingThrowState {
  proficient: boolean;
  bonus: number;
  override?: ManualOverride<number>;
}

export interface SourceReference {
  sourceType: SourceType;
  sourceId?: string;
  sourceName?: string;
  originId?: string;
  originCollection?: string;
  documentSlug?: string;
  sourceUrl?: string;
  canonicalUrl?: string;
  fetchedAt?: string;
}

export interface ItemValue {
  amount: number;
  denomination: CurrencyDenomination;
}

export interface SpeedSet {
  walk: number;
  burrow?: number;
  climb?: number;
  fly?: number;
  swim?: number;
}

export interface HitPointState {
  max: number;
  current: number;
  temp: number;
}

export interface DeathSaveState {
  successes: number;
  failures: number;
}

export interface CurrencyWallet {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

export interface TraitEntry {
  id: string;
  name: string;
  description: string;
  source?: string;
}

export interface ActionEntry {
  id: string;
  name: string;
  description: string;
  attackBonus?: number;
  damage?: string;
  notes?: string;
}

export interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  description: string;
  higherLevel?: string;
  castingTime: string;
  range: string;
  duration: string;
  classes: string[];
  ritual: boolean;
  concentration: boolean;
  components: string[];
  tags: string[];
  notes?: string;
  damageRoll?: string;
  savingThrowAbility?: string;
  attackRoll?: boolean;
  sourceRef: SourceReference;
  url?: string;
}

export interface SpellPreparationState {
  id: string;
  spell: Spell;
  sourceKind: SpellSourceKind;
  sourceLabel: string;
  known: boolean;
  prepared: boolean;
  alwaysPrepared: boolean;
  pinned: boolean;
  castCount: number;
  notes: string;
}

export interface SpellSlotState {
  level: number;
  max: number;
  used: number;
}

export interface PactMagicState {
  enabled: boolean;
  slotLevel: number;
  slots: number;
  used: number;
}

export interface CharacterSpellbook {
  spellcastingAbility: Ability;
  spellcastingClass: string;
  multiclassSummary: string;
  notes: string;
  slots: SpellSlotState[];
  pactMagic: PactMagicState;
  spells: SpellPreparationState[];
  innateSpells: SpellPreparationState[];
  itemGrantedSpells: SpellPreparationState[];
  overrides: {
    saveDc?: ManualOverride<number>;
    attackBonus?: ManualOverride<number>;
  };
}

export interface InventoryContainer {
  id: string;
  name: string;
  parentId?: string | null;
  notes: string;
  type: InventoryContainerType;
  order: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  weight: number;
  value: ItemValue;
  rarity: string;
  attunementRequired: boolean;
  attuned: boolean;
  equipped: boolean;
  charges?: {
    current: number;
    max: number;
  };
  consumable: boolean;
  tags: string[];
  notes: string;
  containerId?: string | null;
  sourceRef: SourceReference;
  armorClass?: number;
  damage?: string;
  properties?: string[];
}

export interface CompanionInventory {
  containers: InventoryContainer[];
  items: InventoryItem[];
  currency: CurrencyWallet;
}

export interface ActorStatBlock {
  abilities: AbilityScores;
  skills: Partial<Record<Skill, number>>;
  savingThrows: Partial<Record<Ability, number>>;
  ac: number;
  hp: HitPointState;
  speed: SpeedSet;
  senses: string[];
  languages: string[];
  actions: ActionEntry[];
  traits: TraitEntry[];
  initiative: number;
  hitDice: string;
  notes: string;
}

export interface ReferenceCreature {
  id: string;
  name: string;
  size: string;
  creatureType: string;
  alignment: string;
  challengeRating: string;
  description: string;
  sourceRef: SourceReference;
  stats: ActorStatBlock;
}

export interface WildShapeForm {
  id: string;
  name: string;
  favorite: boolean;
  notes: string;
  rulesNotes: string;
  size: string;
  creatureType: string;
  challengeRating: string;
  sourceRef: SourceReference;
  stats: ActorStatBlock;
}

export interface ActiveFormState {
  formId: string;
  currentHp: number;
  revertHp: number;
  notes: string;
  retainedMentalStats: boolean;
  retainedSkillProficiencies: boolean;
}

export interface CharacterCombatState {
  baseArmorClass: number;
  armorClassOverride?: ManualOverride<number>;
  initiativeBonus: number;
  initiativeOverride?: ManualOverride<number>;
  hitPoints: HitPointState;
  hitDice: string;
  deathSaves: DeathSaveState;
  resistances: string[];
  immunities: string[];
  vulnerabilities: string[];
  inspiration: boolean;
  passiveOverrides: {
    perception?: ManualOverride<number>;
    investigation?: ManualOverride<number>;
    insight?: ManualOverride<number>;
  };
}

export interface Character {
  id: string;
  name: string;
  portraitUrl: string;
  level: number;
  className: string;
  subclassName: string;
  raceName: string;
  subraceName: string;
  backgroundName: string;
  alignment: string;
  experience: number;
  proficiencyBonusOverride?: ManualOverride<number>;
  abilityScores: AbilityScores;
  savingThrows: Record<Ability, SavingThrowState>;
  skills: Record<Skill, SkillState>;
  languages: string[];
  senses: string[];
  movement: SpeedSet;
  combat: CharacterCombatState;
  spellbook: CharacterSpellbook;
  inventory: CompanionInventory;
  wildShapes: {
    forms: WildShapeForm[];
    activeForm?: ActiveFormState | null;
  };
  features: TraitEntry[];
  actions: ActionEntry[];
  currency: CurrencyWallet;
  conditions: string[];
  notes: string;
  featureNotes: string;
  sourceRef: SourceReference;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterSummary {
  id: string;
  name: string;
  portraitUrl: string;
  level: number;
  className: string;
  subclassName: string;
  raceName: string;
  currentHp: number;
  maxHp: number;
  conditions: string[];
}

export interface Companion {
  id: string;
  parentCharacterId: string;
  name: string;
  type: CompanionType;
  tags: string[];
  initiative: number;
  notes: string;
  sourceRef: SourceReference;
  originLink?: {
    type: 'spell' | 'feature' | 'item' | 'homebrew';
    id?: string;
    label?: string;
  };
  stats: ActorStatBlock;
  inventory: CompanionInventory;
  spellbook: CharacterSpellbook;
  createdAt: string;
  updatedAt: string;
}

export interface NoteSection {
  id: string;
  title: string;
  body: string;
  collapsed: boolean;
}

export interface Note {
  id: string;
  type: NoteType;
  title: string;
  body: string;
  format: 'plain' | 'markdown-lite';
  tags: string[];
  pinned: boolean;
  relatedCharacterId?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  sections: NoteSection[];
  createdAt: string;
  updatedAt: string;
}

export interface HomebrewEntry {
  id: string;
  entityType: HomebrewEntityType;
  name: string;
  summary: string;
  tags: string[];
  sourceRef: SourceReference;
  sourceData: unknown | null;
  overrideData: unknown;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferenceOption {
  id: string;
  name: string;
  summary: string;
  resource: ReferenceResource;
  tags: string[];
  sourceRef: SourceReference;
  raw: Record<string, unknown>;
}

export type ReferenceEntrySnapshot = ReferenceOption | ReferenceCreature | Spell;

export interface CompendiumShelfEntry {
  entryId: string;
  resource: ReferenceResource;
  snapshot: ReferenceEntrySnapshot;
  savedAt: string;
}

export interface CompendiumPreferences {
  pinnedEntries: CompendiumShelfEntry[];
  recentEntries: CompendiumShelfEntry[];
}

export interface ReferenceCacheEntry {
  cacheKey: string;
  resource: ReferenceResource;
  params: Record<string, string | number | boolean | undefined>;
  fetchedAt: string;
  source: 'open5e';
  items: unknown[];
}

export interface ReferenceCacheState {
  entries: ReferenceCacheEntry[];
}

export interface SupabaseSyncSettings {
  autoSync: boolean;
  userId?: string | null;
  lastSyncedAt?: string | null;
  lastPulledAt?: string | null;
}

export interface AppSettings {
  referenceDocumentFilter: string;
  referenceCacheHours: number;
  encumbranceMode: 'off' | 'standard';
  compactMode: boolean;
  seedLoaded: boolean;
  lastSelectedCharacterId?: string | null;
  printOptions: {
    showNotes: boolean;
    showSpellbook: boolean;
  };
  supabase: SupabaseSyncSettings;
}

export interface UiPreferences {
  navCollapsed: boolean;
  spellFiltersOpen: boolean;
  compactCards: boolean;
  activeNoteId?: string | null;
  compendium: CompendiumPreferences;
}

export interface ImportExportBundle {
  version: number;
  exportedAt: string;
  source: string;
  selectedCharacterId: string | null;
  characters: Character[];
  companions: Companion[];
  notes: Note[];
  homebrew: HomebrewEntry[];
  settings: AppSettings;
  uiPreferences: UiPreferences;
  referenceCache: ReferenceCacheState;
}

export interface BackupSnapshot {
  id: string;
  label: string;
  createdAt: string;
  bundle: ImportExportBundle;
}

export interface PersistedAppData extends ImportExportBundle {}
