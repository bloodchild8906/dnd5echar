import { StateCreator } from 'zustand';
import { createSeedPersistedAppData } from '../../domain/seeds';
import { AppStore, CoreSlice } from '../types';

export const createCoreSlice: StateCreator<AppStore, [], [], CoreSlice> = (set) => ({
  replaceAllData: (data) => set(() => ({ ...data })),
  restoreSeedData: () => set(() => ({ ...createSeedPersistedAppData() })),
});
