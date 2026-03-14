import { PersistedAppData } from '../../domain/models';
import { persistedAppDataSchema } from '../../domain/schemas';
import { createSeedPersistedAppData } from '../../domain/seeds';
import { deepMerge } from '../../utils/object';
import { STORAGE_VERSION } from './keys';

const migrateV1ToV2 = (raw: Record<string, unknown>): PersistedAppData => {
  const base = createSeedPersistedAppData();
  const merged = deepMerge(base, {
    ...raw,
    version: STORAGE_VERSION,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : base.exportedAt,
    source: typeof raw.source === 'string' ? raw.source : base.source,
  });

  return persistedAppDataSchema.parse(merged);
};

export const migratePersistedAppData = (raw: unknown): PersistedAppData => {
  if (!raw || typeof raw !== 'object') {
    return createSeedPersistedAppData();
  }

  const candidate = raw as Record<string, unknown>;
  const version = typeof candidate.version === 'number' ? candidate.version : 1;

  if (version >= STORAGE_VERSION) {
    const parsed = persistedAppDataSchema.safeParse(candidate);
    return parsed.success ? parsed.data : createSeedPersistedAppData();
  }

  switch (version) {
    case 1:
    default:
      return migrateV1ToV2(candidate);
  }
};
