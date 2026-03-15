import { Character, PolymorphState } from '../../domain/models';
import { Badge } from './Badge';
import { NumberAdjuster } from './NumberAdjuster';

interface PolymorphOverlayProps {
  character: Character;
  onUpdateHp: (delta: number) => void;
  onClear: () => void;
}

export const PolymorphOverlay = ({ character, onUpdateHp, onClear }: PolymorphOverlayProps) => {
  const polymorph: PolymorphState | null | undefined = character.activePolymorph;
  if (!polymorph) return null;

  return (
    <div className="callout" role="region" aria-label="Active polymorph overlay">
      <div className="section-inline-header">
        <h3>Polymorph Active</h3>
        <Badge tone="accent">Polymorphed</Badge>
      </div>

      <NumberAdjuster
        label="Polymorph HP"
        value={polymorph.currentHp}
        min={0}
        onChange={(val) => onUpdateHp(val - polymorph.currentHp)}
      />

      <div className="stats-row stats-row--dense">
        <div className="sheet-chip">Source: {polymorph.sourceCreatureId}</div>
        <div className="sheet-chip">Revert HP: {polymorph.revertHp}</div>
      </div>

      <button type="button" className="button button--ghost" onClick={onClear}>
        End Polymorph (restore {polymorph.revertHp} HP)
      </button>
    </div>
  );
};
