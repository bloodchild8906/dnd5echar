import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { SearchBar } from '../../components/common/SearchBar';
import { SectionCard } from '../../components/common/SectionCard';
import {
  CompendiumShelfEntry,
  ReferenceCreature,
  ReferenceEntrySnapshot,
  ReferenceOption,
  ReferenceResource,
  Spell,
  referenceResources,
} from '../../domain/models';
import { useOpen5eResource } from '../../hooks/useOpen5eResource';
import { useAppStore } from '../../store/useAppStore';
import { isoNow } from '../../utils/numbers';

const compendiumResources = referenceResources;
const MAX_PINNED_ENTRIES = 12;
const MAX_RECENT_ENTRIES = 8;

const resourceLabels: Record<ReferenceResource, string> = {
  classes: 'Classes',
  races: 'Races',
  backgrounds: 'Backgrounds',
  feats: 'Feats',
  spells: 'Spells',
  monsters: 'Monsters',
  weapons: 'Weapons',
  armor: 'Armor',
  magicitems: 'Magic Items',
};

type CompendiumEntry = ReferenceOption | ReferenceCreature | Spell;
type SelectedEntryRef = { resource: ReferenceResource; entryId: string };

const isSpell = (entry: CompendiumEntry): entry is Spell => 'castingTime' in entry;

const isCreature = (entry: CompendiumEntry): entry is ReferenceCreature =>
  'creatureType' in entry && 'challengeRating' in entry && 'stats' in entry;

const getEntryResource = (entry: ReferenceEntrySnapshot): ReferenceResource => {
  if (isSpell(entry)) {
    return 'spells';
  }

  if (isCreature(entry)) {
    return 'monsters';
  }

  return entry.resource;
};

const createShelfKey = (resource: ReferenceResource, entryId: string) => `${resource}:${entryId}`;

const createShelfEntry = (entry: CompendiumEntry): CompendiumShelfEntry => ({
  entryId: entry.id,
  resource: getEntryResource(entry),
  snapshot: entry,
  savedAt: isoNow(),
});

const upsertShelfEntry = (
  entries: CompendiumShelfEntry[],
  candidate: CompendiumShelfEntry,
  limit: number
) => {
  const candidateKey = createShelfKey(candidate.resource, candidate.entryId);

  if (entries[0] && createShelfKey(entries[0].resource, entries[0].entryId) === candidateKey) {
    return entries;
  }

  return [
    candidate,
    ...entries.filter((entry) => createShelfKey(entry.resource, entry.entryId) !== candidateKey),
  ].slice(0, limit);
};

const removeShelfEntry = (
  entries: CompendiumShelfEntry[],
  resource: ReferenceResource,
  entryId: string
) =>
  entries.filter(
    (entry) => createShelfKey(entry.resource, entry.entryId) !== createShelfKey(resource, entryId)
  );

const getEntryBody = (entry: CompendiumEntry) => {
  if (isSpell(entry)) {
    return entry.description;
  }

  if (isCreature(entry)) {
    return entry.description;
  }

  return entry.summary || 'No summary available for this reference entry.';
};

export const CompendiumPage = () => {
  const settings = useAppStore((state) => state.settings);
  const cachedEntries = useAppStore((state) => state.referenceCache.entries.length);
  const compendiumPreferences = useAppStore((state) => state.uiPreferences.compendium);
  const updateUiPreferences = useAppStore((state) => state.updateUiPreferences);
  const [resource, setResource] = useState<ReferenceResource>('spells');
  const [query, setQuery] = useState('');
  const [selectedEntryRef, setSelectedEntryRef] = useState<SelectedEntryRef | null>(null);
  const deferredQuery = useDeferredValue(query.trim());
  const resourceResult = useOpen5eResource(resource, {
    document__slug: settings.referenceDocumentFilter,
    search: deferredQuery || undefined,
    limit: 30,
  });

  const entries = useMemo(() => resourceResult.items as CompendiumEntry[], [resourceResult.items]);
  const shelfLookup = useMemo(() => {
    const map = new Map<string, CompendiumShelfEntry>();

    [...compendiumPreferences.recentEntries, ...compendiumPreferences.pinnedEntries].forEach(
      (entry) => {
        map.set(createShelfKey(entry.resource, entry.entryId), entry);
      }
    );

    return map;
  }, [compendiumPreferences.pinnedEntries, compendiumPreferences.recentEntries]);
  const selectedEntry = useMemo(
    () =>
      selectedEntryRef
        ? (entries.find(
            (entry) =>
              getEntryResource(entry) === selectedEntryRef.resource &&
              entry.id === selectedEntryRef.entryId
          ) ??
          shelfLookup.get(createShelfKey(selectedEntryRef.resource, selectedEntryRef.entryId))
            ?.snapshot ??
          null)
        : (entries[0] ?? null),
    [entries, selectedEntryRef, shelfLookup]
  );
  const selectedResource = selectedEntry ? getEntryResource(selectedEntry) : resource;
  const isSelectedPinned = selectedEntry
    ? compendiumPreferences.pinnedEntries.some(
        (entry) =>
          createShelfKey(entry.resource, entry.entryId) ===
          createShelfKey(selectedResource, selectedEntry.id)
      )
    : false;

  useEffect(() => {
    setSelectedEntryRef((current) => {
      if (
        current &&
        current.resource === resource &&
        entries.some((entry) => entry.id === current.entryId)
      ) {
        return current;
      }

      if (current && current.resource === resource && entries.length === 0) {
        return current;
      }

      return entries[0] ? { resource, entryId: entries[0].id } : null;
    });
  }, [entries, resource]);

  useEffect(() => {
    if (!selectedEntry) {
      return;
    }

    const nextEntry = createShelfEntry(selectedEntry);
    updateUiPreferences((ui) => {
      const recentEntries = upsertShelfEntry(
        ui.compendium.recentEntries,
        nextEntry,
        MAX_RECENT_ENTRIES
      );

      if (recentEntries === ui.compendium.recentEntries) {
        return ui;
      }

      return {
        ...ui,
        compendium: {
          ...ui.compendium,
          recentEntries,
        },
      };
    });
  }, [selectedEntry, updateUiPreferences]);

  const openShelfEntry = (entry: CompendiumShelfEntry) => {
    setResource(entry.resource);
    setQuery(entry.snapshot.name);
    setSelectedEntryRef({ resource: entry.resource, entryId: entry.entryId });
  };

  const handlePinToggle = () => {
    if (!selectedEntry) {
      return;
    }

    const nextEntry = createShelfEntry(selectedEntry);
    updateUiPreferences((ui) => {
      const pinnedEntries = isSelectedPinned
        ? removeShelfEntry(ui.compendium.pinnedEntries, nextEntry.resource, nextEntry.entryId)
        : upsertShelfEntry(ui.compendium.pinnedEntries, nextEntry, MAX_PINNED_ENTRIES);

      return {
        ...ui,
        compendium: {
          ...ui.compendium,
          pinnedEntries,
        },
      };
    });
  };

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Compendium</p>
          <h1>Reference Browser</h1>
          <p>
            Search Open5e-backed rules content, browse cached entries, and review the current
            category without leaving the workspace.
          </p>
        </div>
        <div className="inline-badges">
          <span className="status-pill status-pill--accent">{resourceLabels[resource]}</span>
          <span className="status-pill">{compendiumPreferences.pinnedEntries.length} pinned</span>
          <span className="status-pill">{cachedEntries} cached entries</span>
          <span className="status-pill">{settings.referenceDocumentFilter || 'All documents'}</span>
        </div>
      </section>

      <SectionCard
        title="Query"
        subtitle="Switch categories and search the current Open5e resource collection."
      >
        <div className="segmented category-pills">
          {compendiumResources.map((entry) => (
            <button
              key={entry}
              type="button"
              className={entry === resource ? 'button' : 'button button--ghost'}
              onClick={() => {
                setResource(entry);
                setSelectedEntryRef(null);
              }}
            >
              {resourceLabels[entry]}
            </button>
          ))}
        </div>
        <SearchBar
          value={query}
          placeholder={`Search ${resourceLabels[resource].toLowerCase()}`}
          onChange={setQuery}
        />
        {compendiumPreferences.pinnedEntries.length ? (
          <div className="shelf-section">
            <div className="section-inline-header">
              <strong>Pinned Shelf</strong>
              <Badge tone="accent">{compendiumPreferences.pinnedEntries.length}</Badge>
            </div>
            <div className="shelf-grid">
              {compendiumPreferences.pinnedEntries.map((entry) => (
                <button
                  key={createShelfKey(entry.resource, entry.entryId)}
                  type="button"
                  className="shelf-entry"
                  onClick={() => openShelfEntry(entry)}
                >
                  <strong>{entry.snapshot.name}</strong>
                  <span>{resourceLabels[entry.resource]}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {compendiumPreferences.recentEntries.length ? (
          <div className="shelf-section">
            <div className="section-inline-header">
              <strong>Recent Entries</strong>
              <div className="button-row">
                <Badge>{compendiumPreferences.recentEntries.length}</Badge>
                <button
                  type="button"
                  className="button button--ghost button--small"
                  onClick={() =>
                    updateUiPreferences((ui) => ({
                      ...ui,
                      compendium: {
                        ...ui.compendium,
                        recentEntries: [],
                      },
                    }))
                  }
                >
                  Clear Recent
                </button>
              </div>
            </div>
            <div className="shelf-grid">
              {compendiumPreferences.recentEntries.map((entry) => (
                <button
                  key={createShelfKey(entry.resource, entry.entryId)}
                  type="button"
                  className="shelf-entry shelf-entry--muted"
                  onClick={() => openShelfEntry(entry)}
                >
                  <strong>{entry.snapshot.name}</strong>
                  <span>{resourceLabels[entry.resource]}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {resourceResult.error ? <p className="callout">{resourceResult.error}</p> : null}
      </SectionCard>

      <div className="compendium-layout">
        <SectionCard
          title="Results"
          subtitle={`${entries.length} entries returned for ${resourceLabels[resource].toLowerCase()}.`}
          className="compendium-layout__results"
        >
          {resourceResult.loading && entries.length === 0 ? (
            <div className="empty-state">Loading reference entries...</div>
          ) : null}

          {!resourceResult.loading && entries.length === 0 ? (
            <EmptyState
              title="No reference entries found"
              description="Try a broader search term or switch to another compendium category."
            />
          ) : null}

          {entries.length ? (
            <div className="compendium-results">
              {entries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={
                    createShelfKey(getEntryResource(entry), entry.id) ===
                    (selectedEntry
                      ? createShelfKey(selectedResource, selectedEntry.id)
                      : '__unselected__')
                      ? 'compendium-result compendium-result--active'
                      : 'compendium-result'
                  }
                  onClick={() =>
                    setSelectedEntryRef({ resource: getEntryResource(entry), entryId: entry.id })
                  }
                >
                  <div className="section-inline-header">
                    <strong>{entry.name}</strong>
                    <Badge tone="accent">{resourceLabels[getEntryResource(entry)]}</Badge>
                  </div>
                  <p>{getEntryBody(entry).slice(0, 180) || 'No description available.'}</p>
                </button>
              ))}
            </div>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Detail"
          subtitle={
            selectedEntry
              ? `Focused detail for ${selectedEntry.name}.`
              : 'Select a result to inspect its detail.'
          }
          className="compendium-layout__detail"
        >
          {!selectedEntry ? (
            <EmptyState
              title="No entry selected"
              description="Choose a result from the list to inspect its rules detail."
            />
          ) : (
            <div className="detail-stack">
              <div className="section-inline-header">
                <div>
                  <h2>{selectedEntry.name}</h2>
                  <p className="detail-subcopy">
                    Stored locally for quick reopen through the compendium shelf.
                  </p>
                </div>
                <div className="button-row">
                  <button
                    type="button"
                    className={
                      isSelectedPinned
                        ? 'button button--ghost button--small'
                        : 'button button--small'
                    }
                    onClick={handlePinToggle}
                  >
                    {isSelectedPinned ? 'Unpin Entry' : 'Pin Entry'}
                  </button>
                </div>
              </div>
              <div className="inline-badges">
                <Badge tone="accent">{resourceLabels[selectedResource]}</Badge>
                <Badge>{selectedEntry.sourceRef.documentSlug ?? 'Open5e'}</Badge>
                {isSelectedPinned ? <Badge tone="success">Pinned</Badge> : null}
                {resourceResult.fromCache ? <Badge tone="success">Cached</Badge> : null}
              </div>

              {isSpell(selectedEntry) ? (
                <>
                  <div className="detail-grid">
                    <div className="detail-definition">
                      <span>Level</span>
                      <strong>{selectedEntry.level}</strong>
                    </div>
                    <div className="detail-definition">
                      <span>School</span>
                      <strong>{selectedEntry.school}</strong>
                    </div>
                    <div className="detail-definition">
                      <span>Casting Time</span>
                      <strong>{selectedEntry.castingTime}</strong>
                    </div>
                    <div className="detail-definition">
                      <span>Range</span>
                      <strong>{selectedEntry.range}</strong>
                    </div>
                    <div className="detail-definition">
                      <span>Duration</span>
                      <strong>{selectedEntry.duration}</strong>
                    </div>
                    <div className="detail-definition">
                      <span>Classes</span>
                      <strong>{selectedEntry.classes.join(', ') || 'Unknown'}</strong>
                    </div>
                  </div>
                  <article className="note-preview">
                    <h3>Description</h3>
                    <p>{selectedEntry.description}</p>
                    {selectedEntry.higherLevel ? (
                      <>
                        <h3>At Higher Levels</h3>
                        <p>{selectedEntry.higherLevel}</p>
                      </>
                    ) : null}
                  </article>
                </>
              ) : null}

              {isCreature(selectedEntry) ? (
                <>
                  <div className="detail-grid">
                    <div className="detail-definition">
                      <span>Size</span>
                      <strong>{selectedEntry.size}</strong>
                    </div>
                    <div className="detail-definition">
                      <span>Type</span>
                      <strong>{selectedEntry.creatureType}</strong>
                    </div>
                    <div className="detail-definition">
                      <span>Alignment</span>
                      <strong>{selectedEntry.alignment || 'Unspecified'}</strong>
                    </div>
                    <div className="detail-definition">
                      <span>Challenge Rating</span>
                      <strong>{selectedEntry.challengeRating}</strong>
                    </div>
                    <div className="detail-definition">
                      <span>Armor Class</span>
                      <strong>{selectedEntry.stats.ac}</strong>
                    </div>
                    <div className="detail-definition">
                      <span>Hit Points</span>
                      <strong>{selectedEntry.stats.hp.max}</strong>
                    </div>
                  </div>
                  <article className="note-preview">
                    <h3>Description</h3>
                    <p>{selectedEntry.description || 'No description available.'}</p>
                    <h3>Actions</h3>
                    <div className="summary-list">
                      {selectedEntry.stats.actions.map((action) => (
                        <div key={action.id} className="summary-list__row">
                          <strong>{action.name}</strong>
                          <span>{action.description}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                </>
              ) : null}

              {!isSpell(selectedEntry) && !isCreature(selectedEntry) ? (
                <>
                  <div className="detail-grid">
                    <div className="detail-definition">
                      <span>Resource</span>
                      <strong>{resourceLabels[getEntryResource(selectedEntry)]}</strong>
                    </div>
                    <div className="detail-definition">
                      <span>Document</span>
                      <strong>{selectedEntry.sourceRef.documentSlug ?? 'Open5e'}</strong>
                    </div>
                    <div className="detail-definition">
                      <span>Tags</span>
                      <strong>{selectedEntry.tags.join(', ') || 'None'}</strong>
                    </div>
                  </div>
                  <article className="note-preview">
                    <h3>Summary</h3>
                    <p>{selectedEntry.summary || 'No summary available.'}</p>
                  </article>
                </>
              ) : null}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};
