import { useMemo, useState, type ChangeEvent, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { SectionCard } from '../../components/common/SectionCard';
import type { PersistedAppData } from '../../domain/models';
import { getCharacterSummary } from '../../domain/derived';
import { storageService } from '../../services/storage/storageService';
import { selectPersistedAppData, useAppStore } from '../../store/useAppStore';

const toExportFilename = (name: string) => {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `codex-arcanum-${normalized || 'character'}.json`;
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const characters = useAppStore((state) => state.characters);
  const companions = useAppStore((state) => state.companions);
  const notes = useAppStore((state) => state.notes);
  const homebrew = useAppStore((state) => state.homebrew);
  const settings = useAppStore((state) => state.settings);
  const referenceEntries = useAppStore((state) => state.referenceCache.entries.length);
  const selectedCharacterId = useAppStore((state) => state.selectedCharacterId);
  const createCharacter = useAppStore((state) => state.createCharacter);
  const duplicateCharacter = useAppStore((state) => state.duplicateCharacter);
  const deleteCharacter = useAppStore((state) => state.deleteCharacter);
  const replaceAllData = useAppStore((state) => state.replaceAllData);
  const selectCharacter = useAppStore((state) => state.selectCharacter);
  const [importMessage, setImportMessage] = useState('');
  const [isImportTarget, setIsImportTarget] = useState(false);
  const [stagedImport, setStagedImport] = useState<{
    fileName: string;
    bundle: PersistedAppData;
  } | null>(null);

  const summaries = useMemo(
    () =>
      characters
        .map((character) => ({
          ...getCharacterSummary(character),
          updatedAt: character.updatedAt,
        }))
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [characters]
  );
  const selectedSummary = summaries.find((entry) => entry.id === selectedCharacterId) ?? null;
  const metrics = useMemo(
    () => [
      {
        label: 'Dossiers',
        value: String(characters.length).padStart(2, '0'),
        detail: `${summaries.filter((entry) => entry.currentHp > 0).length} active-ready records`,
      },
      {
        label: 'Companions',
        value: String(companions.length).padStart(2, '0'),
        detail: 'Linked support actors across every character',
      },
      {
        label: 'Archive Notes',
        value: String(notes.length).padStart(2, '0'),
        detail: `${homebrew.length} homebrew records in the registry`,
      },
      {
        label: 'Reference Cache',
        value: String(referenceEntries).padStart(2, '0'),
        detail: settings.supabase.autoSync
          ? 'Supabase primary with local fallback cache'
          : 'Running from the local fallback layer',
      },
    ],
    [
      characters.length,
      companions.length,
      homebrew.length,
      notes.length,
      referenceEntries,
      settings.supabase.autoSync,
      summaries,
    ]
  );

  const stageImportBundle = (fileName: string, contents: string) => {
    try {
      const bundle = storageService.parseImportBundle(contents);
      setStagedImport({ fileName, bundle });
      setImportMessage(`Validated "${fileName}". Choose merge or replace.`);
    } catch (error) {
      setStagedImport(null);
      setImportMessage(error instanceof Error ? error.message : 'Unable to import this bundle.');
    }
  };

  const handleImportFile = (file?: File | null) => {
    if (!file) {
      return;
    }

    const isJsonFile =
      file.type === 'application/json' || file.name.toLowerCase().endsWith('.json');

    if (!isJsonFile) {
      setStagedImport(null);
      setImportMessage('Only JSON bundle files are supported on the dashboard intake.');
      return;
    }

    file
      .text()
      .then((contents) => stageImportBundle(file.name, contents))
      .catch((error: unknown) => {
        setStagedImport(null);
        setImportMessage(
          error instanceof Error ? error.message : 'Unable to read the selected file.'
        );
      });
  };

  const handleImportInput = (event: ChangeEvent<HTMLInputElement>) => {
    handleImportFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleImportDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsImportTarget(false);
    handleImportFile(event.dataTransfer.files?.[0]);
  };

  const applyStagedImport = (mode: 'replace' | 'merge') => {
    if (!stagedImport) {
      return;
    }

    const current = selectPersistedAppData(useAppStore.getState());
    storageService.createBackupSnapshot(current, `Dashboard pre-${mode}-import backup`);
    replaceAllData(
      mode === 'replace'
        ? stagedImport.bundle
        : storageService.mergeBundles(current, stagedImport.bundle)
    );
    setImportMessage(
      mode === 'replace'
        ? `Replaced the workspace with "${stagedImport.fileName}".`
        : `Merged "${stagedImport.fileName}" into the workspace.`
    );
    setStagedImport(null);
  };

  return (
    <div className="page-stack dashboard-page">
      <section className="page-header page-header--hero">
        <div>
          <p className="eyebrow">Operations Overview</p>
          <h1>Campaign Administration Dashboard</h1>
          <p>
            Coordinate roster readiness, backup posture, and rules content from a single admin
            surface.
          </p>
        </div>
        <div className="button-row">
          <button
            type="button"
            className="button"
            onClick={() => {
              const id = createCharacter();
              navigate(`/characters/${id}/builder`);
            }}
          >
            New Character
          </button>
          <button type="button" className="button button--ghost" onClick={() => navigate('/games')}>
            Open Games
          </button>
        </div>
      </section>

      <section className="dashboard-metrics">
        {metrics.map((metric) => (
          <article key={metric.label} className="metric-card">
            <span className="metric-card__label">{metric.label}</span>
            <strong className="metric-card__value">{metric.value}</strong>
            <p>{metric.detail}</p>
          </article>
        ))}
      </section>

      <div className="dashboard-grid">
        <SectionCard
          title="Roster Control"
          subtitle="Recent dossiers with direct access to the builder and live sheet."
          className="dashboard-grid__main"
        >
          {summaries.length === 0 ? (
            <EmptyState
              title="No dossiers in the workspace"
              description="Create the first character to unlock builder, inventory, spellbook, notes, and print flows."
            />
          ) : (
            <div className="roster-table">
              {summaries.map((summary) => (
                <article key={summary.id} className="roster-row">
                  <div className="roster-row__main">
                    <div>
                      <div className="section-inline-header">
                        <h3>{summary.name}</h3>
                        <Badge tone={summary.currentHp > 0 ? 'success' : 'warning'}>
                          {summary.currentHp}/{summary.maxHp} HP
                        </Badge>
                      </div>
                      <p>
                        {summary.raceName} - Level {summary.level} {summary.className}
                      </p>
                    </div>
                    <div className="inline-badges">
                      {summary.conditions.length ? (
                        summary.conditions.map((condition) => (
                          <Badge key={condition} tone="warning">
                            {condition}
                          </Badge>
                        ))
                      ) : (
                        <Badge>Stable</Badge>
                      )}
                    </div>
                  </div>
                  <div className="roster-row__actions">
                    <button
                      type="button"
                      className="button"
                      onClick={() => {
                        selectCharacter(summary.id);
                        navigate(`/characters/${summary.id}/sheet`);
                      }}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      className="button button--ghost"
                      onClick={() => navigate(`/characters/${summary.id}/builder`)}
                    >
                      Builder
                    </button>
                    <button
                      type="button"
                      className="button button--ghost"
                      onClick={() => {
                        const copyId = duplicateCharacter(summary.id);
                        if (copyId) {
                          navigate(`/characters/${copyId}/builder`);
                        }
                      }}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="button button--ghost"
                      onClick={() => {
                        const bundle = storageService.createCharacterBundle(
                          selectPersistedAppData(useAppStore.getState()),
                          summary.id
                        );

                        if (bundle) {
                          storageService.downloadBundle(toExportFilename(summary.name), bundle);
                        }
                      }}
                    >
                      Export
                    </button>
                    <button
                      type="button"
                      className="button button--ghost button--danger"
                      onClick={() => {
                        if (window.confirm(`Delete ${summary.name}?`)) {
                          deleteCharacter(summary.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </SectionCard>

        <div className="dashboard-grid__side">
          <SectionCard
            title="Control Room"
            subtitle="Current workspace posture and operator context."
          >
            <div className="dashboard-panel-list">
              <div className="dashboard-panel-item">
                <span>Selected dossier</span>
                <strong>{selectedSummary?.name ?? 'None selected'}</strong>
              </div>
              <div className="dashboard-panel-item">
                <span>Persistence mode</span>
                <strong>
                  {settings.supabase.autoSync
                    ? 'Supabase primary / local fallback'
                    : 'Local fallback only'}
                </strong>
              </div>
              <div className="dashboard-panel-item">
                <span>Reference cache</span>
                <strong>{referenceEntries} entries cached</strong>
              </div>
              <div className="dashboard-panel-item">
                <span>Last selected</span>
                <strong>{settings.lastSelectedCharacterId ?? 'No active record'}</strong>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="JSON Intake"
            subtitle="Drop a workspace or character bundle here to validate it before importing."
          >
            {importMessage ? <p className="callout">{importMessage}</p> : null}
            <div
              className={isImportTarget ? 'dropzone-card dropzone-card--active' : 'dropzone-card'}
              onDragOver={(event) => {
                event.preventDefault();
                setIsImportTarget(true);
              }}
              onDragLeave={() => setIsImportTarget(false)}
              onDrop={handleImportDrop}
            >
              <strong>{stagedImport?.fileName ?? 'Drop a .json bundle here'}</strong>
              <span>
                {stagedImport
                  ? 'Bundle validated. Choose merge or replace below.'
                  : 'Validation happens before any local state is written.'}
              </span>
            </div>
            <input
              className="input"
              type="file"
              accept="application/json,.json"
              onChange={handleImportInput}
            />
            {stagedImport ? (
              <>
                <div className="dropzone-card__stats">
                  <span className="status-pill status-pill--accent">
                    {stagedImport.bundle.characters.length} characters
                  </span>
                  <span className="status-pill">
                    {stagedImport.bundle.companions.length} companions
                  </span>
                  <span className="status-pill">{stagedImport.bundle.notes.length} notes</span>
                  <span className="status-pill">
                    {stagedImport.bundle.homebrew.length} homebrew
                  </span>
                </div>
                <div className="button-row">
                  <button
                    type="button"
                    className="button"
                    onClick={() => applyStagedImport('merge')}
                  >
                    Merge Bundle
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => {
                      if (
                        window.confirm('Replace the current workspace with this validated import?')
                      ) {
                        applyStagedImport('replace');
                      }
                    }}
                  >
                    Replace Workspace
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => {
                      setStagedImport(null);
                      setImportMessage('');
                    }}
                  >
                    Clear
                  </button>
                </div>
              </>
            ) : (
              <div className="button-row">
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => navigate('/import-export')}
                >
                  Open Full Archive Route
                </button>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Quick Launch" subtitle="Jump directly into the operational routes.">
            <div className="quick-action-grid">
              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate('/homebrew')}
              >
                <strong>Homebrew Registry</strong>
                <span>Manage custom rules and overrides</span>
              </button>
              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate('/import-export')}
              >
                <strong>Backup Archive</strong>
                <span>Export bundles and restore snapshots</span>
              </button>
              <button
                type="button"
                className="quick-action-card"
                onClick={() => navigate('/settings')}
              >
                <strong>System Settings</strong>
                <span>Adjust cache, print, and sync posture</span>
              </button>
              <button type="button" className="quick-action-card" onClick={() => navigate('/gm')}>
                <strong>GM Console</strong>
                <span>Open the session oversight workspace</span>
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};
