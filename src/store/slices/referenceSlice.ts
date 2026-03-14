import { StateCreator } from 'zustand';
import { AppStore, ReferenceSlice } from '../types';

export const createReferenceSlice: StateCreator<AppStore, [], [], ReferenceSlice> = (set) => ({
  setReferenceCacheEntry: (entry) =>
    set((state) => ({
      referenceCache: {
        entries: [...state.referenceCache.entries.filter((current) => current.cacheKey !== entry.cacheKey), entry],
      },
    })),

  clearReferenceCache: () =>
    set(() => ({
      referenceCache: { entries: [] },
    })),
});
