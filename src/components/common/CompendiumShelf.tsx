import { CompendiumShelfEntry, ReferenceResource } from '../../domain/models';
import { useAppStore } from '../../store/useAppStore';

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

interface CompendiumShelfProps {
  onSelect: (entry: CompendiumShelfEntry) => void;
}

export const CompendiumShelf = ({ onSelect }: CompendiumShelfProps) => {
  const pinnedEntries = useAppStore((s) => s.uiPreferences.compendium.pinnedEntries);
  const updateUiPreferences = useAppStore((s) => s.updateUiPreferences);

  const unpin = (entryId: string, resource: ReferenceResource) => {
    updateUiPreferences((ui) => ({
      ...ui,
      compendium: {
        ...ui.compendium,
        pinnedEntries: ui.compendium.pinnedEntries.filter(
          (e) => !(e.entryId === entryId && e.resource === resource)
        ),
      },
    }));
  };

  if (pinnedEntries.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <p className="eyebrow" style={{ fontSize: '0.72rem' }}>
        Pinned
      </p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.4rem',
        }}
      >
        {pinnedEntries.map((entry) => (
          <div
            key={`${entry.resource}:${entry.entryId}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.35rem 0.6rem',
              border: '1px solid rgba(124,228,219,0.22)',
              borderRadius: '999px',
              background: 'rgba(51,203,191,0.1)',
              fontSize: '0.82rem',
            }}
          >
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--ink)',
                cursor: 'pointer',
                fontWeight: 700,
              }}
              onClick={() => onSelect(entry)}
              aria-label={`Open ${entry.snapshot.name}`}
            >
              {entry.snapshot.name}
            </button>
            <span style={{ color: 'var(--ink-soft)', fontSize: '0.75rem' }}>
              {resourceLabels[entry.resource]}
            </span>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                padding: '0 0.1rem',
                color: 'var(--ink-soft)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                lineHeight: 1,
              }}
              onClick={() => unpin(entry.entryId, entry.resource)}
              aria-label={`Unpin ${entry.snapshot.name}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
