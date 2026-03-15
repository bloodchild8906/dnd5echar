import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { SearchBar } from '../../components/common/SearchBar';
import { SectionCard } from '../../components/common/SectionCard';
import {
  ReferenceCreature,
  ReferenceOption,
  ReferenceResource,
  Spell,
  referenceResources,
} from '../../domain/models';
import { useOpen5eResource } from '../../hooks/useOpen5eResource';
import { useAppStore } from '../../store/useAppStore';

const compendiumResources = referenceResources;

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

const isSpell = (entry: CompendiumEntry): entry is Spell => 'castingTime' in entry;

const isCreature = (entry: CompendiumEntry): entry is ReferenceCreature =>
  'creatureType' in entry && 'challengeRating' in entry && 'stats' in entry;

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
  const [resource, setResource] = useState<ReferenceResource>('spells');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query.trim());
  const resourceResult = useOpen5eResource(resource, {
    document__slug: settings.referenceDocumentFilter,
    search: deferredQuery || undefined,
    limit: 30,
  });

  const entries = useMemo(() => resourceResult.items as CompendiumEntry[], [resourceResult.items]);
  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedId) ?? entries[0] ?? null,
    [entries, selectedId]
  );

  useEffect(() => {
    setSelectedId((current) =>
      entries.some((entry) => entry.id === current) ? current : (entries[0]?.id ?? null)
    );
  }, [entries]);

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
              onClick={() => setResource(entry)}
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
                    entry.id === selectedEntry?.id
                      ? 'compendium-result compendium-result--active'
                      : 'compendium-result'
                  }
                  onClick={() => setSelectedId(entry.id)}
                >
                  <div className="section-inline-header">
                    <strong>{entry.name}</strong>
                    <Badge tone="accent">{resourceLabels[resource]}</Badge>
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
              <div className="inline-badges">
                <Badge tone="accent">{resourceLabels[resource]}</Badge>
                <Badge>{selectedEntry.sourceRef.documentSlug ?? 'Open5e'}</Badge>
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
                      <strong>{resourceLabels[selectedEntry.resource]}</strong>
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
