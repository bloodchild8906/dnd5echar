import { useState } from 'react';
import { Companion } from '../../domain/models';
import { Badge } from './Badge';
import { NumberAdjuster } from './NumberAdjuster';

interface CompanionCardProps {
  companion: Companion;
  onUpdate: (updater: (c: Companion) => Companion) => void;
  children?: React.ReactNode;
}

export const CompanionCard = ({ companion, onUpdate, children }: CompanionCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const hp = companion.stats.hp;
  const hpPercent = hp.max > 0 ? Math.round((hp.current / hp.max) * 100) : 0;
  const hpTone = hpPercent > 50 ? 'success' : hpPercent > 25 ? 'warning' : 'warning';

  return (
    <div className="section-card">
      <div className="section-card__header">
        <div className="section-card__title-row">
          <h3>{companion.name}</h3>
          <div className="button-row">
            <Badge tone="accent">{companion.type}</Badge>
            <Badge tone={hpTone}>
              {hp.current}/{hp.max} HP
            </Badge>
            <button
              type="button"
              className="button button--ghost"
              aria-expanded={expanded}
              aria-label={expanded ? 'Collapse companion' : 'Expand companion'}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? '▲' : '▼'}
            </button>
          </div>
        </div>
        <NumberAdjuster
          label="HP"
          value={hp.current}
          min={0}
          onChange={(val) =>
            onUpdate((c) => ({
              ...c,
              stats: { ...c.stats, hp: { ...c.stats.hp, current: Math.min(val, hp.max + hp.temp) } },
            }))
          }
        />
      </div>
      {expanded ? <div className="section-card__body">{children}</div> : null}
    </div>
  );
};
