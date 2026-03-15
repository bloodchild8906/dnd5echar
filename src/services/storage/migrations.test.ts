import * as fc from 'fast-check';
import { createBlankSpell, createSeedPersistedAppData } from '../../domain/seeds';
import { persistedAppDataSchema } from '../../domain/schemas';
import { migratePersistedAppData } from './migrations';
import { STORAGE_VERSION } from './keys';

// Feature: codex-arcanum, Property 1: Migration produces valid output
describe('migratePersistedAppData — property tests', () => {
  it('Property 1: Migration produces valid output — Validates: Requirements 2.4, 2.5, 2.6', () => {
    const arbitraryInput = fc
      .record({ version: fc.integer({ min: 1, max: STORAGE_VERSION }) })
      .chain((base) =>
        fc.record({
          version: fc.constant(base.version),
          extra: fc.anything(),
        }).map(({ version, extra }) =>
          typeof extra === 'object' && extra !== null && !Array.isArray(extra)
            ? { ...(extra as Record<string, unknown>), version }
            : { version }
        )
      );

    fc.assert(
      fc.property(arbitraryInput, (input) => {
        const result = migratePersistedAppData(input);
        const parsed = persistedAppDataSchema.safeParse(result);
        return parsed.success;
      }),
      { numRuns: 200 }
    );
  });
});

describe('migratePersistedAppData', () => {
  it('backfills compendium preferences when migrating a v2 workspace', () => {
    const current = createSeedPersistedAppData();
    const legacyWorkspace = {
      ...current,
      version: 2,
      uiPreferences: {
        navCollapsed: current.uiPreferences.navCollapsed,
        spellFiltersOpen: current.uiPreferences.spellFiltersOpen,
        compactCards: current.uiPreferences.compactCards,
        activeNoteId: current.uiPreferences.activeNoteId,
      },
    };

    const migrated = migratePersistedAppData(legacyWorkspace);

    expect(migrated.version).toBe(STORAGE_VERSION);
    expect(migrated.uiPreferences.navCollapsed).toBe(current.uiPreferences.navCollapsed);
    expect(migrated.uiPreferences.compendium).toEqual({
      pinnedEntries: [],
      recentEntries: [],
    });
  });

  it('preserves compendium shelf data for current-version workspaces', () => {
    const current = createSeedPersistedAppData();
    const spell = {
      ...createBlankSpell('Magic Missile'),
      id: 'magic-missile',
      sourceRef: {
        sourceType: 'open5e' as const,
        sourceName: 'Open5e',
        documentSlug: '5esrd',
        fetchedAt: '2026-03-15T00:00:00.000Z',
      },
    };

    current.uiPreferences.compendium.pinnedEntries = [
      {
        entryId: spell.id,
        resource: 'spells',
        snapshot: spell,
        savedAt: '2026-03-15T00:00:00.000Z',
      },
    ];

    const migrated = migratePersistedAppData(current);

    expect(migrated.uiPreferences.compendium.pinnedEntries).toHaveLength(1);
    expect(migrated.uiPreferences.compendium.pinnedEntries[0]?.entryId).toBe('magic-missile');
    expect(migrated.uiPreferences.compendium.pinnedEntries[0]?.snapshot.name).toBe('Magic Missile');
  });

  describe('v3 → v4 migration', () => {
    const makeV3Workspace = (characterOverrides: Record<string, unknown> = {}) => {
      const current = createSeedPersistedAppData();
      const { conditions, featureNotes, appearance, ...charWithoutNewFields } =
        current.characters[0]!;
      void conditions;
      void featureNotes;
      void appearance;
      return {
        ...current,
        version: 3,
        characters: [{ ...charWithoutNewFields, ...characterOverrides }],
      };
    };

    it('bumps version to current STORAGE_VERSION', () => {
      const migrated = migratePersistedAppData(makeV3Workspace());
      expect(migrated.version).toBe(STORAGE_VERSION);
    });

    it('back-fills missing conditions with empty array', () => {
      const migrated = migratePersistedAppData(makeV3Workspace());
      expect(migrated.characters[0]?.conditions).toEqual([]);
    });

    it('back-fills missing featureNotes with empty string', () => {
      const migrated = migratePersistedAppData(makeV3Workspace());
      expect(migrated.characters[0]?.featureNotes).toBe('');
    });

    it('back-fills missing appearance with empty string', () => {
      const migrated = migratePersistedAppData(makeV3Workspace());
      expect(migrated.characters[0]?.appearance).toBe('');
    });

    it('preserves existing conditions if already present', () => {
      const migrated = migratePersistedAppData(
        makeV3Workspace({ conditions: ['Poisoned', 'Blinded'] })
      );
      expect(migrated.characters[0]?.conditions).toEqual(['Poisoned', 'Blinded']);
    });

    it('preserves existing featureNotes if already present', () => {
      const migrated = migratePersistedAppData(makeV3Workspace({ featureNotes: 'Some notes' }));
      expect(migrated.characters[0]?.featureNotes).toBe('Some notes');
    });

    it('preserves existing appearance if already present', () => {
      const migrated = migratePersistedAppData(makeV3Workspace({ appearance: 'Tall and dark' }));
      expect(migrated.characters[0]?.appearance).toBe('Tall and dark');
    });
  });
});
