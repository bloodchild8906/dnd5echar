import { useState } from 'react';
import { inventoryItemSchema, spellPreparationStateSchema } from '../../domain/schemas';
import { createSpellEntry } from '../../domain/seeds';
import { useAppStore } from '../../store/useAppStore';
import { createId } from '../../utils/id';
import { isoNow } from '../../utils/numbers';
import { CompendiumDragPayload, DRAG_MIME } from './DraggableCompendiumEntry';

interface DropZoneProps {
  characterId: string;
  /** 'spell' accepts spell drops; 'item' accepts item drops */
  accepts: 'spell' | 'item';
  children?: React.ReactNode;
}

export const DropZone = ({ characterId, accepts, children }: DropZoneProps) => {
  const addCharacterSpell = useAppStore((s) => s.addCharacterSpell);
  const addCharacterItem = useAppStore((s) => s.addCharacterItem);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(DRAG_MIME)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setDragOver(true);
    }
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setError(null);

    const raw = e.dataTransfer.getData(DRAG_MIME);
    if (!raw) return;

    let payload: CompendiumDragPayload;
    try {
      payload = JSON.parse(raw) as CompendiumDragPayload;
    } catch {
      setError('Invalid drag payload.');
      return;
    }

    if (accepts === 'spell' && payload.entryType === 'spell') {
      const spellEntry = createSpellEntry(payload.data as Parameters<typeof createSpellEntry>[0]);
      const result = spellPreparationStateSchema.safeParse(spellEntry);
      if (!result.success) {
        setError('Spell data failed validation.');
        return;
      }
      addCharacterSpell(characterId, result.data);
    } else if (accepts === 'item' && (payload.entryType === 'item' || payload.entryType === 'generic')) {
      const raw = payload.data as unknown as Record<string, unknown>;
      const item = {
        id: createId('item'),
        name: typeof raw.name === 'string' ? raw.name : 'Unknown Item',
        description: typeof raw.summary === 'string' ? raw.summary : (typeof raw.description === 'string' ? raw.description : ''),
        quantity: 1,
        weight: typeof raw.weight === 'number' ? raw.weight : 0,
        value: { amount: 0, denomination: 'gp' as const },
        rarity: typeof raw.rarity === 'string' ? raw.rarity : 'Common',
        attunementRequired: false,
        attuned: false,
        equipped: false,
        consumable: false,
        tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
        notes: '',
        containerId: null,
        sourceRef: {
          sourceType: 'open5e' as const,
          sourceId: typeof raw.id === 'string' ? raw.id : undefined,
          sourceName: 'Open5e',
          fetchedAt: isoNow(),
        },
      };
      const result = inventoryItemSchema.safeParse(item);
      if (!result.success) {
        setError('Item data failed validation.');
        return;
      }
      addCharacterItem(characterId, result.data);
    } else {
      setError(`Cannot drop a ${payload.entryType} here.`);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={dragOver ? 'dropzone-card dropzone-card--active' : 'dropzone-card'}
      aria-label={`Drop zone for ${accepts}s`}
    >
      {children ?? (
        <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', margin: 0 }}>
          Drag a {accepts} from the compendium to add it here
        </p>
      )}
      {error ? (
        <p role="alert" className="callout" style={{ fontSize: '0.82rem', margin: 0 }}>
          {error}
        </p>
      ) : null}
    </div>
  );
};
