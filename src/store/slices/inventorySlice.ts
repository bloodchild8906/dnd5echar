import { StateCreator } from 'zustand';
import { createId } from '../../utils/id';
import { isoNow } from '../../utils/numbers';
import { touchCharacter, touchCompanion, updateById } from '../helpers';
import { AppStore, InventorySlice } from '../types';

const createBlankItem = () => ({
  id: createId('item'),
  name: 'New Item',
  description: '',
  quantity: 1,
  weight: 0,
  value: {
    amount: 0,
    denomination: 'gp' as const,
  },
  rarity: 'Common',
  attunementRequired: false,
  attuned: false,
  equipped: false,
  consumable: false,
  tags: [],
  notes: '',
  containerId: null,
  sourceRef: {
    sourceType: 'user-created' as const,
    sourceName: 'Local',
  },
});

const createBlankContainer = () => ({
  id: createId('container'),
  name: 'New Container',
  notes: '',
  type: 'custom' as const,
  order: 99,
  parentId: null,
});

export const createInventorySlice: StateCreator<AppStore, [], [], InventorySlice> = (set) => ({
  addCharacterItem: (characterId, item = createBlankItem()) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) =>
        touchCharacter({
          ...character,
          inventory: {
            ...character.inventory,
            items: [item, ...character.inventory.items],
          },
        })
      ),
    })),

  updateCharacterItem: (characterId, itemId, updater) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) =>
        touchCharacter({
          ...character,
          inventory: {
            ...character.inventory,
            items: updateById(character.inventory.items, itemId, updater),
          },
        })
      ),
    })),

  removeCharacterItem: (characterId, itemId) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) =>
        touchCharacter({
          ...character,
          inventory: {
            ...character.inventory,
            items: character.inventory.items.filter((item) => item.id !== itemId),
          },
        })
      ),
    })),

  moveCharacterItem: (characterId, itemId, containerId) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) =>
        touchCharacter({
          ...character,
          inventory: {
            ...character.inventory,
            items: updateById(character.inventory.items, itemId, (item) => ({
              ...item,
              containerId,
            })),
          },
        })
      ),
    })),

  addCharacterContainer: (characterId, container = createBlankContainer()) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) =>
        touchCharacter({
          ...character,
          inventory: {
            ...character.inventory,
            containers: [...character.inventory.containers, container],
          },
        })
      ),
    })),

  updateCharacterCurrency: (characterId, updater) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) =>
        touchCharacter({ ...character, currency: updater(character.currency) })
      ),
    })),

  addCompanionItem: (companionId, item = createBlankItem()) =>
    set((state) => ({
      companions: updateById(state.companions, companionId, (companion) =>
        touchCompanion({
          ...companion,
          inventory: {
            ...companion.inventory,
            items: [item, ...companion.inventory.items],
          },
        })
      ),
    })),

  updateCompanionItem: (companionId, itemId, updater) =>
    set((state) => ({
      companions: updateById(state.companions, companionId, (companion) =>
        touchCompanion({
          ...companion,
          inventory: {
            ...companion.inventory,
            items: updateById(companion.inventory.items, itemId, updater),
          },
        })
      ),
    })),

  removeCompanionItem: (companionId, itemId) =>
    set((state) => ({
      companions: updateById(state.companions, companionId, (companion) =>
        touchCompanion({
          ...companion,
          inventory: {
            ...companion.inventory,
            items: companion.inventory.items.filter((item) => item.id !== itemId),
          },
        })
      ),
    })),

  moveCompanionItem: (companionId, itemId, containerId) =>
    set((state) => ({
      companions: updateById(state.companions, companionId, (companion) =>
        touchCompanion({
          ...companion,
          inventory: {
            ...companion.inventory,
            items: updateById(companion.inventory.items, itemId, (item) => ({
              ...item,
              containerId,
            })),
          },
        })
      ),
    })),

  addCompanionContainer: (companionId, container = createBlankContainer()) =>
    set((state) => ({
      companions: updateById(state.companions, companionId, (companion) =>
        touchCompanion({
          ...companion,
          inventory: {
            ...companion.inventory,
            containers: [...companion.inventory.containers, container],
          },
        })
      ),
    })),

  updateCharacterContainer: (characterId, containerId, updater) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) =>
        touchCharacter({
          ...character,
          inventory: {
            ...character.inventory,
            containers: updateById(character.inventory.containers, containerId, updater),
          },
        })
      ),
    })),

  removeCharacterContainer: (characterId, containerId) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) =>
        touchCharacter({
          ...character,
          inventory: {
            ...character.inventory,
            containers: character.inventory.containers.filter((c) => c.id !== containerId),
            // Orphan items that were in the removed container
            items: character.inventory.items.map((item) =>
              item.containerId === containerId ? { ...item, containerId: null } : item
            ),
          },
        })
      ),
    })),

  setItemVisibility: (characterId, itemId, gmVisibleOnly) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) =>
        touchCharacter({
          ...character,
          inventory: {
            ...character.inventory,
            items: updateById(character.inventory.items, itemId, (item) => ({
              ...item,
              gmVisibleOnly,
            })),
          },
        })
      ),
    })),

  revealItem: (characterId, itemId) =>
    set((state) => ({
      characters: updateById(state.characters, characterId, (character) =>
        touchCharacter({
          ...character,
          inventory: {
            ...character.inventory,
            items: updateById(character.inventory.items, itemId, (item) => ({
              ...item,
              gmVisibleOnly: false,
              revealedAt: isoNow(),
            })),
          },
        })
      ),
    })),
});
