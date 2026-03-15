import { StateCreator } from 'zustand';
import { CharacterSpellbook } from '../../domain/models';
import { createSpellEntry } from '../../domain/seeds';
import { touchCharacter, touchCompanion, updateById } from '../helpers';
import { AppStore, SpellsSlice } from '../types';

export const updateSpellEntryCollections = (
  spellbook: CharacterSpellbook,
  spellEntryId: string,
  updater: (entry: CharacterSpellbook['spells'][number]) => CharacterSpellbook['spells'][number]
): CharacterSpellbook => ({
  ...spellbook,
  spells: updateById(spellbook.spells, spellEntryId, updater),
  innateSpells: updateById(spellbook.innateSpells, spellEntryId, updater),
  itemGrantedSpells: updateById(spellbook.itemGrantedSpells, spellEntryId, updater),
});

export const removeSpellEntryCollections = (
  spellbook: CharacterSpellbook,
  spellEntryId: string
): CharacterSpellbook => ({
  ...spellbook,
  spells: spellbook.spells.filter((entry) => entry.id !== spellEntryId),
  innateSpells: spellbook.innateSpells.filter((entry) => entry.id !== spellEntryId),
  itemGrantedSpells: spellbook.itemGrantedSpells.filter((entry) => entry.id !== spellEntryId),
});

export const createSpellsSlice: StateCreator<AppStore, [], [], SpellsSlice> = (set) => ({
  addCharacterSpell: (characterId, entry = createSpellEntry()) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) =>
        touchCharacter({
          ...character,
          spellbook: {
            ...character.spellbook,
            spells: [entry, ...character.spellbook.spells],
          },
        })
      ),
    })),

  updateCharacterSpell: (characterId, spellEntryId, updater) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) =>
        touchCharacter({
          ...character,
          spellbook: updateSpellEntryCollections(character.spellbook, spellEntryId, updater),
        })
      ),
    })),

  removeCharacterSpell: (characterId, spellEntryId) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) =>
        touchCharacter({
          ...character,
          spellbook: removeSpellEntryCollections(character.spellbook, spellEntryId),
        })
      ),
    })),

  updateSpellSlot: (characterId, level, updater) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) =>
        touchCharacter({
          ...character,
          spellbook: {
            ...character.spellbook,
            slots: character.spellbook.slots.map((slot) =>
              slot.level === level ? updater(slot) : slot
            ),
          },
        })
      ),
    })),

  updatePactMagic: (characterId, updater) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) =>
        touchCharacter({
          ...character,
          spellbook: {
            ...character.spellbook,
            pactMagic: updater(character.spellbook.pactMagic),
          },
        })
      ),
    })),

  addCompanionSpell: (companionId, entry = createSpellEntry()) =>
    set((state) => ({
      companions: updateById(state.companions, companionId, (companion) =>
        touchCompanion({
          ...companion,
          spellbook: {
            ...companion.spellbook,
            spells: [entry, ...companion.spellbook.spells],
          },
        })
      ),
    })),

  updateCompanionSpell: (companionId, spellEntryId, updater) =>
    set((state) => ({
      companions: updateById(state.companions, companionId, (companion) =>
        touchCompanion({
          ...companion,
          spellbook: {
            ...companion.spellbook,
            spells: updateById(companion.spellbook.spells, spellEntryId, updater),
          },
        })
      ),
    })),

  removeCompanionSpell: (companionId, spellEntryId) =>
    set((state) => ({
      companions: updateById(state.companions, companionId, (companion) =>
        touchCompanion({
          ...companion,
          spellbook: {
            ...companion.spellbook,
            spells: companion.spellbook.spells.filter((entry) => entry.id !== spellEntryId),
          },
        })
      ),
    })),
});
