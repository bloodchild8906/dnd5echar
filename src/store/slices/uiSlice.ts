import { StateCreator } from 'zustand';
import { AppStore, UiSlice } from '../types';

export const createUiSlice: StateCreator<AppStore, [], [], UiSlice> = (set) => ({
  updateUiPreferences: (updater) =>
    set((state) => ({
      uiPreferences: updater(state.uiPreferences),
    })),
});
