import * as fc from 'fast-check';
import {
  createBlankCharacter,
  createBlankCompanion,
  createBlankNote,
  createSeedPersistedAppData,
} from '../../domain/seeds';
import { storageService } from './storageService';
import { migratePersistedAppData } from './migrations';

describe('storageService.mergeBundles', () => {
  it('merges by id without dropping existing data', () => {
    const base = createSeedPersistedAppData();
    const incoming = createSeedPersistedAppData();
    incoming.characters[0].id = 'character-imported';
    incoming.characters[0].name = 'Imported Hero';

    const merged = storageService.mergeBundles(base, incoming);

    expect(merged.characters).toHaveLength(2);
    expect(merged.characters.some((entry) => entry.name === 'Imported Hero')).toBe(true);
    expect(merged.characters.some((entry) => entry.id === 'character-seed-moon-druid')).toBe(true);
  });
});

describe('storageService.createCharacterBundle', () => {
  it('filters the bundle to the requested character and related records', () => {
    const base = createSeedPersistedAppData();
    const secondaryCharacter = createBlankCharacter();
    secondaryCharacter.id = 'character-secondary';
    secondaryCharacter.name = 'Secondary Hero';

    const secondaryCompanion = createBlankCompanion(secondaryCharacter.id);
    secondaryCompanion.id = 'companion-secondary';

    const secondaryNote = createBlankNote();
    secondaryNote.id = 'note-secondary';
    secondaryNote.relatedCharacterId = secondaryCharacter.id;

    const generalNote = createBlankNote();
    generalNote.id = 'note-general';
    generalNote.relatedCharacterId = undefined;

    base.characters.push(secondaryCharacter);
    base.companions.push(secondaryCompanion);
    base.notes.push(secondaryNote, generalNote);

    const bundle = storageService.createCharacterBundle(base, secondaryCharacter.id);

    expect(bundle?.selectedCharacterId).toBe(secondaryCharacter.id);
    expect(bundle?.characters.map((entry) => entry.id)).toEqual([secondaryCharacter.id]);
    expect(bundle?.companions.map((entry) => entry.id)).toEqual([secondaryCompanion.id]);
    expect(bundle?.notes.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(['note-secondary', 'note-general'])
    );
    expect(bundle?.notes.some((entry) => entry.id === 'note-seed-session')).toBe(false);
  });
});

// Feature: codex-arcanum, Property 2: Serialization round-trip
describe('Property 2: Serialization round-trip', () => {
  /**
   * Validates: Requirements 2.8, 10.5
   *
   * For any valid PersistedAppData object, calling serializeBundle then
   * parseImportBundle then migratePersistedAppData should produce a value
   * whose core data arrays and settings are deeply equal to the original.
   *
   * Note: serializeBundle stamps a fresh exportedAt timestamp and pins
   * version to STORAGE_VERSION, so those two fields are intentionally
   * excluded from the deep-equality check — all other fields must survive
   * the round-trip unchanged.
   */
  it('parseImportBundle(serializeBundle(data)) preserves core data fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          selectedCharacterId: fc.oneof(fc.string({ minLength: 1, maxLength: 40 }), fc.constant(null)),
          version: fc.integer({ min: 1, max: 10 }),
        }),
        ({ selectedCharacterId, version }) => {
          const base = createSeedPersistedAppData();
          const data = { ...base, selectedCharacterId, version };

          const serialized = storageService.serializeBundle(data);
          const parsed = storageService.parseImportBundle(serialized);
          const migrated = migratePersistedAppData(parsed);

          // Core data arrays must survive the round-trip unchanged
          expect(migrated.characters).toEqual(data.characters);
          expect(migrated.companions).toEqual(data.companions);
          expect(migrated.notes).toEqual(data.notes);
          expect(migrated.homebrew).toEqual(data.homebrew);
          expect(migrated.settings).toEqual(data.settings);
          expect(migrated.uiPreferences).toEqual(data.uiPreferences);
          expect(migrated.referenceCache).toEqual(data.referenceCache);
          expect(migrated.selectedCharacterId).toEqual(data.selectedCharacterId);
        }
      ),
      { numRuns: 200 }
    );
  });
});

// Feature: codex-arcanum, Property 3: Export/import round-trip
describe('Property 3: Export/import round-trip', () => {
  /**
   * Validates: Requirements 10.5
   *
   * For any valid PersistedAppData bundle, exporting via exportBundle then
   * serializing to JSON and importing via parseImportBundle should produce
   * an object whose characters, companions, notes, and homebrew arrays are
   * deeply equal to the originals.
   */
  it('characters, companions, notes, homebrew survive export → import unchanged', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.string({ minLength: 1, maxLength: 40 }), fc.constant(null)),
        (selectedCharacterId) => {
          const base = createSeedPersistedAppData();
          const data = { ...base, selectedCharacterId };

          const bundle = storageService.exportBundle(data);
          const json = JSON.stringify(bundle);
          const imported = storageService.parseImportBundle(json);

          expect(imported.characters).toEqual(data.characters);
          expect(imported.companions).toEqual(data.companions);
          expect(imported.notes).toEqual(data.notes);
          expect(imported.homebrew).toEqual(data.homebrew);
        }
      ),
      { numRuns: 200 }
    );
  });
});

// Feature: codex-arcanum, Property 4: Snapshot round-trip
describe('Property 4: Snapshot round-trip', () => {
  /**
   * Validates: Requirements 25.5
   *
   * For any valid PersistedAppData, calling createBackupSnapshot then
   * restoreBackup with the returned snapshot id should produce a value
   * whose core fields deeply equal the originals.
   *
   * localStorage is mocked with an in-memory Map so the write/read cycle
   * works in the test environment without touching the real browser storage.
   */

  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map<string, string>();
    const mockStorage: Storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      get length() {
        return store.size;
      },
    };
    // getStorage() guards on `typeof window === 'undefined'`, so we must stub
    // the global `window` object (not just `localStorage`) in the node environment.
    vi.stubGlobal('window', { localStorage: mockStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('restoreBackup(createBackupSnapshot(data).id) deeply equals original core fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          selectedCharacterId: fc.oneof(fc.string({ minLength: 1, maxLength: 40 }), fc.constant(null)),
          version: fc.integer({ min: 1, max: 10 }),
        }),
        ({ selectedCharacterId, version }) => {
          const base = createSeedPersistedAppData();
          const data = { ...base, selectedCharacterId, version };

          const snapshot = storageService.createBackupSnapshot(data);
          const restored = storageService.restoreBackup(snapshot.id);

          expect(restored).not.toBeNull();
          expect(restored!.characters).toEqual(data.characters);
          expect(restored!.companions).toEqual(data.companions);
          expect(restored!.notes).toEqual(data.notes);
          expect(restored!.homebrew).toEqual(data.homebrew);
          expect(restored!.settings).toEqual(data.settings);
          expect(restored!.uiPreferences).toEqual(data.uiPreferences);
        }
      ),
      { numRuns: 200 }
    );
  });
});
