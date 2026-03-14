import { StateCreator } from 'zustand';
import { AppStore, SettingsSlice } from '../types';

export const createSettingsSlice: StateCreator<AppStore, [], [], SettingsSlice> = (set) => ({
  updateSettings: (updater) =>
    set((state) => ({
      settings: updater(state.settings),
    })),
});
