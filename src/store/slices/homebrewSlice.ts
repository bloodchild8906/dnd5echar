import { StateCreator } from 'zustand';
import { createBlankHomebrewEntry } from '../../domain/seeds';
import { isoNow } from '../../utils/numbers';
import { removeById, touchHomebrew, updateById } from '../helpers';
import { AppStore, HomebrewSlice } from '../types';

export const createHomebrewSlice: StateCreator<AppStore, [], [], HomebrewSlice> = (set) => ({
  createHomebrew: (initial) => {
    const entry = touchHomebrew({
      ...createBlankHomebrewEntry(),
      ...initial,
      updatedAt: isoNow(),
    });

    set((state) => ({
      homebrew: [entry, ...state.homebrew],
    }));

    return entry.id;
  },

  updateHomebrew: (id, updater) =>
    set((state) => ({
      homebrew: updateById(state.homebrew, id, (entry) => touchHomebrew(updater(entry))),
    })),

  deleteHomebrew: (id) =>
    set((state) => ({
      homebrew: removeById(state.homebrew, id),
    })),

  cloneSourceToHomebrew: (seed) => {
    const entry = touchHomebrew({
      ...createBlankHomebrewEntry(),
      ...seed,
      sourceRef: {
        ...seed.sourceRef,
        sourceType:
          seed.sourceRef.sourceType === 'open5e' ? 'cloned-from-open5e' : seed.sourceRef.sourceType,
      },
      createdAt: isoNow(),
      updatedAt: isoNow(),
    });

    set((state) => ({
      homebrew: [entry, ...state.homebrew],
    }));

    return entry.id;
  },
});
