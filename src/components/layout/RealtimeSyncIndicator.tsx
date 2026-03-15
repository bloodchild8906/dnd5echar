import { useEffect, useRef, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '../../services/supabase/supabaseClient';

type SyncStatus = 'connected' | 'reconnecting' | 'offline';

const RECONNECT_DELAY_MS = 5000;

const useRealtimeStatus = (): SyncStatus => {
  const [status, setStatus] = useState<SyncStatus>(() =>
    isSupabaseConfigured() ? 'reconnecting' : 'offline'
  );
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!isSupabaseConfigured()) {
      setStatus('offline');
      return;
    }

    let channel = getSupabaseClient().channel('realtime-health-check');

    const subscribe = () => {
      channel = getSupabaseClient().channel('realtime-health-check');
      channel.subscribe((s) => {
        if (!mountedRef.current) return;
        if (s === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') {
          setStatus('reconnecting');
          // Auto-resubscribe after delay
          retryTimerRef.current = setTimeout(() => {
            if (mountedRef.current) subscribe();
          }, RECONNECT_DELAY_MS);
        }
      });
    };

    subscribe();

    return () => {
      mountedRef.current = false;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      try {
        void getSupabaseClient().removeChannel(channel);
      } catch {
        // client may not be available during teardown
      }
    };
  }, []);

  return status;
};

export const RealtimeSyncIndicator = () => {
  const status = useRealtimeStatus();

  if (status === 'offline') return null;

  const label = status === 'connected' ? 'Realtime connected' : 'Realtime reconnecting';
  const pillClass =
    status === 'connected' ? 'status-pill status-pill--accent' : 'status-pill status-pill--warn';

  return (
    <span className={pillClass} aria-live="polite" aria-label={label}>
      {label}
    </span>
  );
};
