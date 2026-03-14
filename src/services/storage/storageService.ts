import { BackupSnapshot, ImportExportBundle, PersistedAppData } from '../../domain/models';
import { backupSnapshotSchema, importExportBundleSchema } from '../../domain/schemas';
import { createSeedPersistedAppData } from '../../domain/seeds';
import { createId } from '../../utils/id';
import { isoNow } from '../../utils/numbers';
import { migratePersistedAppData } from './migrations';
import { APP_EXPORT_SOURCE, STORAGE_KEYS, STORAGE_VERSION } from './keys';

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

const mergeReferenceCache = (base: PersistedAppData['referenceCache'], incoming: PersistedAppData['referenceCache']) => {
  const map = new Map(base.entries.map((entry) => [entry.cacheKey, entry]));
  incoming.entries.forEach((entry) => map.set(entry.cacheKey, entry));
  return { entries: Array.from(map.values()) };
};

export const storageService = {
  loadAppData(): PersistedAppData {
    const storage = getStorage();
    if (!storage) {
      return createSeedPersistedAppData();
    }

    const raw = safeParseJson(storage.getItem(STORAGE_KEYS.app));
    return migratePersistedAppData(raw);
  },

  saveAppData(data: PersistedAppData): void {
    const storage = getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(
      STORAGE_KEYS.app,
      JSON.stringify(
        {
          ...data,
          version: STORAGE_VERSION,
        },
        null,
        2,
      ),
    );
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
    return snapshot ? (snapshot.bundle as PersistedAppData) : null;
  },
};
