import { useAppStore } from '../store/useAppStore';
import { collaborationService } from '../services/supabase/collaborationService';
import { isSupabaseConfigured } from '../services/supabase/supabaseClient';

/**
 * Returns a `revealItem` function that:
 * 1. Updates the item's gmVisibleOnly/revealedAt in the store.
 * 2. Posts a 'system' session log entry when a game session is active.
 */
export const useRevealItem = (gameId: string | null, authorUserId: string | null) => {
  const revealItemAction = useAppStore((state) => state.revealItem);
  const characters = useAppStore((state) => state.characters);

  const revealItem = (characterId: string, itemId: string) => {
    // Find item name before mutating state
    const character = characters.find((c) => c.id === characterId);
    const item = character?.inventory.items.find((i) => i.id === itemId);
    const itemName = item?.name ?? 'Unknown item';

    revealItemAction(characterId, itemId);

    if (gameId && authorUserId && isSupabaseConfigured()) {
      void collaborationService
        .addSessionLogEntry(
          gameId,
          authorUserId,
          'system',
          `GM revealed item: ${itemName}`,
          false
        )
        .catch(() => {
          // Non-fatal — log failure should not disrupt gameplay
        });
    }
  };

  return revealItem;
};
