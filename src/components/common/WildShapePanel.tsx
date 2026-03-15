import { Character, WildShapeForm } from '../../domain/models';
import { compareFormToCharacter } from '../../domain/derived';
import { Badge } from './Badge';
import { parseNumber } from '../../utils/numbers';

interface WildShapePanelProps {
  character: Character;
  selectedForm: WildShapeForm | null;
  onActivate: (formId: string) => void;
  onRevert: () => void;
  onUpdateHp: (delta: number) => void;
  onUpdateForm: (formId: string, updater: (f: WildShapeForm) => WildShapeForm) => void;
  onRemoveForm: (formId: string) => void;
}

export const WildShapePanel = ({
  character,
  selectedForm,
  onActivate,
  onRevert,
  onUpdateHp,
  onUpdateForm,
  onRemoveForm,
}: WildShapePanelProps) => {
  const activeForm = character.wildShapes.activeForm;
  const isActive = selectedForm ? activeForm?.formId === selectedForm.id : false;
  const comparison =
    character && selectedForm ? compareFormToCharacter(character, selectedForm) : null;

  if (!selectedForm) return null;

  return (
    <div className="stack">
      {isActive && activeForm ? (
        <div className="callout">
          <div className="stats-row stats-row--dense">
            <Badge tone="success">Active — {activeForm.currentHp} HP</Badge>
            <div className="button-row">
              <button
                type="button"
                className="button button--ghost"
                aria-label="Decrease wild shape HP"
                onClick={() => onUpdateHp(-1)}
              >
                −1
              </button>
              <button
                type="button"
                className="button button--ghost"
                aria-label="Increase wild shape HP"
                onClick={() => onUpdateHp(1)}
              >
                +1
              </button>
              <button type="button" className="button button--ghost" onClick={onRevert}>
                Revert
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {comparison ? (
        <div className="stats-row stats-row--dense">
          <div className="sheet-chip">Base AC {comparison.baseAc} → Form AC {comparison.formAc}</div>
          <div className="sheet-chip">
            Speed {comparison.baseSpeed} → {comparison.formSpeed} ft
          </div>
          <div className="sheet-chip">
            Int {comparison.baseMental.intelligence} / Wis {comparison.baseMental.wisdom} / Cha{' '}
            {comparison.baseMental.charisma} retained
          </div>
        </div>
      ) : null}

      <div className="form-grid form-grid--three">
        <label>
          Name
          <input
            className="input"
            value={selectedForm.name}
            onChange={(e) => onUpdateForm(selectedForm.id, (f) => ({ ...f, name: e.target.value }))}
          />
        </label>
        <label>
          Size
          <input
            className="input"
            value={selectedForm.size}
            onChange={(e) => onUpdateForm(selectedForm.id, (f) => ({ ...f, size: e.target.value }))}
          />
        </label>
        <label>
          CR
          <input
            className="input"
            value={selectedForm.challengeRating}
            onChange={(e) =>
              onUpdateForm(selectedForm.id, (f) => ({ ...f, challengeRating: e.target.value }))
            }
          />
        </label>
        <label>
          AC
          <input
            className="input"
            type="number"
            value={selectedForm.stats.ac}
            onChange={(e) =>
              onUpdateForm(selectedForm.id, (f) => ({
                ...f,
                stats: { ...f.stats, ac: parseNumber(e.target.value) },
              }))
            }
          />
        </label>
        <label>
          Max HP
          <input
            className="input"
            type="number"
            value={selectedForm.stats.hp.max}
            onChange={(e) =>
              onUpdateForm(selectedForm.id, (f) => ({
                ...f,
                stats: { ...f.stats, hp: { ...f.stats.hp, max: parseNumber(e.target.value) } },
              }))
            }
          />
        </label>
        <label className="checkbox-field">
          <span>Favorite</span>
          <input
            type="checkbox"
            checked={selectedForm.favorite}
            onChange={(e) =>
              onUpdateForm(selectedForm.id, (f) => ({ ...f, favorite: e.target.checked }))
            }
          />
        </label>
      </div>

      <div className="button-row">
        {!isActive ? (
          <button
            type="button"
            className="button"
            onClick={() => onActivate(selectedForm.id)}
          >
            Activate Form
          </button>
        ) : null}
        {isActive ? (
          <button type="button" className="button button--ghost" onClick={onRevert}>
            Revert to Character
          </button>
        ) : null}
        <button
          type="button"
          className="button button--ghost button--danger"
          onClick={() => onRemoveForm(selectedForm.id)}
        >
          Delete Form
        </button>
      </div>
    </div>
  );
};
