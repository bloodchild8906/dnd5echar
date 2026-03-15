import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { SectionCard } from '../../components/common/SectionCard';
import { VirtualList } from '../../components/common/VirtualList';
import { settlementSchema } from '../../domain/schemas';
import { Settlement } from '../../domain/models';
import { useAppStore } from '../../store/useAppStore';
import { isoNow } from '../../utils/numbers';

export const SettlementManagerPage = () => {
  const settlements = useAppStore((s) => s.settlements);
  const createSettlement = useAppStore((s) => s.createSettlement);
  const deleteSettlement = useAppStore((s) => s.deleteSettlement);
  const navigate = useNavigate();

  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    const id = createSettlement();
    void navigate(`/settlements/${id}`);
  };

  const handleExport = (settlement: Settlement) => {
    const blob = new Blob([JSON.stringify(settlement, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settlement-${settlement.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    const pack = { exportedAt: isoNow(), settlements };
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settlements-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    setImportSuccess('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string) as unknown;

        // Support both single settlement and pack format
        const candidates: unknown[] = (() => {
          if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            const obj = raw as Record<string, unknown>;
            if (Array.isArray(obj.settlements)) return obj.settlements;
            // Single settlement object
            return [raw];
          }
          return [];
        })();

        if (candidates.length === 0) {
          setImportError('No valid settlement data found in the file.');
          return;
        }

        const failures: string[] = [];
        const valid: Settlement[] = [];

        candidates.forEach((entry, idx) => {
          const result = settlementSchema.safeParse(entry);
          if (result.success) {
            valid.push(result.data as Settlement);
          } else {
            const name =
              entry && typeof entry === 'object' && 'name' in entry
                ? String((entry as Record<string, unknown>).name)
                : `entry ${idx + 1}`;
            failures.push(`"${name}": ${result.error.issues[0]?.message ?? 'invalid'}`);
          }
        });

        valid.forEach((settlement) => {
          createSettlement(settlement);
        });

        if (failures.length > 0) {
          setImportError(
            `Imported ${valid.length} settlement(s). ${failures.length} rejected:\n${failures.join('\n')}`
          );
        } else {
          setImportSuccess(`Imported ${valid.length} settlement(s) successfully.`);
        }
      } catch {
        setImportError('Failed to parse file. Ensure it is a valid JSON settlement file.');
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Settlements</p>
          <h1>Settlement Manager</h1>
          <p>Create and manage settlements with sections, map pins, and compendium publishing.</p>
        </div>
        <div className="button-row">
          <button type="button" className="button button--small" onClick={handleCreate}>
            New Settlement
          </button>
          {settlements.length > 0 ? (
            <button
              type="button"
              className="button button--ghost button--small"
              onClick={handleExportAll}
            >
              Export All
            </button>
          ) : null}
          <label className="button button--ghost button--small" style={{ cursor: 'pointer' }}>
            Import
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleImport}
              aria-label="Import settlement file"
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

      <SectionCard title="Settlements" subtitle={`${settlements.length} settlement(s) saved locally.`}>
        {settlements.length === 0 ? (
          <EmptyState
            title="No settlements yet"
            description="Create a new settlement or import one to get started."
          />
        ) : (
          <VirtualList
            items={settlements}
            className="stack-list"
            estimateSize={64}
            maxHeight={480}
            getKey={(s) => s.id}
            renderItem={(s) => (
              <div className="list-button" style={{ cursor: 'default' }}>
                <button
                  type="button"
                  className="list-button"
                  style={{ flex: 1, border: 'none', background: 'none', padding: 0, textAlign: 'left' }}
                  onClick={() => void navigate(`/settlements/${s.id}`)}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
                    <strong style={{ fontSize: '0.9rem' }}>{s.name}</strong>
                    <span style={{ color: 'var(--ink-soft)', fontSize: '0.8rem' }}>
                      {s.sections.length} sections · {s.mapPins.length} pins
                      {s.published ? ' · Published' : ''}
                    </span>
                  </div>
                </button>
                <div className="button-row">
                  <button
                    type="button"
                    className="button button--ghost button--small"
                    onClick={() => handleExport(s)}
                    aria-label={`Export ${s.name}`}
                  >
                    Export
                  </button>
                  <button
                    type="button"
                    className="button button--ghost button--small button--danger"
                    onClick={() => deleteSettlement(s.id)}
                    aria-label={`Delete ${s.name}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          />
        )}
      </SectionCard>
    </div>
  );
};
