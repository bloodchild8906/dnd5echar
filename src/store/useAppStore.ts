import { create } from 'zustand';
import { PersistedAppData } from '../domain/models';
import { storageService } from '../services/storage/storageService';
import { createCharactersSlice } from './slices/charactersSlice';
import { createCompanionsSlice } from './slices/companionsSlice';
import { createCoreSlice } from './slices/coreSlice';
import { createHomebrewSlice } from './slices/homebrewSlice';
import { createInventorySlice } from './slices/inventorySlice';
import { createNotesSlice } from './slices/notesSlice';
import { createReferenceSlice } from './slices/referenceSlice';
import { createSettingsSlice } from './slices/settingsSlice';
import { createSpellsSlice } from './slices/spellsSlice';
import { createUiSlice } from './slices/uiSlice';
import { createWildShapesSlice } from './slices/wildShapesSlice';
import { AppStore } from './types';

const initialData = storageService.loadAppData();

export const selectPersistedAppData = (state: AppStore): PersistedAppData => ({
  version: state.version,
  exportedAt: state.exportedAt,
  source: state.source,
  selectedCharacterId: state.selectedCharacterId,
  characters: state.characters,
  companions: state.companions,
  notes: state.notes,
  homebrew: state.homebrew,
  settings: state.settings,
  uiPreferences: state.uiPreferences,
  referenceCache: state.referenceCache,
});

export const useAppStore = create<AppStore>()((set, get, api) => ({
  ...initialData,
  ...createCoreSlice(set, get, api),
  ...createCharactersSlice(set, get, api),
  ...createSpellsSlice(set, get, api),
  ...createInventorySlice(set, get, api),
  ...createCompanionsSlice(set, get, api),
  ...createWildShapesSlice(set, get, api),
  ...createNotesSlice(set, get, api),
  ...createHomebrewSlice(set, get, api),
  ...createSettingsSlice(set, get, api),
  ...createUiSlice(set, get, api),
  ...createReferenceSlice(set, get, api),
}));

let initialized = false;

if (typeof window !== 'undefined' && !initialized) {
  initialized = true;
  useAppStore.subscribe((state) => {
    storageService.saveAppData(selectPersistedAppData(state));
  });
}
