import { useEffect, useMemo, useState } from 'react';
import { ReferenceCreature, ReferenceOption, ReferenceResource, Spell } from '../domain/models';
import { open5eClient, Open5eParams } from '../services/open5e/open5eClient';
import { useAppStore } from '../store/useAppStore';
import { isoNow, stableStringify } from '../utils/numbers';

type ResourceItem<R extends ReferenceResource> = R extends 'spells'
  ? Spell
  : R extends 'monsters'
    ? ReferenceCreature
    : ReferenceOption;

export const useOpen5eResource = <R extends ReferenceResource>(
  resource: R,
  params: Open5eParams,
  enabled = true
) => {
  const cache = useAppStore((state) => state.referenceCache.entries);
  const ttlHours = useAppStore((state) => state.settings.referenceCacheHours);
  const setReferenceCacheEntry = useAppStore((state) => state.setReferenceCacheEntry);
  const [items, setItems] = useState<ResourceItem<R>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const paramsKey = useMemo(() => stableStringify(params), [params]);
  const cacheKey = useMemo(() => `${resource}:${paramsKey}`, [paramsKey, resource]);
  const cacheEntry = useMemo(
    () => cache.find((entry) => entry.cacheKey === cacheKey),
    [cache, cacheKey]
  );

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }

    const hoursOld = cacheEntry
      ? (Date.now() - new Date(cacheEntry.fetchedAt).getTime()) / 3600000
      : Number.POSITIVE_INFINITY;

    if (cacheEntry && Number.isFinite(hoursOld) && hoursOld <= ttlHours && retryCount === 0) {
      setItems(cacheEntry.items as ResourceItem<R>[]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    open5eClient
      .fetchList<ResourceItem<R>>(resource, params)
      .then((result) => {
        if (cancelled) {
          return;
        }

        if (result.error) {
          // fetchList returned a graceful error (e.g. offline, HTTP failure)
          if (cacheEntry) {
            setItems(cacheEntry.items as ResourceItem<R>[]);
            setError(`Using cached data: ${result.error}`);
          } else {
            setError(result.error);
          }
          return;
        }

        setItems(result.results);
        setError(null);
        setReferenceCacheEntry({
          cacheKey,
          resource,
          params,
          fetchedAt: isoNow(),
          source: 'open5e',
          items: result.results,
        });
      })
      .catch((reason: unknown) => {
        if (cancelled) {
          return;
        }

        if (cacheEntry) {
          setItems(cacheEntry.items as ResourceItem<R>[]);
          setError(
            `Using cached data: ${reason instanceof Error ? reason.message : 'reference request failed'}`
          );
          return;
        }

        setError(reason instanceof Error ? reason.message : 'reference request failed');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cacheEntry, cacheKey, enabled, paramsKey, resource, retryCount, setReferenceCacheEntry, ttlHours]);

  return {
    items,
    loading,
    error,
    fromCache: Boolean(cacheEntry),
    isOffline: error?.toLowerCase().includes('offline') ?? false,
    retry: () => setRetryCount((k) => k + 1),
  };
};
