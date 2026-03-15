import { ReferenceCreature, ReferenceEntrySnapshot, ReferenceOption, ReferenceResource, Spell } from '../../domain/models';
import { Badge } from './Badge';

export interface CompendiumDragPayload {
  entryType: 'spell' | 'item' | 'creature' | 'generic';
  resource: ReferenceResource;
  data: ReferenceEntrySnapshot;
}

const DRAG_MIME = 'application/x-compendium-entry';

const isSpell = (entry: ReferenceEntrySnapshot): entry is Spell => 'castingTime' in entry;
const isCreature = (entry: ReferenceEntrySnapshot): entry is ReferenceCreature =>
  'creatureType' in entry;

const getEntryType = (entry: ReferenceEntrySnapshot): CompendiumDragPayload['entryType'] => {
  if (isSpell(entry)) return 'spell';
  if (isCreature(entry)) return 'creature';
  const opt = entry as ReferenceOption;
  if (opt.resource === 'weapons' || opt.resource === 'armor' || opt.resource === 'magicitems') {
    return 'item';
  }
  return 'generic';
};

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

const getEntryBody = (entry: ReferenceEntrySnapshot): string => {
  if (isSpell(entry)) return entry.description;
  if (isCreature(entry)) return entry.description;
  return (entry as ReferenceOption).summary || '';
};

interface DraggableCompendiumEntryProps {
  entry: ReferenceEntrySnapshot;
  resource: ReferenceResource;
  active?: boolean;
  onClick?: () => void;
}

export const DraggableCompendiumEntry = ({
  entry,
  resource,
  active,
  onClick,
}: DraggableCompendiumEntryProps) => {
  const payload: CompendiumDragPayload = {
    entryType: getEntryType(entry),
    resource,
    data: entry,
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData(DRAG_MIME, JSON.stringify(payload));
      }}
      role="button"
      tabIndex={0}
      aria-pressed={active}
      className={active ? 'compendium-result compendium-result--active' : 'compendium-result'}
      style={{ cursor: 'grab' }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.();
      }}
    >
      <div className="section-inline-header">
        <strong style={{ fontSize: '0.9rem' }}>{entry.name}</strong>
        <Badge tone="accent">{resourceLabels[resource]}</Badge>
      </div>
      <p style={{ fontSize: '0.82rem' }}>{getEntryBody(entry).slice(0, 120) || 'No description.'}</p>
    </div>
  );
};

export { DRAG_MIME };
