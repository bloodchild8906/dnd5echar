// Mock for virtual:pwa-register/react — no-op in test environment
import { useState } from 'react';

export type RegisterSWOptions = {
  immediate?: boolean;
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
  onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
  onRegisteredSW?: (swUrl: string, registration: ServiceWorkerRegistration | undefined) => void;
  onRegisterError?: (error: unknown) => void;
};

export function useRegisterSW(_options?: RegisterSWOptions) {
  const needRefresh = useState(false);
  const offlineReady = useState(false);
  const updateServiceWorker = async (_reloadPage?: boolean) => {
    // no-op in tests
  };
  return { needRefresh, offlineReady, updateServiceWorker };
}
