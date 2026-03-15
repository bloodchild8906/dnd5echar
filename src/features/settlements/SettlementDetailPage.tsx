import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { InteractiveMapSection } from '../../components/common/InteractiveMapSection';
import { EmptyState } from '../../components/common/EmptyState';
import { MapPin, Settlement, SettlementSection } from '../../domain/models';
import { useAppStore } from '../../store/useAppStore';
import { hasSupabaseConfig } from '../../config/env';
import { collaborationService } from '../../services/supabase/collaborationService';

// ─── SettlementSectionCard ────────────────────────────────────────────────────

interface SettlementSectionCardProps {
  section: SettlementSection;
  isActive: boolean;
  onUpdate: (updater: (s: SettlementSection) => SettlementSection) => void;
}

const SettlementSectionCard = ({ section, isActive, onUpdate }: SettlementSectionCardProps) => {
  const [localTitle, setLocalTitle] = useState(section.title);
  const [localBody, setLocalBody] = useState(section.body);
  const [newEntry, setNewEntry] = useState('');
  const titleDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when section changes from outside
  useEffect(() => {
    setLocalTitle(section.title);
  }, [section.title]);

  useEffect(() => {
    setLocalBody(section.body);
  }, [section.body]);

  const handleTitleChange = (value: string) => {
    setLocalTitle(value);
    if (titleDebounce.current) clearTimeout(titleDebounce.current);
    titleDebounce.current = setTimeout(() => {
      onUpdate((s) => ({ ...s, title: value }));
    }, 400);
  };

  const handleBodyChange = (value: string) => {
    setLocalBody(value);
    if (bodyDebounce.current) clearTimeout(bodyDebounce.current);
    bodyDebounce.current = setTimeout(() => {
      onUpdate((s) => ({ ...s, body: value }));
    }, 400);
  };

  const handleAddEntry = () => {
    const trimmed = newEntry.trim();
    if (!trimmed) return;
    onUpdate((s) => ({ ...s, entries: [...s.entries, trimmed] }));
    setNewEntry('');
  };

  const handleRemoveEntry = (idx: number) => {
    onUpdate((s) => ({ ...s, entries: s.entries.filter((_, i) => i !== idx) }));
  };

  if (!isActive) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.3rem' }}>
          Section Title
        </label>
        <input
          className="input"
          value={localTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          aria-label="Section title"
        />
      </div>
      <div>
        <label style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.3rem' }}>
          Body
        </label>
        <textarea
          className="textarea"
          rows={5}
          value={localBody}
          onChange={(e) => handleBodyChange(e.target.value)}
          aria-label="Section body"
          style={{ resize: 'vertical' }}
        />
      </div>
      <div>
        <label style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.3rem' }}>
          Entries
        </label>
        {section.entries.length > 0 ? (
          <div className="stack-list" style={{ marginBottom: '0.6rem' }}>
            {section.entries.map((entry, idx) => (
              <div
                key={idx}
                className="list-button"
                style={{ cursor: 'default', justifyContent: 'space-between' }}
              >
                <span style={{ fontSize: '0.85rem' }}>{entry}</span>
                <button
                  type="button"
                  className="button button--ghost button--small button--danger"
                  onClick={() => handleRemoveEntry(idx)}
                  aria-label={`Remove entry: ${entry}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginBottom: '0.6rem' }}>
            No entries yet.
          </p>
        )}
        <div className="button-row">
          <input
            className="input"
            placeholder="Add entry…"
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddEntry();
              }
            }}
            aria-label="New entry text"
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="button button--small"
            onClick={handleAddEntry}
            disabled={!newEntry.trim()}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── SettlementDetailPage ─────────────────────────────────────────────────────

export const SettlementDetailPage = () => {
  const { settlementId } = useParams<{ settlementId: string }>();
  const navigate = useNavigate();

  const settlements = useAppStore((s) => s.settlements);
  const updateSettlementSection = useAppStore((s) => s.updateSettlementSection);
  const addMapPin = useAppStore((s) => s.addMapPin);
  const removeMapPin = useAppStore((s) => s.removeMapPin);
  const publishSettlement = useAppStore((s) => s.publishSettlement);

  const settlement: Settlement | undefined = settlements.find((s) => s.id === settlementId);

  const [activeTab, setActiveTab] = useState(0);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'done' | 'error'>('idle');
  const [publishError, setPublishError] = useState('');

  const handleSectionUpdate = useCallback(
    (sectionId: string, updater: (s: SettlementSection) => SettlementSection) => {
      if (!settlementId) return;
      updateSettlementSection(settlementId, sectionId, updater);
    },
    [settlementId, updateSettlementSection]
  );

  const handleAddPin = useCallback(
    (x: number, y: number) => {
      if (!settlementId) return;
      addMapPin(settlementId, { x, y, label: '', notes: '' });
    },
    [settlementId, addMapPin]
  );

  const handleRemovePin = useCallback(
    (pinId: string) => {
      if (!settlementId) return;
      removeMapPin(settlementId, pinId);
    },
    [settlementId, removeMapPin]
  );

  const handleUpdatePin = useCallback(
    (pinId: string, updates: Partial<MapPin>) => {
      if (!settlementId || !settlement) return;
      // Update pin via addMapPin pattern — we use updateSettlementSection indirectly
      // by replacing the pin in the store via a direct store update approach.
      // Since there's no updateMapPin action, we remove and re-add with updated data.
      const existing = settlement.mapPins.find((p) => p.id === pinId);
      if (!existing) return;
      removeMapPin(settlementId, pinId);
      addMapPin(settlementId, { ...existing, ...updates, id: pinId });
    },
    [settlementId, settlement, removeMapPin, addMapPin]
  );

  const handlePublish = async () => {
    if (!settlement) return;
    setPublishStatus('publishing');
    setPublishError('');
    try {
      publishSettlement(settlement.id);
      if (hasSupabaseConfig()) {
        await collaborationService.publishSettlementToSupabase({
          ...settlement,
          published: true,
        });
      }
      setPublishStatus('done');
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Failed to publish settlement.');
      setPublishStatus('error');
    }
  };

  if (!settlement) {
    return (
      <div className="page-stack">
        <section className="page-header">
          <div>
            <p className="eyebrow">Settlements</p>
            <h1>Settlement Not Found</h1>
          </div>
        </section>
        <EmptyState
          title="Settlement not found"
          description="This settlement may have been deleted or the link is invalid."
        />
        <button
          type="button"
          className="button button--ghost button--small"
          onClick={() => void navigate('/settlements')}
        >
          Back to Settlements
        </button>
      </div>
    );
  }

  const sortedSections = [...settlement.sections].sort((a, b) => a.order - b.order);
  const activeSection = sortedSections[activeTab];
  const locationSection = sortedSections.find((s) =>
    s.title.toLowerCase().includes('location')
  );

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Settlements</p>
          <h1>{settlement.name}</h1>
          {settlement.description ? <p>{settlement.description}</p> : null}
        </div>
        <div className="button-row">
          <button
            type="button"
            className="button button--ghost button--small"
            onClick={() => void navigate('/settlements')}
          >
            ← Back
          </button>
          {!settlement.published ? (
            <button
              type="button"
              className="button button--small"
              onClick={() => void handlePublish()}
              disabled={publishStatus === 'publishing'}
            >
              {publishStatus === 'publishing' ? 'Publishing…' : 'Publish to Compendium'}
            </button>
          ) : (
            <span className="status-pill status-pill--accent">Published</span>
          )}
        </div>
      </section>

      {publishStatus === 'done' && !settlement.published ? (
        <div role="status" style={{ color: 'var(--success)', fontSize: '0.9rem' }}>
          Settlement published successfully.
        </div>
      ) : null}
      {publishStatus === 'error' ? (
        <div role="alert" className="callout">
          {publishError}
        </div>
      ) : null}

      {/* Section tabs */}
      <div className="character-tabs">
        {sortedSections.map((section, idx) => (
          <button
            key={section.id}
            type="button"
            className={idx === activeTab ? 'tab-link tab-link--active' : 'tab-link'}
            onClick={() => setActiveTab(idx)}
          >
            {section.title}
          </button>
        ))}
      </div>

      {/* Active section content */}
      {activeSection ? (
        <div
          className="section-card"
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <header className="section-card__header">
            <div>
              <h2>{activeSection.title}</h2>
            </div>
          </header>
          <div className="section-card__body">
            <SettlementSectionCard
              key={activeSection.id}
              section={activeSection}
              isActive
              onUpdate={(updater) => handleSectionUpdate(activeSection.id, updater)}
            />
          </div>
        </div>
      ) : null}

      {/* Interactive map — always visible below sections */}
      <div className="section-card">
        <header className="section-card__header">
          <div>
            <h2>Map</h2>
            <p>Click the map to place pins. Select a pin to edit its label and notes.</p>
          </div>
        </header>
        <div className="section-card__body">
          <InteractiveMapSection
            mapPins={settlement.mapPins}
            locationSection={locationSection}
            onAddPin={handleAddPin}
            onRemovePin={handleRemovePin}
            onUpdatePin={handleUpdatePin}
          />
        </div>
      </div>
    </div>
  );
};
