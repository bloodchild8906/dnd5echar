import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../../components/common/EmptyState';
import { SearchBar } from '../../components/common/SearchBar';
import { SectionCard } from '../../components/common/SectionCard';
import { TagInput } from '../../components/common/TagInput';
import { getMergedHomebrewData } from '../../domain/derived';
import { useOpen5eResource } from '../../hooks/useOpen5eResource';
import { useAppStore } from '../../store/useAppStore';

const resourceToEntity = {
  spells: 'spell',
  monsters: 'creature',
  classes: 'class',
  races: 'race',
  backgrounds: 'background',
  feats: 'feat',
  weapons: 'item',
  armor: 'item',
  magicitems: 'item',
} as const;

export const HomebrewPage = () => {
  const homebrew = useAppStore((state) => state.homebrew);
  const createHomebrew = useAppStore((state) => state.createHomebrew);
  const updateHomebrew = useAppStore((state) => state.updateHomebrew);
  const deleteHomebrew = useAppStore((state) => state.deleteHomebrew);
  const cloneSourceToHomebrew = useAppStore((state) => state.cloneSourceToHomebrew);
  const settings = useAppStore((state) => state.settings);
  const [selectedId, setSelectedId] = useState<string | null>(homebrew[0]?.id ?? null);
  const [filter, setFilter] = useState('');
  const [resource, setResource] = useState<keyof typeof resourceToEntity>('spells');
  const [search, setSearch] = useState('');
  const [overrideDraft, setOverrideDraft] = useState('');
  const [overrideError, setOverrideError] = useState('');

  const references = useOpen5eResource(resource, {
    document__slug: settings.referenceDocumentFilter,
    search,
    limit: 16,
  });

  const filtered = useMemo(
    () => homebrew.filter((entry) => !filter || entry.entityType === filter),
    [filter, homebrew]
  );
  const selected = filtered.find((entry) => entry.id === selectedId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (!selected) {
      setOverrideDraft('');
      setOverrideError('');
      return;
    }

    setOverrideDraft(JSON.stringify(selected.overrideData, null, 2));
    setOverrideError('');
  }, [selected?.id]);

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Homebrew Manager</p>
          <h1>Local Source Overrides</h1>
          <p>
            Source data, local override data, and merged display data stay isolated so Open5e
            records remain untouched.
          </p>
        </div>
      </section>

      <div className="split-layout split-layout--sidebar">
        <SectionCard
          title="Entries"
          actions={
            <button
              type="button"
              className="button"
              onClick={() => setSelectedId(createHomebrew())}
            >
              New Entry
            </button>
          }
        >
          <div className="toolbar">
            <select
              className="input"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="">All types</option>
              <option value="race">Race</option>
              <option value="class">Class</option>
              <option value="subclass">Subclass</option>
              <option value="feat">Feat</option>
              <option value="item">Item</option>
              <option value="spell">Spell</option>
              <option value="creature">Creature</option>
              <option value="background">Background</option>
              <option value="companion">Companion</option>
              <option value="form">Form</option>
            </select>
          </div>
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
                <strong>{entry.name}</strong>
                <span>{entry.entityType}</span>
              </button>
            ))}
          </div>
          <div className="toolbar">
            <select
              className="input"
              value={resource}
              onChange={(event) => setResource(event.target.value as keyof typeof resourceToEntity)}
            >
              {Object.keys(resourceToEntity).map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
            <SearchBar value={search} placeholder="Search Open5e" onChange={setSearch} />
          </div>
          <div className="stack-list">
            {references.items.map((entry) => (
              <article key={entry.id} className="spell-card spell-card--compact">
                <div>
                  <h3>{entry.name}</h3>
                  <p>{'summary' in entry ? entry.summary : entry.description}</p>
                </div>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() =>
                    setSelectedId(
                      cloneSourceToHomebrew({
                        entityType: resourceToEntity[resource],
                        name: entry.name,
                        summary: 'summary' in entry ? entry.summary : entry.description,
                        sourceRef: entry.sourceRef,
                        sourceData: 'raw' in entry ? entry.raw : entry,
                        overrideData: {},
                      })
                    )
                  }
                >
                  Clone
                </button>
              </article>
            ))}
          </div>
        </SectionCard>

        {selected ? (
          <SectionCard
            title={selected.name}
            subtitle="Edit only overrideData to preserve resettable source provenance."
          >
            <div className="form-grid form-grid--three">
              <label>
                Name
                <input
                  className="input"
                  value={selected.name}
                  onChange={(event) =>
                    updateHomebrew(selected.id, (entry) => ({ ...entry, name: event.target.value }))
                  }
                />
              </label>
              <label>
                Entity Type
                <select
                  className="input"
                  value={selected.entityType}
                  onChange={(event) =>
                    updateHomebrew(selected.id, (entry) => ({
                      ...entry,
                      entityType: event.target.value as typeof entry.entityType,
                    }))
                  }
                >
                  <option value="race">Race</option>
                  <option value="class">Class</option>
                  <option value="subclass">Subclass</option>
                  <option value="feat">Feat</option>
                  <option value="item">Item</option>
                  <option value="spell">Spell</option>
                  <option value="creature">Creature</option>
                  <option value="background">Background</option>
                  <option value="companion">Companion</option>
                  <option value="form">Form</option>
                </select>
              </label>
              <label>
                Summary
                <input
                  className="input"
                  value={selected.summary}
                  onChange={(event) =>
                    updateHomebrew(selected.id, (entry) => ({
                      ...entry,
                      summary: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <TagInput
              label="Tags"
              values={selected.tags}
              onChange={(values) =>
                updateHomebrew(selected.id, (entry) => ({ ...entry, tags: values }))
              }
            />
            <label>
              Source Data
              <textarea
                className="textarea"
                rows={8}
                readOnly
                value={JSON.stringify(selected.sourceData, null, 2)}
              />
            </label>
            <label>
              Override Data
              <textarea
                className="textarea"
                rows={8}
                value={overrideDraft}
                onChange={(event) => {
                  const nextDraft = event.target.value;
                  setOverrideDraft(nextDraft);

                  try {
                    const next = JSON.parse(nextDraft) as unknown;
                    updateHomebrew(selected.id, (entry) => ({ ...entry, overrideData: next }));
                    setOverrideError('');
                  } catch {
                    setOverrideError('Override data must be valid JSON before it can be saved.');
                  }
                }}
              />
            </label>
            {overrideError ? <p className="callout">{overrideError}</p> : null}
            <label>
              Notes
              <textarea
                className="textarea"
                rows={4}
                value={selected.notes}
                onChange={(event) =>
                  updateHomebrew(selected.id, (entry) => ({ ...entry, notes: event.target.value }))
                }
              />
            </label>
            <label>
              Merged Display Data
              <textarea
                className="textarea"
                rows={8}
                readOnly
                value={JSON.stringify(
                  getMergedHomebrewData<Record<string, unknown>>(selected),
                  null,
                  2
                )}
              />
            </label>
            <div className="button-row">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => {
                  updateHomebrew(selected.id, (entry) => ({ ...entry, overrideData: {} }));
                  setOverrideDraft('{}');
                  setOverrideError('');
                }}
              >
                Reset Overrides
              </button>
              <button
                type="button"
                className="button button--ghost button--danger"
                onClick={() => deleteHomebrew(selected.id)}
              >
                Delete Entry
              </button>
            </div>
          </SectionCard>
        ) : (
          <EmptyState
            title="No homebrew selected"
            description="Create or clone an entry to begin editing source and override data."
          />
        )}
      </div>
    </div>
  );
};
