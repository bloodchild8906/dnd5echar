const DB_NAME = 'codex-arcanum';
const STORE_NAME = 'app-data';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;
const memCache: Record<string, unknown> = {};

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

export const indexedDbService = {
  async get(key: string): Promise<unknown> {
    try {
      const database = await openDb();
      return await new Promise((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => {
          const value: unknown = request.result ?? memCache[key] ?? null;
          resolve(value);
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      return memCache[key] ?? null;
    }
  },

  async set(key: string, value: unknown): Promise<void> {
    // Update memCache first so reads are never stale
    memCache[key] = value;
    try {
      const database = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
      // memCache already updated; IDB write failed but in-memory state is consistent
    }
  },

  async delete(key: string): Promise<void> {
    delete memCache[key];
    try {
      const database = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
      // memCache already cleared; IDB delete failed silently
    }
  },

  /** Seed the in-memory cache from an external source (used during init). */
  seedMemCache(key: string, value: unknown): void {
    memCache[key] = value;
  },

  /** Returns the current in-memory value without hitting IDB. */
  getFromMemCache(key: string): unknown {
    return memCache[key] ?? null;
  },
};
