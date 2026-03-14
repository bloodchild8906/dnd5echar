import { useState } from 'react';
import { SectionCard } from '../../components/common/SectionCard';
import { supabaseSyncService } from '../../services/supabase/supabaseSyncService';
import { storageService } from '../../services/storage/storageService';
import { useAppStore, selectPersistedAppData } from '../../store/useAppStore';
import { parseNumber } from '../../utils/numbers';

export const SettingsPage = () => {
  const settings = useAppStore((state) => state.settings);
  const referenceEntries = useAppStore((state) => state.referenceCache.entries.length);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const clearReferenceCache = useAppStore((state) => state.clearReferenceCache);
  const restoreSeedData = useAppStore((state) => state.restoreSeedData);
  const replaceAllData = useAppStore((state) => state.replaceAllData);
  const currentState = useAppStore((state) => state);
  const [syncMessage, setSyncMessage] = useState<string>('');

  const currentBundle = selectPersistedAppData(currentState);

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>App Preferences</h1>
          <p>Configure cache behavior, Open5e document filters, encumbrance, print defaults, and recovery actions.</p>
        </div>
      </section>

      <SectionCard title="Reference and Play Preferences">
        <div className="form-grid form-grid--three">
          <label>
            Open5e Document Filter
            <input className="input" value={settings.referenceDocumentFilter} onChange={(event) => updateSettings((entry) => ({ ...entry, referenceDocumentFilter: event.target.value }))} />
          </label>
          <label>
            Cache TTL (hours)
            <input className="input" type="number" min={1} value={settings.referenceCacheHours} onChange={(event) => updateSettings((entry) => ({ ...entry, referenceCacheHours: parseNumber(event.target.value, 48) }))} />
          </label>
          <label>
            Encumbrance
            <select className="input" value={settings.encumbranceMode} onChange={(event) => updateSettings((entry) => ({ ...entry, encumbranceMode: event.target.value as typeof entry.encumbranceMode }))}>
              <option value="off">Off</option>
              <option value="standard">Standard</option>
            </select>
          </label>
          <label className="checkbox-field">
            <span>Compact Layout</span>
            <input type="checkbox" checked={settings.compactMode} onChange={(event) => updateSettings((entry) => ({ ...entry, compactMode: event.target.checked }))} />
          </label>
          <label className="checkbox-field">
            <span>Print Notes</span>
            <input type="checkbox" checked={settings.printOptions.showNotes} onChange={(event) => updateSettings((entry) => ({ ...entry, printOptions: { ...entry.printOptions, showNotes: event.target.checked } }))} />
          </label>
          <label className="checkbox-field">
            <span>Print Spellbook</span>
            <input type="checkbox" checked={settings.printOptions.showSpellbook} onChange={(event) => updateSettings((entry) => ({ ...entry, printOptions: { ...entry.printOptions, showSpellbook: event.target.checked } }))} />
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Maintenance">
        <div className="stats-row stats-row--dense">
          <div className="sheet-chip">Cached reference entries: {referenceEntries}</div>
          <div className="sheet-chip">Last selected character: {settings.lastSelectedCharacterId ?? 'none'}</div>
        </div>
        <div className="button-row">
          <button type="button" className="button button--ghost" onClick={() => clearReferenceCache()}>
            Clear Reference Cache
          </button>
          <button type="button" className="button button--ghost" onClick={() => storageService.createBackupSnapshot({
            version: currentBundle.version,
            exportedAt: currentBundle.exportedAt,
            source: currentBundle.source,
            selectedCharacterId: currentBundle.selectedCharacterId,
            characters: currentBundle.characters,
            companions: currentBundle.companions,
            notes: currentBundle.notes,
            homebrew: currentBundle.homebrew,
            settings: currentBundle.settings,
            uiPreferences: currentBundle.uiPreferences,
            referenceCache: currentBundle.referenceCache,
          }, 'Settings backup')}>
            Create Backup Snapshot
          </button>
          <button type="button" className="button button--ghost button--danger" onClick={() => { if (window.confirm('Restore seed data and replace current local state?')) { restoreSeedData(); } }}>
            Restore Seed Data
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Supabase Sync" subtitle="Optional remote persistence layered on top of localStorage. Local data remains the source of truth.">
        {!supabaseSyncService.isConfigured() ? (
          <p className="callout">Supabase is not configured. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to enable remote sync.</p>
        ) : (
          <>
            <div className="stats-row stats-row--dense">
              <div className="sheet-chip">Auto Sync: {settings.supabase.autoSync ? 'Enabled' : 'Disabled'}</div>
              <div className="sheet-chip">User: {settings.supabase.userId ?? 'Not connected'}</div>
              <div className="sheet-chip">Last Sync: {settings.supabase.lastSyncedAt ?? 'Never'}</div>
              <div className="sheet-chip">Last Pull: {settings.supabase.lastPulledAt ?? 'Never'}</div>
            </div>
            {syncMessage ? <p className="callout">{syncMessage}</p> : null}
            <div className="button-row">
              <button
                type="button"
                className="button"
                onClick={async () => {
                  try {
                    const session = await supabaseSyncService.ensureSession();
                    updateSettings((entry) => ({
                      ...entry,
                      supabase: {
                        ...entry.supabase,
                        autoSync: true,
                        userId: session.user.id,
                      },
                    }));
                    setSyncMessage(`Connected to Supabase as ${session.user.id}.`);
                  } catch (error) {
                    setSyncMessage(error instanceof Error ? error.message : 'Unable to connect to Supabase.');
                  }
                }}
              >
                Connect and Enable Sync
              </button>
              <button
                type="button"
                className="button button--ghost"
                onClick={async () => {
                  try {
                    const result = await supabaseSyncService.pushState(currentBundle);
                    updateSettings((entry) => ({
                      ...entry,
                      supabase: {
                        ...entry.supabase,
                        autoSync: true,
                        userId: result.userId,
                        lastSyncedAt: result.updatedAt,
                      },
                    }));
                    setSyncMessage(`Pushed local snapshot to Supabase at ${result.updatedAt}.`);
                  } catch (error) {
                    setSyncMessage(error instanceof Error ? error.message : 'Supabase push failed.');
                  }
                }}
              >
                Push Now
              </button>
              <button
                type="button"
                className="button button--ghost"
                onClick={async () => {
                  try {
                    const remote = await supabaseSyncService.pullState();
                    if (!remote) {
                      setSyncMessage('No remote snapshot exists yet.');
                      return;
                    }

                    storageService.createBackupSnapshot(currentBundle, 'Pre-Supabase-restore backup');
                    replaceAllData(remote.payload);
                    updateSettings((entry) => ({
                      ...entry,
                      supabase: {
                        ...entry.supabase,
                        autoSync: true,
                        userId: remote.userId,
                        lastPulledAt: remote.updatedAt,
                      },
                    }));
                    setSyncMessage(`Restored cloud snapshot from ${remote.updatedAt}.`);
                  } catch (error) {
                    setSyncMessage(error instanceof Error ? error.message : 'Supabase restore failed.');
                  }
                }}
              >
                Restore Cloud Snapshot
              </button>
              <button
                type="button"
                className="button button--ghost"
                onClick={async () => {
                  await supabaseSyncService.signOut();
                  updateSettings((entry) => ({
                    ...entry,
                    supabase: {
                      ...entry.supabase,
                      autoSync: false,
                      userId: null,
                    },
                  }));
                  setSyncMessage('Supabase sync disabled for this browser.');
                }}
              >
                Disconnect
              </button>
            </div>
          </>
        )}
      </SectionCard>
    </div>
  );
};
