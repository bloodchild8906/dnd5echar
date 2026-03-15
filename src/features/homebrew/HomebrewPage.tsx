import { useRef, useState } from 'react';
import { HomebrewEditor } from '../../components/common/HomebrewEditor';
import { HomebrewBadge } from '../../components/common/HomebrewBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { SectionCard } from '../../components/common/SectionCard';
import { homebrewEntrySchema } from '../../domain/schemas';
import { HomebrewEntry, HomebrewEntityType, homebrewEntityTypes } from '../../domain/models';
import { useAppStore } from '../../store/useAppStore';
import { isoNow } from '../../utils/numbers';

const entityTypeLabels: Record<HomebrewEntityType, string> = {
  race: 'Race',
  class: 'Class',
  subclass: 'Subclass',
  feat: 'Feat',
  item: 'Item',
  spell: 'Spell',
  creature: 'Creature',
  background: 'Background',
  companion: 'Companion',
  form: 'Form',
};

export const HomebrewPage = () => {
  const homebrew = useAppStore((s) => s.homebrew);
  const createHomebrew = useAppStore((s) => s.createHomebrew);
  const updateHomebrew = useAppStore((s) => s.updateHomebrew);
  const deleteHomebrew = useAppStore((s) => s.deleteHomebrew);

  const [selectedId, setSelectedId] = useState<string | null>(homebrew[0]?.id ?? null);
  const [filterType, setFilterType] = useState<HomebrewEntityType | ''>('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = homebrew.filter((e) => !filterType || e.entityType === filterType);
  const selected = filtered.find((e) => e.id === selectedId) ?? filtered[0] ?? null;

  // Export all homebrew entries as a JSON pack
  const handleExport = () => {
    const pack = { exportedAt: isoNow(), entries: homebrew };
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `homebrew-pack-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import homebrew pack — validate each entry, reject failures
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    setImportSuccess('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string) as unknown;
        const pack = raw as { entries?: unknown[] };
        const entries: unknown[] = Array.isArray(pack?.entries) ? pack.entries : [];

        if (entries.length === 0) {
          setImportError('No entries found in the pack file.');
          return;
        }

        const failures: string[] = [];
        const valid: HomebrewEntry[] = [];

        entries.forEach((entry, idx) => {
          const result = homebrewEntrySchema.safeParse(entry);
          if (result.success) {
            valid.push(result.data as HomebrewEntry);
          } else {
            const name =
              entry && typeof entry === 'object' && 'name' in entry
                ? String((entry as Record<string, unknown>).name)
                : `entry ${idx + 1}`;
            failures.push(`"${name}": ${result.error.issues[0]?.message ?? 'invalid'}`);
          }
        });

        valid.forEach((entry) => {
          // Use createHomebrew to get a fresh id, then immediately update with imported data
          const newId = createHomebrew();
          updateHomebrew(newId, () => ({ ...entry, id: newId }));
        });

        if (failures.length > 0) {
          setImportError(
            `Imported ${valid.length} entries. ${failures.length} rejected:\n${failures.join('\n')}`
          );
        } else {
          setImportSuccess(`Imported ${valid.length} entries successfully.`);
        }
      } catch {
        setImportError('Failed to parse file. Ensure it is a valid JSON homebrew pack.');
      }

      // Reset file input so the same file can be re-imported
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Homebrew Manager</p>
          <h1>Local Source Overrides</h1>
          <p>
            Create, edit, and organise homebrew entries. Source data and override data stay
            isolated so Open5e records remain untouched.
          </p>
        </div>
        <div className="button-row">
          <button type="button" className="button button--ghost button--small" onClick={handleExport}>
            Export Pack
          </button>
          <label className="button button--ghost button--small" style={{ cursor: 'pointer' }}>
            Import Pack
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleImport}
              aria-label="Import homebrew pack"
            />
          </label>
        </div>
      </section>

      {importError ? (
        <div role="alert" className="callout" style={{ whiteSpace: 'pre-line' }}>
          {importError}
        </div>
      ) : null}
      {importSuccess ? (
        <div role="status" style={{ color: 'var(--success)', fontSize: '0.9rem' }}>
          {importSuccess}
        </div>
      ) : null}

      <div className="split-layout split-layout--sidebar">
        {/* Sidebar: entry list */}
        <SectionCard
          title="Entries"
          actions={
            <button
              type="button"
              className="button button--small"
              onClick={() => {
                const id = createHomebrew();
                setSelectedId(id);
              }}
            >
              New Entry
            </button>
          }
        >
          <div className="toolbar">
            <select
              className="input"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as HomebrewEntityType | '')}
              aria-label="Filter by entity type"
            >
              <option value="">All types</option>
              {homebrewEntityTypes.map((t) => (
                <option key={t} value={t}>
                  {entityTypeLabels[t]}
                </option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="No homebrew entries"
              description="Create a new entry or import a pack to get started."
            />
          ) : (
            <div className="stack-list">
              {filtered.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={
                    selected?.id === entry.id ? 'list-button list-button--active' : 'list-button'
                  }
                  onClick={() => setSelectedId(entry.id)}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
                    <strong style={{ fontSize: '0.9rem' }}>{entry.name}</strong>
                    <span style={{ color: 'var(--ink-soft)', fontSize: '0.8rem' }}>
                      {entityTypeLabels[entry.entityType]}
                    </span>
                  </div>
                  <HomebrewBadge />
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Main: editor */}
        {selected ? (
          <SectionCard
            title={selected.name || 'Edit Entry'}
            subtitle="Edit name, type, summary, tags, notes, and override data."
            actions={
              <button
                type="button"
                className="button button--ghost button--small button--danger"
                onClick={() => {
                  deleteHomebrew(selected.id);
                  setSelectedId(filtered.find((e) => e.id !== selected.id)?.id ?? null);
                }}
              >
                Delete
              </button>
            }
          >
            <HomebrewEditor
              entry={selected}
              onSave={(updater) => updateHomebrew(selected.id, updater)}
            />
          </SectionCard>
        ) : (
          <EmptyState
            title="No entry selected"
            description="Select an entry from the list or create a new one."
          />
        )}
      </div>
    </div>
  );
};
