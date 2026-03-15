import { Character } from '../../domain/models';
import { compareFormToCharacter } from '../../domain/derived';
import { Badge } from './Badge';
import { NumberAdjuster } from './NumberAdjuster';

interface BeastFormOverlayProps {
  character: Character;
  onUpdateHp: (delta: number) => void;
  onRevert: () => void;
}

export const BeastFormOverlay = ({ character, onUpdateHp, onRevert }: BeastFormOverlayProps) => {
  const activeForm = character.wildShapes.activeForm;
  if (!activeForm) return null;

  const form = character.wildShapes.forms.find((f) => f.id === activeForm.formId);
  const comparison = form ? compareFormToCharacter(character, form) : null;

  return (
    <div className="callout" role="region" aria-label="Active wild shape overlay">
      <div className="section-inline-header">
        <h3>{form?.name ?? 'Wild Shape'}</h3>
        <Badge tone="success">Active</Badge>
      </div>

      <NumberAdjuster
        label="Form HP"
        value={activeForm.currentHp}
        min={0}
        onChange={(val) => onUpdateHp(val - activeForm.currentHp)}
      />

      {comparison ? (
        <div className="stats-row stats-row--dense">
          <div className="sheet-chip">AC {comparison.formAc}</div>
          <div className="sheet-chip">Speed {comparison.formSpeed} ft</div>
          <div className="sheet-chip">
            Int {comparison.baseMental.intelligence} / Wis {comparison.baseMental.wisdom} / Cha{' '}
            {comparison.baseMental.charisma}
          </div>
        </div>
      ) : null}

      <button type="button" className="button button--ghost" onClick={onRevert}>
        Revert to Character (restore {activeForm.revertHp} HP)
      </button>
    </div>
  );
};
