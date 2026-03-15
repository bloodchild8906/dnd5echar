import { useEffect, useRef } from 'react';
import { Character } from '../domain/models';
import { collaborationService } from '../services/supabase/collaborationService';
import { isSupabaseConfigured } from '../services/supabase/supabaseClient';

interface HpSnapshot {
  [characterId: string]: number;
}

/**
 * Automatically posts session log entries when character HP changes during an active game session.
 * Hook into this from a page/component that has an active gameId and userId.
 */
export const useSessionLogAutoTrigger = (
  gameId: string | null,
  authorUserId: string | null,
  characters: Character[]
) => {
  const prevHpRef = useRef<HpSnapshot>({});

  useEffect(() => {
    if (!gameId || !authorUserId || !isSupabaseConfigured()) return;

    const currentSnapshot: HpSnapshot = {};
    const prev = prevHpRef.current;

    for (const character of characters) {
      const currentHp = character.combat.hitPoints.current;
      currentSnapshot[character.id] = currentHp;

      const prevHp = prev[character.id];
      // Only fire if we have a previous value and it changed
      if (prevHp !== undefined && prevHp !== currentHp) {
        const delta = currentHp - prevHp;
        const sign = delta > 0 ? '+' : '';
        const body = `${character.name} HP changed: ${prevHp} → ${currentHp} (${sign}${delta})`;

        void collaborationService
          .addSessionLogEntry(gameId, authorUserId, 'system', body, false)
          .catch(() => {
            // Non-fatal — log entry failure should not disrupt gameplay
          });
      }
    }

    prevHpRef.current = currentSnapshot;
  }, [gameId, authorUserId, characters]);
};
