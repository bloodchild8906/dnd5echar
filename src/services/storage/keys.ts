export const STORAGE_VERSION = 8;

export const STORAGE_KEYS = {
  app: `dnd5echar:app:v${STORAGE_VERSION}`,
  backups: `dnd5echar:backups:v${STORAGE_VERSION}`,
  /** Legacy key used before the IndexedDB migration (v7 and earlier). */
  legacyAppV7: 'dnd5echar:app:v7',
} as const;

export const APP_EXPORT_SOURCE = 'dnd5e-character-sheet-manager';
