import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
import { Badge } from './Badge';
import { CompendiumShelf } from './CompendiumShelf';
import { CompendiumSearchBar } from './CompendiumSearchBar';
import { DraggableCompendiumEntry } from './DraggableCompendiumEntry';
import { HomebrewBadge } from './HomebrewBadge';
import { LoadingSkeleton } from './LoadingSkeleton';

interface FloatingCompendiumPanelProps {
  open: boolean;
  onClose: () => void;
}

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

const MAX_RECENT_ENTRIES = 20;

const isSpell = (entry: ReferenceEntrySnapshot): entry is Spell => 'castingTime' in entry;
const isCreature = (entry: ReferenceEntrySnapshot): entry is ReferenceCreature =>
  'creatureType' in entry;

const getEntryResource = (entry: ReferenceEntrySnapshot): ReferenceResource => {
  if (isSpell(entry)) return 'spells';
  if (isCreature(entry)) return 'monsters';
  return (entry as ReferenceOption).resource;
};

const createShelfEntry = (entry: ReferenceEntrySnapshot): CompendiumShelfEntry => ({
  entryId: entry.id,
  resource: getEntryResource(entry),
  snapshot: entry,
  savedAt: isoNow(),
});

export const FloatingCompendiumPanel = ({ open, onClose }: FloatingCompendiumPanelProps) => {
  const settings = useAppStore((s) => s.settings);
  const homebrew = useAppStore((s) => s.homebrew);
  const compendiumPreferences = useAppStore((s) => s.uiPreferences.compendium);
  const updateUiPreferences = useAppStore((s) => s.updateUiPreferences);

  const [resource, setResource] = useState<ReferenceResource>('spells');
  const [query, setQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<ReferenceEntrySnapshot | null>(null);

  // Drag state
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: window.innerWidth - 520, y: 80 });
  const [size, setSize] = useState({ w: 480, h: 560 });
  const dragOrigin = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const resizeOrigin = useRef<{ mx: number; my: number; w: number; h: number } | null>(null);

  const resourceResult = useOpen5eResource(resource, {
    document__slug: settings.referenceDocumentFilter,
    search: query || undefined,
    limit: 20,
  });

  // Track recently viewed
  useEffect(() => {
    if (!selectedEntry) return;
    const next = createShelfEntry(selectedEntry);
    updateUiPreferences((ui) => {
      const key = `${next.resource}:${next.entryId}`;
      const filtered = ui.compendium.recentEntries.filter(
        (e) => `${e.resource}:${e.entryId}` !== key
      );
      return {
        ...ui,
        compendium: {
          ...ui.compendium,
          recentEntries: [next, ...filtered].slice(0, MAX_RECENT_ENTRIES),
        },
      };
    });
  }, [selectedEntry, updateUiPreferences]);

  // Global keyboard shortcut: Ctrl+Shift+C
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        if (open) onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    dragOrigin.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    const onMove = (ev: MouseEvent) => {
      if (!dragOrigin.current) return;
      setPos({
        x: dragOrigin.current.px + ev.clientX - dragOrigin.current.mx,
        y: dragOrigin.current.py + ev.clientY - dragOrigin.current.my,
      });
    };
    const onUp = () => {
      dragOrigin.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [pos]);

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    resizeOrigin.current = { mx: e.clientX, my: e.clientY, w: size.w, h: size.h };
    const onMove = (ev: MouseEvent) => {
      if (!resizeOrigin.current) return;
      setSize({
        w: Math.max(360, resizeOrigin.current.w + ev.clientX - resizeOrigin.current.mx),
        h: Math.max(320, resizeOrigin.current.h + ev.clientY - resizeOrigin.current.my),
      });
    };
    const onUp = () => {
      resizeOrigin.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [size]);

  if (!open) return null;

  const homebrewEntries = homebrew.filter(
    (h) =>
      !query ||
      h.name.toLowerCase().includes(query.toLowerCase()) ||
      h.entityType.toLowerCase().includes(query.toLowerCase())
  );

  const panel = (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Floating Compendium Panel"
      aria-modal="false"
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
        zIndex: 9000,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(124,228,219,0.22)',
        borderRadius: 'var(--radius)',
        background: 'var(--panel)',
        backdropFilter: 'blur(16px)',
        boxShadow: 'var(--shadow)',
        overflow: 'hidden',
      }}
    >
      {/* Drag handle / header */}
      <div
        role="toolbar"
        aria-label="Panel controls — drag to reposition"
        onMouseDown={onDragStart}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--line)',
          background: 'rgba(255,255,255,0.02)',
          cursor: 'grab',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <strong style={{ fontSize: '0.95rem' }}>Compendium</strong>
          <Badge tone="accent">{resourceLabels[resource]}</Badge>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ color: 'var(--ink-soft)', fontSize: '0.78rem' }}>Ctrl+Shift+C</span>
          <button
            type="button"
            className="button button--ghost button--small"
            onClick={onClose}
            aria-label="Close compendium panel"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Shelf */}
      <div style={{ padding: '0.75rem 1rem 0', flexShrink: 0 }}>
        <CompendiumShelf
          onSelect={(entry) => {
            setResource(entry.resource);
            setQuery(entry.snapshot.name);
            setSelectedEntry(entry.snapshot);
          }}
        />
      </div>

      {/* Search + resource tabs */}
      <div style={{ padding: '0.5rem 1rem', flexShrink: 0 }}>
        <CompendiumSearchBar
          resource={resource}
          query={query}
          onQueryChange={setQuery}
          loading={resourceResult.loading}
          error={resourceResult.error ?? undefined}
        />
        <div
          className="segmented"
          style={{ marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}
          role="group"
          aria-label="Resource category"
        >
          {referenceResources.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={r === resource}
              aria-label={`Browse ${resourceLabels[r]}`}
              className={r === resource ? 'button button--small' : 'button button--ghost button--small'}
              onClick={() => {
                setResource(r);
                setSelectedEntry(null);
              }}
            >
              {resourceLabels[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem 0.75rem' }}>
        {resourceResult.loading && resourceResult.items.length === 0 ? (
          <LoadingSkeleton rows={3} variant="card" label={`Loading ${resourceLabels[resource].toLowerCase()}…`} />
        ) : null}
        {resourceResult.error ? (
          <p role="alert" style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>{resourceResult.error}</p>
        ) : null}

        {/* Homebrew entries */}
        {homebrewEntries.length > 0 ? (
          <div style={{ marginBottom: '0.75rem' }}>
            <p
              className="eyebrow"
              style={{ marginBottom: '0.5rem', fontSize: '0.72rem' }}
            >
              Homebrew
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {homebrewEntries.map((h) => (
                <div
                  key={h.id}
                  className="compendium-result"
                  style={{ padding: '0.7rem 0.85rem' }}
                >
                  <div className="section-inline-header">
                    <strong style={{ fontSize: '0.9rem' }}>{h.name}</strong>
                    <HomebrewBadge />
                  </div>
                  <p style={{ fontSize: '0.82rem' }}>{h.summary || h.entityType}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Open5e entries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {(resourceResult.items as ReferenceEntrySnapshot[]).map((entry) => (
            <DraggableCompendiumEntry
              key={entry.id}
              entry={entry}
              resource={resource}
              active={selectedEntry?.id === entry.id}
              onClick={() => setSelectedEntry(entry)}
            />
          ))}
        </div>

        {!resourceResult.loading && resourceResult.items.length === 0 && homebrewEntries.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>No results found.</p>
        ) : null}
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={onResizeStart}
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 20,
          height: 20,
          cursor: 'se-resize',
          background:
            'linear-gradient(135deg, transparent 50%, rgba(124,228,219,0.3) 50%)',
          borderBottomRightRadius: 'var(--radius)',
        }}
      />
    </div>
  );

  return createPortal(panel, document.body);
};
