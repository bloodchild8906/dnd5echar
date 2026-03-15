import { StateCreator } from 'zustand';
import { createBlankCompanion } from '../../domain/seeds';
import { isoNow } from '../../utils/numbers';
import { removeById, touchCompanion, updateById } from '../helpers';
import { AppStore, CompanionsSlice } from '../types';

export const createCompanionsSlice: StateCreator<AppStore, [], [], CompanionsSlice> = (set) => ({
  createCompanion: (parentCharacterId, initial) => {
    const companion = touchCompanion({
      ...createBlankCompanion(parentCharacterId),
      ...initial,
      updatedAt: isoNow(),
    });

    set((state) => ({
      companions: [companion, ...state.companions],
    }));

    return companion.id;
  },

  updateCompanion: (id, updater) =>
    set((state) => ({
      companions: updateById(state.companions, id, (companion) =>
        touchCompanion(updater(companion))
      ),
    })),

  deleteCompanion: (id) =>
    set((state) => ({
      companions: removeById(state.companions, id),
    })),
});
