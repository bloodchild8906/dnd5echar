import { StateCreator } from 'zustand';
import { createSpellEntry } from '../../domain/seeds';
import { touchCharacter, touchCompanion, updateById } from '../helpers';
import { AppStore, SpellsSlice } from '../types';

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
        }),
      ),
    })),

  updateCharacterSpell: (characterId, spellEntryId, updater) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) =>
        touchCharacter({
          ...character,
          spellbook: {
            ...character.spellbook,
            spells: updateById(character.spellbook.spells, spellEntryId, updater),
          },
        }),
      ),
    })),

  removeCharacterSpell: (characterId, spellEntryId) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) =>
        touchCharacter({
          ...character,
          spellbook: {
            ...character.spellbook,
            spells: character.spellbook.spells.filter((entry) => entry.id !== spellEntryId),
          },
        }),
      ),
    })),

  updateSpellSlot: (characterId, level, updater) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) =>
        touchCharacter({
          ...character,
          spellbook: {
            ...character.spellbook,
            slots: character.spellbook.slots.map((slot) => (slot.level === level ? updater(slot) : slot)),
          },
        }),
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
        }),
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
        }),
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
        }),
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
        }),
      ),
    })),
});
