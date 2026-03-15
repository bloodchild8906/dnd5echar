import { PersistedAppData } from '../../domain/models';
import { persistedAppDataSchema } from '../../domain/schemas';
import { createSeedPersistedAppData } from '../../domain/seeds';
import { deepMerge } from '../../utils/object';
import { STORAGE_VERSION } from './keys';

const asRecord = (raw: unknown): Record<string, unknown> =>
  raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

const migrateV1ToV2 = (raw: unknown): PersistedAppData => {
  const candidate = asRecord(raw);
  const base = createSeedPersistedAppData();
  const merged = deepMerge(base, {
    ...candidate,
    version: 2,
    exportedAt: typeof candidate.exportedAt === 'string' ? candidate.exportedAt : base.exportedAt,
    source: typeof candidate.source === 'string' ? candidate.source : base.source,
  });

  return persistedAppDataSchema.parse(merged) as PersistedAppData;
};

const migrateV2ToV3 = (raw: unknown): PersistedAppData => {
  const candidate = asRecord(raw);
  const base = createSeedPersistedAppData();
  const merged = deepMerge(base, {
    ...candidate,
    version: 3,
    exportedAt: typeof candidate.exportedAt === 'string' ? candidate.exportedAt : base.exportedAt,
    source: typeof candidate.source === 'string' ? candidate.source : base.source,
  });

  return persistedAppDataSchema.parse(merged) as PersistedAppData;
};

const migrateV3ToV4 = (raw: unknown): PersistedAppData => {
  const candidate = asRecord(raw);
  const base = createSeedPersistedAppData();

  const characters = Array.isArray(candidate.characters)
    ? candidate.characters.map((char: unknown) => {
        const c = asRecord(char);
        return {
          ...c,
          conditions: Array.isArray(c.conditions) ? c.conditions : [],
          featureNotes: typeof c.featureNotes === 'string' ? c.featureNotes : '',
          appearance: typeof c.appearance === 'string' ? c.appearance : '',
        };
      })
    : base.characters;

  const merged = deepMerge(base, {
    ...candidate,
    version: STORAGE_VERSION,
    exportedAt: typeof candidate.exportedAt === 'string' ? candidate.exportedAt : base.exportedAt,
    source: typeof candidate.source === 'string' ? candidate.source : base.source,
    characters,
  });

  return persistedAppDataSchema.parse(merged) as PersistedAppData;
};

const migrateV4ToV5 = (raw: unknown): PersistedAppData => {
  const candidate = asRecord(raw);
  const base = createSeedPersistedAppData();

  // Back-fill new optional inventory fields on characters and companions
  const migrateInventoryItems = (items: unknown[]): unknown[] =>
    items.map((item: unknown) => {
      const i = asRecord(item);
      return {
        ...i,
        // Optional Phase 3 GM visibility fields — undefined means "not set"
        cursed: i.cursed,
        identified: i.identified,
        locked: i.locked,
        gmVisibleOnly: i.gmVisibleOnly,
        revealedAt: i.revealedAt ?? null,
      };
    });

  const migrateInventoryContainers = (containers: unknown[]): unknown[] =>
    containers.map((container: unknown) => {
      const c = asRecord(container);
      return { ...c, weightCapacity: c.weightCapacity };
    });

  const migrateInventory = (inventory: unknown): unknown => {
    const inv = asRecord(inventory);
    return {
      ...inv,
      items: Array.isArray(inv.items) ? migrateInventoryItems(inv.items) : [],
      containers: Array.isArray(inv.containers)
        ? migrateInventoryContainers(inv.containers)
        : [],
    };
  };

  const characters = Array.isArray(candidate.characters)
    ? candidate.characters.map((char: unknown) => {
        const c = asRecord(char);
        return { ...c, inventory: migrateInventory(c.inventory) };
      })
    : base.characters;

  const companions = Array.isArray(candidate.companions)
    ? candidate.companions.map((comp: unknown) => {
        const c = asRecord(comp);
        return { ...c, inventory: migrateInventory(c.inventory) };
      })
    : base.companions;

  const merged = deepMerge(base, {
    ...candidate,
    version: STORAGE_VERSION,
    exportedAt: typeof candidate.exportedAt === 'string' ? candidate.exportedAt : base.exportedAt,
    source: typeof candidate.source === 'string' ? candidate.source : base.source,
    characters,
    companions,
  });

  return persistedAppDataSchema.parse(merged) as PersistedAppData;
};

const migrateV5ToV6 = (raw: unknown): PersistedAppData => {
  const candidate = asRecord(raw);
  const base = createSeedPersistedAppData();

  const characters = Array.isArray(candidate.characters)
    ? candidate.characters.map((char: unknown) => {
        const c = asRecord(char);
        return {
          ...c,
          activePolymorph: c.activePolymorph ?? null,
        };
      })
    : base.characters;

  const companions = Array.isArray(candidate.companions)
    ? candidate.companions.map((comp: unknown) => {
        const c = asRecord(comp);
        return {
          ...c,
          timers: Array.isArray(c.timers) ? c.timers : [],
        };
      })
    : base.companions;

  const merged = deepMerge(base, {
    ...candidate,
    version: STORAGE_VERSION,
    exportedAt: typeof candidate.exportedAt === 'string' ? candidate.exportedAt : base.exportedAt,
    source: typeof candidate.source === 'string' ? candidate.source : base.source,
    characters,
    companions,
  });

  return persistedAppDataSchema.parse(merged) as PersistedAppData;
};

const migrateV6ToV7 = (raw: unknown): PersistedAppData => {
  const candidate = asRecord(raw);
  const base = createSeedPersistedAppData();

  const merged = deepMerge(base, {
    ...candidate,
    version: STORAGE_VERSION,
    exportedAt: typeof candidate.exportedAt === 'string' ? candidate.exportedAt : base.exportedAt,
    source: typeof candidate.source === 'string' ? candidate.source : base.source,
    settlements: Array.isArray(candidate.settlements) ? candidate.settlements : [],
  });

  return persistedAppDataSchema.parse(merged) as PersistedAppData;
};

/**
 * v7 → v8: No-op for data shape. The localStorage → IndexedDB copy is handled
 * in storageService.loadAppData() on first load after this version bump.
 */
const migrateV7ToV8 = (raw: unknown): PersistedAppData => {
  const candidate = asRecord(raw);
  const base = createSeedPersistedAppData();

  const merged = deepMerge(base, {
    ...candidate,
    version: STORAGE_VERSION,
    exportedAt: typeof candidate.exportedAt === 'string' ? candidate.exportedAt : base.exportedAt,
    source: typeof candidate.source === 'string' ? candidate.source : base.source,
  });

  return persistedAppDataSchema.parse(merged) as PersistedAppData;
};

export const migratePersistedAppData = (raw: unknown): PersistedAppData => {
  if (!raw || typeof raw !== 'object') {
    return createSeedPersistedAppData();
  }

  const candidate = raw as Record<string, unknown>;
  const version = typeof candidate.version === 'number' ? candidate.version : 1;

  if (version >= STORAGE_VERSION) {
    const parsed = persistedAppDataSchema.safeParse(candidate);
    return parsed.success ? (parsed.data as PersistedAppData) : createSeedPersistedAppData();
  }

  switch (version) {
    case 1:
      return migrateV7ToV8(migrateV6ToV7(migrateV5ToV6(migrateV4ToV5(migrateV3ToV4(migrateV2ToV3(migrateV1ToV2(candidate)))))));
    case 2:
      return migrateV7ToV8(migrateV6ToV7(migrateV5ToV6(migrateV4ToV5(migrateV3ToV4(migrateV2ToV3(candidate))))));
    case 3:
      return migrateV7ToV8(migrateV6ToV7(migrateV5ToV6(migrateV4ToV5(migrateV3ToV4(candidate)))));
    case 4:
      return migrateV7ToV8(migrateV6ToV7(migrateV5ToV6(migrateV4ToV5(candidate))));
    case 5:
      return migrateV7ToV8(migrateV6ToV7(migrateV5ToV6(candidate)));
    case 6:
      return migrateV7ToV8(migrateV6ToV7(candidate));
    case 7:
      return migrateV7ToV8(candidate);
    default:
      return createSeedPersistedAppData();
  }
};
