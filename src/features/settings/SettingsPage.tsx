import { SectionCard } from '../../components/common/SectionCard';
import { useAppStore } from '../../store/useAppStore';
import { storageService } from '../../services/storage/storageService';
import { parseNumber } from '../../utils/numbers';

export const SettingsPage = () => {
  const settings = useAppStore((state) => state.settings);
  const referenceEntries = useAppStore((state) => state.referenceCache.entries.length);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const clearReferenceCache = useAppStore((state) => state.clearReferenceCache);
  const restoreSeedData = useAppStore((state) => state.restoreSeedData);
  const currentState = useAppStore((state) => state);

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
            version: currentState.version,
            exportedAt: currentState.exportedAt,
            source: currentState.source,
            selectedCharacterId: currentState.selectedCharacterId,
            characters: currentState.characters,
            companions: currentState.companions,
            notes: currentState.notes,
            homebrew: currentState.homebrew,
            settings: currentState.settings,
            uiPreferences: currentState.uiPreferences,
            referenceCache: currentState.referenceCache,
          }, 'Settings backup')}>
            Create Backup Snapshot
          </button>
          <button type="button" className="button button--ghost button--danger" onClick={() => { if (window.confirm('Restore seed data and replace current local state?')) { restoreSeedData(); } }}>
            Restore Seed Data
          </button>
        </div>
      </SectionCard>
    </div>
  );
};
