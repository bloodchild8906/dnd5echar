import { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { PersistedAppData } from '../domain/models';
import { supabaseSyncService, stripSyncMetadata } from '../services/supabase/supabaseSyncService';
import { useAppStore, selectPersistedAppData } from '../store/useAppStore';
import { stableStringify } from '../utils/numbers';

const applyPrimaryPersistenceMetadata = (
  data: PersistedAppData,
  userId: string | null,
  timestamps?: {
    lastPulledAt?: string | null;
    lastSyncedAt?: string | null;
  }
): PersistedAppData => ({
  ...data,
  settings: {
    ...data.settings,
    supabase: {
      ...data.settings.supabase,
      autoSync: true,
      userId,
      lastPulledAt: timestamps?.lastPulledAt ?? data.settings.supabase.lastPulledAt ?? null,
      lastSyncedAt: timestamps?.lastSyncedAt ?? data.settings.supabase.lastSyncedAt ?? null,
    },
  },
});

export const useSupabaseAutoSync = () => {
  const persisted = useAppStore(useShallow(selectPersistedAppData));
  const replaceAllData = useAppStore((state) => state.replaceAllData);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const autoSync = useAppStore((state) => state.settings.supabase.autoSync);
  const configured = supabaseSyncService.isConfigured();
  const [bootstrapped, setBootstrapped] = useState(!configured);
  const bootstrapStartedRef = useRef(false);
  const lastSnapshotRef = useRef<string>('');
  const snapshot = useMemo(() => stableStringify(stripSyncMetadata(persisted)), [persisted]);

  useEffect(() => {
    if (!configured) {
      setBootstrapped(true);
      return;
    }

    if (bootstrapStartedRef.current) {
      return;
    }

    bootstrapStartedRef.current = true;
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const session = await supabaseSyncService.ensureSession();
        if (cancelled) {
          return;
        }

        const remote = await supabaseSyncService.pullState();
        if (cancelled) {
          return;
        }

        if (remote?.payload) {
          const hydrated = applyPrimaryPersistenceMetadata(remote.payload, session.user.id, {
            lastPulledAt: remote.updatedAt,
            lastSyncedAt: remote.updatedAt,
          });
          lastSnapshotRef.current = stableStringify(stripSyncMetadata(hydrated));
          replaceAllData(hydrated);
          return;
        }

        const primaryPayload = applyPrimaryPersistenceMetadata(persisted, session.user.id);
        const result = await supabaseSyncService.pushState(primaryPayload);
        if (cancelled) {
          return;
        }

        lastSnapshotRef.current = stableStringify(stripSyncMetadata(primaryPayload));
        updateSettings((settings) => ({
          ...settings,
          supabase: {
            ...settings.supabase,
            autoSync: true,
            userId: result.userId,
            lastPulledAt: result.updatedAt,
            lastSyncedAt: result.updatedAt,
          },
        }));
      } catch {
        if (!cancelled) {
          updateSettings((settings) => ({
            ...settings,
            supabase: {
              ...settings.supabase,
              autoSync: true,
            },
          }));
        }
      } finally {
        if (!cancelled) {
          setBootstrapped(true);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [configured, persisted, replaceAllData, updateSettings]);

  useEffect(() => {
    if (!configured || !bootstrapped || !autoSync) {
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
              autoSync: true,
              userId: result.userId,
              lastSyncedAt: result.updatedAt,
            },
          }));
        }
      } catch {
        // Supabase is the preferred store when configured. localStorage remains the fallback cache.
      }
    }, 1200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [autoSync, bootstrapped, configured, persisted, snapshot, updateSettings]);

  return bootstrapped;
};
