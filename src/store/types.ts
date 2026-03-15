import { GameMembership, GamePermissionSet, GameRecord, GameRole } from '../domain/collaboration';
import {
  Character,
  Companion,
  HomebrewEntry,
  PersistedAppData,
  ReferenceCacheEntry,
  UiPreferences,
} from '../domain/models';

export interface CoreSlice {
  replaceAllData: (data: PersistedAppData) => void;
  restoreSeedData: () => void;
}

export interface CharactersSlice {
  createCharacter: (initial?: Partial<Character>) => string;
  updateCharacter: (id: string, updater: (character: Character) => Character) => void;
  deleteCharacter: (id: string) => void;
  duplicateCharacter: (id: string) => string | null;
  selectCharacter: (id: string | null) => void;
}

export interface SpellsSlice {
  addCharacterSpell: (
    characterId: string,
    entry?: Character['spellbook']['spells'][number]
  ) => void;
  updateCharacterSpell: (
    characterId: string,
    spellEntryId: string,
    updater: (
      entry: Character['spellbook']['spells'][number]
    ) => Character['spellbook']['spells'][number]
  ) => void;
  removeCharacterSpell: (characterId: string, spellEntryId: string) => void;
  updateSpellSlot: (
    characterId: string,
    level: number,
    updater: (
      slot: Character['spellbook']['slots'][number]
    ) => Character['spellbook']['slots'][number]
  ) => void;
  updatePactMagic: (
    characterId: string,
    updater: (pact: Character['spellbook']['pactMagic']) => Character['spellbook']['pactMagic']
  ) => void;
  addCompanionSpell: (
    companionId: string,
    entry?: Companion['spellbook']['spells'][number]
  ) => void;
  updateCompanionSpell: (
    companionId: string,
    spellEntryId: string,
    updater: (
      entry: Companion['spellbook']['spells'][number]
    ) => Companion['spellbook']['spells'][number]
  ) => void;
  removeCompanionSpell: (companionId: string, spellEntryId: string) => void;
}

export interface InventorySlice {
  addCharacterItem: (characterId: string, item?: Character['inventory']['items'][number]) => void;
  updateCharacterItem: (
    characterId: string,
    itemId: string,
    updater: (
      item: Character['inventory']['items'][number]
    ) => Character['inventory']['items'][number]
  ) => void;
  removeCharacterItem: (characterId: string, itemId: string) => void;
  moveCharacterItem: (characterId: string, itemId: string, containerId: string | null) => void;
  addCharacterContainer: (
    characterId: string,
    container?: Character['inventory']['containers'][number]
  ) => void;
  updateCharacterCurrency: (
    characterId: string,
    updater: (currency: Character['currency']) => Character['currency']
  ) => void;
  addCompanionItem: (companionId: string, item?: Companion['inventory']['items'][number]) => void;
  updateCompanionItem: (
    companionId: string,
    itemId: string,
    updater: (
      item: Companion['inventory']['items'][number]
    ) => Companion['inventory']['items'][number]
  ) => void;
  removeCompanionItem: (companionId: string, itemId: string) => void;
  moveCompanionItem: (companionId: string, itemId: string, containerId: string | null) => void;
  addCompanionContainer: (
    companionId: string,
    container?: Companion['inventory']['containers'][number]
  ) => void;
  updateCharacterContainer: (
    characterId: string,
    containerId: string,
    updater: (
      container: Character['inventory']['containers'][number]
    ) => Character['inventory']['containers'][number]
  ) => void;
  removeCharacterContainer: (characterId: string, containerId: string) => void;
  setItemVisibility: (characterId: string, itemId: string, gmVisibleOnly: boolean) => void;
  revealItem: (characterId: string, itemId: string) => void;
}

export interface CompanionsSlice {
  createCompanion: (parentCharacterId: string, initial?: Partial<Companion>) => string;
  updateCompanion: (id: string, updater: (companion: Companion) => Companion) => void;
  deleteCompanion: (id: string) => void;
  addCompanionTimer: (companionId: string, timer?: Companion['timers'][number]) => void;
  updateCompanionTimer: (
    companionId: string,
    timerId: string,
    updater: (timer: Companion['timers'][number]) => Companion['timers'][number]
  ) => void;
  removeCompanionTimer: (companionId: string, timerId: string) => void;
}

export interface WildShapesSlice {
  addWildShapeForm: (
    characterId: string,
    form?: Character['wildShapes']['forms'][number]
  ) => string;
  updateWildShapeForm: (
    characterId: string,
    formId: string,
    updater: (
      form: Character['wildShapes']['forms'][number]
    ) => Character['wildShapes']['forms'][number]
  ) => void;
  removeWildShapeForm: (characterId: string, formId: string) => void;
  setActiveWildShape: (characterId: string, formId: string) => void;
  clearActiveWildShape: (characterId: string) => void;
  updateActiveWildShapeHp: (characterId: string, delta: number) => void;
  setActivePolymorph: (
    characterId: string,
    polymorphState: import('../domain/models').PolymorphState
  ) => void;
  clearPolymorph: (characterId: string) => void;
}

export interface NotesSlice {
  createNote: (initial?: Partial<import('../domain/models').Note>) => string;
  updateNote: (
    id: string,
    updater: (note: import('../domain/models').Note) => import('../domain/models').Note
  ) => void;
  deleteNote: (id: string) => void;
}

export interface HomebrewSlice {
  createHomebrew: (initial?: Partial<HomebrewEntry>) => string;
  updateHomebrew: (id: string, updater: (entry: HomebrewEntry) => HomebrewEntry) => void;
  deleteHomebrew: (id: string) => void;
  cloneSourceToHomebrew: (
    seed: Pick<
      HomebrewEntry,
      'entityType' | 'name' | 'summary' | 'sourceRef' | 'sourceData' | 'overrideData'
    >
  ) => string;
}

export interface SettingsSlice {
  updateSettings: (
    updater: (settings: PersistedAppData['settings']) => PersistedAppData['settings']
  ) => void;
}

export interface UiSlice {
  updateUiPreferences: (updater: (ui: UiPreferences) => UiPreferences) => void;
}

export interface ReferenceSlice {
  setReferenceCacheEntry: (entry: ReferenceCacheEntry) => void;
  clearReferenceCache: () => void;
}

export interface SettlementsSlice {
  createSettlement: (initial?: Partial<import('../domain/models').Settlement>) => string;
  updateSettlementSection: (
    settlementId: string,
    sectionId: string,
    updater: (
      section: import('../domain/models').SettlementSection
    ) => import('../domain/models').SettlementSection
  ) => void;
  addMapPin: (
    settlementId: string,
    pin?: Partial<import('../domain/models').MapPin>
  ) => void;
  removeMapPin: (settlementId: string, pinId: string) => void;
  publishSettlement: (id: string) => void;
  deleteSettlement: (id: string) => void;
}

export interface GamesSlice {
  games: GameRecord[];
  activeMemberships: GameMembership[];
  setGames: (games: GameRecord[]) => void;
  addGame: (game: GameRecord) => void;
  removeGame: (gameId: string) => void;
  setActiveMemberships: (memberships: GameMembership[]) => void;
  updateMembershipLocal: (
    callerRole: GameRole,
    membershipId: string,
    role: GameRole,
    permissions: GamePermissionSet
  ) => void;
}

export type AppStore = PersistedAppData &
  CoreSlice &
  CharactersSlice &
  SpellsSlice &
  InventorySlice &
  CompanionsSlice &
  WildShapesSlice &
  NotesSlice &
  HomebrewSlice &
  SettingsSlice &
  UiSlice &
  ReferenceSlice &
  GamesSlice &
  SettlementsSlice;
