import { useRef, useState } from 'react';
import { MapPin, SettlementSection } from '../../domain/models';

interface InteractiveMapSectionProps {
  mapPins: MapPin[];
  locationSection?: SettlementSection;
  onAddPin: (x: number, y: number) => void;
  onRemovePin: (pinId: string) => void;
  onUpdatePin: (pinId: string, updates: Partial<MapPin>) => void;
}

export const InteractiveMapSection = ({
  mapPins,
  locationSection,
  onAddPin,
  onRemovePin,
  onUpdatePin,
}: InteractiveMapSectionProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

  const selectedPin = mapPins.find((p) => p.id === selectedPinId) ?? null;

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    // Don't place a pin if clicking on an existing pin
    if ((e.target as SVGElement).closest('circle')) return;

    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    onAddPin(
      Math.round(Math.max(0, Math.min(100, x)) * 10) / 10,
      Math.round(Math.max(0, Math.min(100, y)) * 10) / 10
    );
  };

  const handlePinClick = (e: React.MouseEvent, pinId: string) => {
    e.stopPropagation();
    setSelectedPinId((current) => (current === pinId ? null : pinId));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div
        style={{
          position: 'relative',
          border: '1px solid var(--line)',
          borderRadius: '12px',
          overflow: 'hidden',
          background: 'rgba(9, 19, 34, 0.92)',
        }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 100 60"
          style={{ width: '100%', display: 'block', cursor: 'crosshair', minHeight: '240px' }}
          onClick={handleSvgClick}
          aria-label="Interactive settlement map — click to place a pin"
          role="img"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="map-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="rgba(151,178,215,0.08)"
                strokeWidth="0.3"
              />
            </pattern>
          </defs>
          <rect width="100" height="60" fill="url(#map-grid)" />

          {/* Map pins */}
          {mapPins.map((pin) => (
            <g key={pin.id} onClick={(e) => handlePinClick(e, pin.id)} style={{ cursor: 'pointer' }}>
              <circle
                cx={pin.x}
                cy={pin.y}
                r={selectedPinId === pin.id ? 2.2 : 1.8}
                fill={selectedPinId === pin.id ? 'var(--accent)' : '#f0b55f'}
                stroke={selectedPinId === pin.id ? 'var(--accent-soft)' : 'rgba(255,255,255,0.4)'}
                strokeWidth="0.4"
              />
              <title>{pin.label || 'Unnamed pin'}{pin.notes ? ` — ${pin.notes}` : ''}</title>
              {pin.label ? (
                <text
                  x={pin.x}
                  y={pin.y - 2.8}
                  textAnchor="middle"
                  fontSize="2.2"
                  fill="var(--ink)"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {pin.label}
                </text>
              ) : null}
            </g>
          ))}
        </svg>
        <p
          style={{
            position: 'absolute',
            bottom: '0.5rem',
            right: '0.75rem',
            fontSize: '0.75rem',
            color: 'var(--ink-soft)',
            margin: 0,
            pointerEvents: 'none',
          }}
        >
          Click map to place pin
        </p>
      </div>

      {/* Pin editor */}
      {selectedPin ? (
        <div
          style={{
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '1rem',
            background: 'rgba(13,23,39,0.86)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.9rem' }}>Edit Pin</strong>
            <button
              type="button"
              className="button button--ghost button--small button--danger"
              onClick={() => {
                onRemovePin(selectedPin.id);
                setSelectedPinId(null);
              }}
            >
              Remove
            </button>
          </div>
          <input
            className="input"
            placeholder="Pin label"
            value={selectedPin.label}
            onChange={(e) => onUpdatePin(selectedPin.id, { label: e.target.value })}
            aria-label="Pin label"
          />
          <input
            className="input"
            placeholder="Notes"
            value={selectedPin.notes}
            onChange={(e) => onUpdatePin(selectedPin.id, { notes: e.target.value })}
            aria-label="Pin notes"
          />
          {locationSection && locationSection.entries.length > 0 ? (
            <select
              className="input"
              value={selectedPin.linkedSectionId ?? ''}
              onChange={(e) =>
                onUpdatePin(selectedPin.id, {
                  linkedSectionId: e.target.value || undefined,
                })
              }
              aria-label="Link to location entry"
            >
              <option value="">No linked location</option>
              {locationSection.entries.map((entry, idx) => (
                <option key={idx} value={`${locationSection.id}:${idx}`}>
                  {entry}
                </option>
              ))}
            </select>
          ) : null}
          <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', margin: 0 }}>
            Position: ({selectedPin.x.toFixed(1)}%, {selectedPin.y.toFixed(1)}%)
          </p>
        </div>
      ) : null}

      {/* Pin list */}
      {mapPins.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', margin: 0 }}>
            {mapPins.length} pin(s) — click a pin on the map or select below
          </p>
          <div className="stack-list">
            {mapPins.map((pin) => (
              <button
                key={pin.id}
                type="button"
                className={selectedPinId === pin.id ? 'list-button list-button--active' : 'list-button'}
                onClick={() => setSelectedPinId((c) => (c === pin.id ? null : pin.id))}
              >
                <span style={{ fontSize: '0.85rem' }}>{pin.label || 'Unnamed pin'}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                  ({pin.x.toFixed(1)}%, {pin.y.toFixed(1)}%)
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
