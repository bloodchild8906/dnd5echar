import { useEffect, useMemo, useRef } from 'react';
import { supabaseSyncService, stripSyncMetadata } from '../services/supabase/supabaseSyncService';
import { useAppStore, selectPersistedAppData } from '../store/useAppStore';
import { stableStringify } from '../utils/numbers';

export const useSupabaseAutoSync = () => {
  const persisted = useAppStore(selectPersistedAppData);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const autoSync = useAppStore((state) => state.settings.supabase.autoSync);
  const snapshot = useMemo(() => stableStringify(stripSyncMetadata(persisted)), [persisted]);
  const lastSnapshotRef = useRef<string>('');

  useEffect(() => {
    if (!supabaseSyncService.isConfigured() || !autoSync) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (lastSnapshotRef.current === snapshot) {
        return;
      }

      try {
        const result = await supabaseSyncService.pushState(persisted);
        if (!cancelled) {
          lastSnapshotRef.current = snapshot;
          updateSettings((settings) => ({
            ...settings,
            supabase: {
              ...settings.supabase,
              userId: result.userId,
              lastSyncedAt: result.updatedAt,
            },
          }));
        }
      } catch {
        // Silent fallback: localStorage remains the primary persistence layer.
      }
    }, 1200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [autoSync, persisted, snapshot, updateSettings]);
};
