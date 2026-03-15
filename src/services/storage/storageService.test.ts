import {
  createBlankCharacter,
  createBlankCompanion,
  createBlankNote,
  createSeedPersistedAppData,
} from '../../domain/seeds';
import { storageService } from './storageService';

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
