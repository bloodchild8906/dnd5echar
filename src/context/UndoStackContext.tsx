import { PropsWithChildren, createContext, useContext, useEffect, useRef } from 'react';
import { PersistedAppData } from '../domain/models';
import { useAppStore, selectPersistedAppData } from '../store/useAppStore';

const MAX_SNAPSHOTS = 50;

// Module-level ref so store actions can call pushUndoSnapshot without React context
const undoPushRef: { current: ((s: PersistedAppData) => void) | null } = { current: null };

/** Call this from anywhere (including store slices) to push a snapshot before a mutation. */
export function pushUndoSnapshot(snapshot: PersistedAppData): void {
  undoPushRef.current?.(snapshot);
}

interface UndoStackContextValue {
  pushUndo: (snapshot: PersistedAppData) => void;
}

const UndoStackContext = createContext<UndoStackContextValue | null>(null);

export const UndoStackProvider = ({ children }: PropsWithChildren) => {
  const snapshots = useRef<PersistedAppData[]>([]);

  const pushUndo = (snapshot: PersistedAppData): void => {
    if (snapshots.current.length >= MAX_SNAPSHOTS) {
      snapshots.current.shift(); // drop oldest
    }
    snapshots.current.push(snapshot);
  };

  // Register the module-level ref so store actions can call pushUndoSnapshot
  useEffect(() => {
    undoPushRef.current = pushUndo;
    return () => {
      undoPushRef.current = null;
    };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        const snapshot = snapshots.current.pop();
        if (snapshot) {
          useAppStore.getState().replaceAllData(snapshot);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <UndoStackContext.Provider value={{ pushUndo }}>
      {children}
    </UndoStackContext.Provider>
  );
};

export const useUndoStack = (): UndoStackContextValue => {
  const context = useContext(UndoStackContext);
  if (!context) {
    throw new Error('useUndoStack must be used within UndoStackProvider.');
  }
  return context;
};
