export const STORAGE_VERSION = 3;

export const STORAGE_KEYS = {
  app: `dnd5echar:app:v${STORAGE_VERSION}`,
  backups: `dnd5echar:backups:v${STORAGE_VERSION}`,
} as const;

export const APP_EXPORT_SOURCE = 'dnd5e-character-sheet-manager';
