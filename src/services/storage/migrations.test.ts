import { createBlankSpell, createSeedPersistedAppData } from '../../domain/seeds';
import { migratePersistedAppData } from './migrations';
import { STORAGE_VERSION } from './keys';

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
});
