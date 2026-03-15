import { Character, Companion, HomebrewEntry, Note } from '../domain/models';
import { isoNow } from '../utils/numbers';

export const updateById = <T extends { id: string }>(
  collection: T[],
  id: string,
  updater: (entry: T) => T
): T[] => collection.map((entry) => (entry.id === id ? updater(entry) : entry));

export const removeById = <T extends { id: string }>(collection: T[], id: string): T[] =>
  collection.filter((entry) => entry.id !== id);

export const touchCharacter = (character: Character): Character => ({
  ...character,
  updatedAt: isoNow(),
});

export const touchCompanion = (companion: Companion): Companion => ({
  ...companion,
  updatedAt: isoNow(),
});

export const touchNote = (note: Note): Note => ({
  ...note,
  updatedAt: isoNow(),
});

export const touchHomebrew = (entry: HomebrewEntry): HomebrewEntry => ({
  ...entry,
  updatedAt: isoNow(),
});
