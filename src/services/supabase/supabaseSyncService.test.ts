import { createSeedPersistedAppData } from '../../domain/seeds';
import { stripSyncMetadata } from './supabaseSyncService';

describe('stripSyncMetadata', () => {
  it('removes volatile Supabase sync metadata from persisted state', () => {
    const seed = createSeedPersistedAppData();
    seed.settings.supabase.autoSync = true;
    seed.settings.supabase.userId = 'user-123';
    seed.settings.supabase.lastPulledAt = '2026-03-15T00:00:00.000Z';
    seed.settings.supabase.lastSyncedAt = '2026-03-15T00:05:00.000Z';

    const stripped = stripSyncMetadata(seed);

    expect(stripped.settings.supabase.autoSync).toBe(true);
    expect(stripped.settings.supabase.userId).toBeNull();
    expect(stripped.settings.supabase.lastPulledAt).toBeNull();
    expect(stripped.settings.supabase.lastSyncedAt).toBeNull();
  });
});
