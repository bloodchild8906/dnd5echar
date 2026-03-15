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
      return migrateV2ToV3(migrateV1ToV2(candidate));
    case 2:
      return migrateV2ToV3(candidate);
    default:
      return createSeedPersistedAppData();
  }
};
