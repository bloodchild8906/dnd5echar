import { BackupSnapshot, ImportExportBundle, PersistedAppData } from '../../domain/models';
import { backupSnapshotSchema, importExportBundleSchema } from '../../domain/schemas';
import { createSeedPersistedAppData } from '../../domain/seeds';
import { createId } from '../../utils/id';
import { isoNow } from '../../utils/numbers';
import { migratePersistedAppData } from './migrations';
import { APP_EXPORT_SOURCE, STORAGE_KEYS, STORAGE_VERSION } from './keys';
import { indexedDbService } from './indexedDbService';

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const safeParseJson = (value: string | null): unknown => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
};

const mergeById = <T extends { id: string }>(base: T[], incoming: T[]): T[] => {
  const map = new Map(base.map((entry) => [entry.id, entry]));
  incoming.forEach((entry) => map.set(entry.id, entry));
  return Array.from(map.values());
};

const mergeReferenceCache = (
  base: PersistedAppData['referenceCache'],
  incoming: PersistedAppData['referenceCache']
) => {
  const map = new Map(base.entries.map((entry) => [entry.cacheKey, entry]));
  incoming.entries.forEach((entry) => map.set(entry.cacheKey, entry));
  return { entries: Array.from(map.values()) };
};

/**
 * Async init: populate IDB from localStorage on first load after v8 migration.
 * Seeds the in-memory cache so synchronous reads work immediately.
 */
const initIndexedDb = async (): Promise<void> => {
  try {
    const storage = getStorage();

    // Check if IDB already has the current app key
    const existing = await indexedDbService.get(STORAGE_KEYS.app);
    if (existing !== null) {
      // IDB is already populated — memCache was seeded during get(); done
      return;
    }

    // IDB is empty — check for legacy localStorage data to migrate
    if (storage) {
      const legacyRaw = storage.getItem(STORAGE_KEYS.legacyAppV7);
      if (legacyRaw !== null) {
        const parsed = safeParseJson(legacyRaw);
        const migrated = migratePersistedAppData(parsed);
        await indexedDbService.set(STORAGE_KEYS.app, migrated);
        // Verify the write succeeded before clearing localStorage
        const verified = await indexedDbService.get(STORAGE_KEYS.app);
        if (verified !== null) {
          storage.removeItem(STORAGE_KEYS.legacyAppV7);
        }
        return;
      }

      // Also check the current key in localStorage (e.g. IDB was cleared but LS still has data)
      const currentRaw = storage.getItem(STORAGE_KEYS.app);
      if (currentRaw !== null) {
        const parsed = safeParseJson(currentRaw);
        const migrated = migratePersistedAppData(parsed);
        await indexedDbService.set(STORAGE_KEYS.app, migrated);
        const verified = await indexedDbService.get(STORAGE_KEYS.app);
        if (verified !== null) {
          storage.removeItem(STORAGE_KEYS.app);
        }
      }
    }
  } catch {
    // Init failure is non-fatal; storageService falls back to memCache / seed data
  }
};

// Kick off IDB init at module load — non-blocking
void initIndexedDb();

export const storageService = {
  /**
   * Load app data synchronously from the in-memory cache populated by initIndexedDb().
   * Falls back to localStorage then seed data when IDB / memCache is unavailable.
   */
  loadAppData(): PersistedAppData {
    // Primary: read from IDB in-memory cache (populated by initIndexedDb)
    const cached = indexedDbService.getFromMemCache(STORAGE_KEYS.app);
    if (cached !== null) {
      return migratePersistedAppData(cached);
    }

    // Secondary: fall back to localStorage (covers test environments and first-render race)
    const storage = getStorage();
    if (storage) {
      // Check legacy key first, then current key
      const legacyRaw = storage.getItem(STORAGE_KEYS.legacyAppV7);
      if (legacyRaw !== null) {
        return migratePersistedAppData(safeParseJson(legacyRaw));
      }
      const raw = storage.getItem(STORAGE_KEYS.app);
      if (raw !== null) {
        return migratePersistedAppData(safeParseJson(raw));
      }
    }

    return createSeedPersistedAppData();
  },

  saveAppData(data: PersistedAppData): void {
    const payload = { ...data, version: STORAGE_VERSION };
    // Write to IDB (async, non-blocking); memCache is updated synchronously inside set()
    void indexedDbService.set(STORAGE_KEYS.app, payload);
  },

  exportBundle(data: PersistedAppData): ImportExportBundle {
    return {
      ...data,
      version: STORAGE_VERSION,
      exportedAt: isoNow(),
      source: APP_EXPORT_SOURCE,
    };
  },

  serializeBundle(data: PersistedAppData): string {
    return JSON.stringify(this.exportBundle(data), null, 2);
  },

  createCharacterBundle(data: PersistedAppData, characterId: string): PersistedAppData | null {
    const character = data.characters.find((entry) => entry.id === characterId);

    if (!character) {
      return null;
    }

    return {
      ...data,
      selectedCharacterId: characterId,
      characters: [character],
      companions: data.companions.filter((entry) => entry.parentCharacterId === characterId),
      notes: data.notes.filter(
        (entry) => !entry.relatedCharacterId || entry.relatedCharacterId === characterId
      ),
    };
  },

  parseImportBundle(json: string): PersistedAppData {
    const raw = safeParseJson(json);
    const migrated = migratePersistedAppData(raw);
    return importExportBundleSchema.parse(migrated) as PersistedAppData;
  },

  mergeBundles(current: PersistedAppData, incoming: PersistedAppData): PersistedAppData {
    return {
      ...current,
      selectedCharacterId: incoming.selectedCharacterId ?? current.selectedCharacterId,
      characters: mergeById(current.characters, incoming.characters),
      companions: mergeById(current.companions, incoming.companions),
      notes: mergeById(current.notes, incoming.notes),
      homebrew: mergeById(current.homebrew, incoming.homebrew),
      settings: incoming.settings,
      uiPreferences: incoming.uiPreferences,
      referenceCache: mergeReferenceCache(current.referenceCache, incoming.referenceCache),
      exportedAt: isoNow(),
      source: APP_EXPORT_SOURCE,
      version: STORAGE_VERSION,
    };
  },

  downloadBundle(filename: string, data: PersistedAppData): void {
    if (typeof document === 'undefined') {
      return;
    }

    const blob = new Blob([this.serializeBundle(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  },

  listBackups(): BackupSnapshot[] {
    const storage = getStorage();
    if (!storage) {
      return [];
    }

    const parsed = safeParseJson(storage.getItem(STORAGE_KEYS.backups));
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((entry) => {
      const result = backupSnapshotSchema.safeParse(entry);
      return result.success ? [result.data as BackupSnapshot] : [];
    });
  },

  saveBackups(backups: BackupSnapshot[]): void {
    const storage = getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(STORAGE_KEYS.backups, JSON.stringify(backups, null, 2));
  },

  createBackupSnapshot(data: PersistedAppData, label = 'Manual backup'): BackupSnapshot {
    const snapshot: BackupSnapshot = {
      id: createId('backup'),
      label,
      createdAt: isoNow(),
      bundle: this.exportBundle(data),
    };

    this.saveBackups([snapshot, ...this.listBackups()].slice(0, 10));
    return snapshot;
  },

  deleteBackup(snapshotId: string): void {
    this.saveBackups(this.listBackups().filter((entry) => entry.id !== snapshotId));
  },

  restoreBackup(snapshotId: string): PersistedAppData | null {
    const snapshot = this.listBackups().find((entry) => entry.id === snapshotId);
    return snapshot ? migratePersistedAppData(snapshot.bundle) : null;
  },
};
