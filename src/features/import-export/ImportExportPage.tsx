import { ChangeEvent, useMemo, useState } from 'react';
import { SectionCard } from '../../components/common/SectionCard';
import { useAppStore, selectPersistedAppData } from '../../store/useAppStore';
import { storageService } from '../../services/storage/storageService';

export const ImportExportPage = () => {
  const state = useAppStore((current) => current);
  const replaceAllData = useAppStore((current) => current.replaceAllData);
  const [draft, setDraft] = useState('');
  const [backups, setBackups] = useState(() => storageService.listBackups());

  const selectedCharacterBundle = useMemo(() => {
    const character = state.characters.find((entry) => entry.id === state.selectedCharacterId);
    if (!character) {
      return null;
    }

    return {
      ...selectPersistedAppData(state),
      characters: [character],
      companions: state.companions.filter((entry) => entry.parentCharacterId === character.id),
      notes: state.notes.filter((entry) => !entry.relatedCharacterId || entry.relatedCharacterId === character.id),
    };
  }, [state]);

  const handleImport = (mode: 'replace' | 'merge') => {
    const incoming = storageService.parseImportBundle(draft);
    const current = selectPersistedAppData(state);
    storageService.createBackupSnapshot(current, `Pre-${mode}-import backup`);
    replaceAllData(mode === 'replace' ? incoming : storageService.mergeBundles(current, incoming));
    setBackups(storageService.listBackups());
    setDraft('');
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    file.text().then(setDraft);
  };

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Import and Export</p>
          <h1>Backups and Snapshots</h1>
          <p>Export the full app or a single character, import bundles, merge local state, and restore backups.</p>
        </div>
      </section>

      <SectionCard title="Export">
        <div className="button-row">
          <button type="button" className="button" onClick={() => storageService.downloadBundle('dnd5e-app-export.json', selectPersistedAppData(state))}>
            Export Full App
          </button>
          <button type="button" className="button button--ghost" disabled={!selectedCharacterBundle} onClick={() => selectedCharacterBundle && storageService.downloadBundle('dnd5e-character-export.json', selectedCharacterBundle)}>
            Export Current Character
          </button>
          <button type="button" className="button button--ghost" onClick={() => { storageService.createBackupSnapshot(selectPersistedAppData(state), 'Manual snapshot'); setBackups(storageService.listBackups()); }}>
            Create Backup Snapshot
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Import">
        <div className="form-grid">
          <input className="input" type="file" accept="application/json" onChange={handleFile} />
          <textarea className="textarea" rows={14} value={draft} placeholder="Paste exported JSON here" onChange={(event) => setDraft(event.target.value)} />
        </div>
        <div className="button-row">
          <button type="button" className="button" disabled={!draft.trim()} onClick={() => handleImport('replace')}>
            Replace Current Data
          </button>
          <button type="button" className="button button--ghost" disabled={!draft.trim()} onClick={() => handleImport('merge')}>
            Merge Into Current Data
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Backups">
        <div className="stack-list">
          {backups.map((backup) => (
            <article key={backup.id} className="spell-card spell-card--compact">
              <div>
                <h3>{backup.label}</h3>
                <p>{new Date(backup.createdAt).toLocaleString()}</p>
              </div>
              <div className="button-row">
                <button type="button" className="button button--ghost" onClick={() => { const restored = storageService.restoreBackup(backup.id); if (restored) { replaceAllData(restored); } }}>
                  Restore
                </button>
                <button type="button" className="button button--ghost button--danger" onClick={() => { storageService.deleteBackup(backup.id); setBackups(storageService.listBackups()); }}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};
