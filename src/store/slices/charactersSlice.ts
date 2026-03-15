import { StateCreator } from 'zustand';
import { createBlankCharacter } from '../../domain/seeds';
import { deepClone } from '../../utils/object';
import { isoNow } from '../../utils/numbers';
import { removeById, touchCharacter, updateById } from '../helpers';
import { AppStore, CharactersSlice } from '../types';

export const createCharactersSlice: StateCreator<AppStore, [], [], CharactersSlice> = (
  set,
  get
) => ({
  createCharacter: (initial) => {
    const character = touchCharacter({
      ...createBlankCharacter(),
      ...initial,
      updatedAt: isoNow(),
    });

    set((state) => ({
      characters: [character, ...state.characters],
      selectedCharacterId: character.id,
      settings: {
        ...state.settings,
        lastSelectedCharacterId: character.id,
      },
    }));

    return character.id;
  },

  updateCharacter: (id, updater) =>
    set((state) => ({
      characters: updateById(state.characters, id, (character) =>
        touchCharacter(updater(character))
      ),
    })),

  deleteCharacter: (id) =>
    set((state) => ({
      characters: removeById(state.characters, id),
      companions: state.companions.filter((companion) => companion.parentCharacterId !== id),
      selectedCharacterId:
        state.selectedCharacterId === id
          ? (state.characters.find((character) => character.id !== id)?.id ?? null)
          : state.selectedCharacterId,
    })),

  duplicateCharacter: (id) => {
    const source = get().characters.find((character) => character.id === id);
    if (!source) {
      return null;
    }

    const copy = touchCharacter({
      ...deepClone(source),
      id: createBlankCharacter().id,
      name: `${source.name} Copy`,
      createdAt: isoNow(),
    });

    set((state) => ({
      characters: [copy, ...state.characters],
      selectedCharacterId: copy.id,
      settings: {
        ...state.settings,
        lastSelectedCharacterId: copy.id,
      },
    }));

    return copy.id;
  },

  selectCharacter: (id) =>
    set((state) => ({
      selectedCharacterId: id,
      settings: {
        ...state.settings,
        lastSelectedCharacterId: id,
      },
    })),
});
