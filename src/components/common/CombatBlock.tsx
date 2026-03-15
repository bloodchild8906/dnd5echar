import { Character } from '../../domain/models';
import { getArmorClass, getInitiative, summarizeSpeed } from '../../domain/derived';
import { formatModifier } from '../../utils/format';
import { NumberAdjuster } from './NumberAdjuster';
import { TagInput } from './TagInput';
import { Badge } from './Badge';

interface CombatBlockProps {
  character: Character;
  onUpdate: (updater: (c: Character) => Character) => void;
}

export const clampHp = (current: number, max: number, temp: number): number =>
  Math.max(0, Math.min(current, max + temp));

export const CombatBlock = ({ character, onUpdate }: CombatBlockProps) => {
  const { hitPoints, deathSaves, inspiration, resistances, immunities, vulnerabilities } =
    character.combat;

  const isDead = deathSaves.failures >= 3;
  const isStable = deathSaves.successes >= 3;

  const patch = (updater: (c: Character) => Character) => onUpdate(updater);

  return (
    <div className="combat-block">
      <div className="stats-row">
        <div className="stat-tile">
          <span>AC</span>
          <strong>{getArmorClass(character)}</strong>
        </div>
        <div className="stat-tile">
          <span>Initiative</span>
          <strong>{formatModifier(getInitiative(character))}</strong>
        </div>
        <div className="stat-tile">
          <span>Speed</span>
          <strong style={{ fontSize: '0.85em' }}>{summarizeSpeed(character.movement)}</strong>
        </div>
      </div>

      <div className="form-grid form-grid--three">
        <label>
          Max HP
          <input
            className="input"
            type="number"
            min={0}
            value={hitPoints.max}
            onChange={(e) => {
              const max = Math.max(0, parseInt(e.target.value, 10) || 0);
              patch((c) => ({
                ...c,
                combat: {
                  ...c.combat,
                  hitPoints: {
                    ...c.combat.hitPoints,
                    max,
                    current: clampHp(c.combat.hitPoints.current, max, c.combat.hitPoints.temp),
                  },
                },
              }));
            }}
          />
        </label>
        <label>
          Temp HP
          <input
            className="input"
            type="number"
            min={0}
            value={hitPoints.temp}
            onChange={(e) => {
              const temp = Math.max(0, parseInt(e.target.value, 10) || 0);
              patch((c) => ({
                ...c,
                combat: {
                  ...c.combat,
                  hitPoints: {
                    ...c.combat.hitPoints,
                    temp,
                    current: clampHp(c.combat.hitPoints.current, c.combat.hitPoints.max, temp),
                  },
                },
              }));
            }}
          />
        </label>
        <div>
          <NumberAdjuster
            label="Current HP"
            value={hitPoints.current}
            min={0}
            onChange={(value) =>
              patch((c) => ({
                ...c,
                combat: {
                  ...c.combat,
                  hitPoints: {
                    ...c.combat.hitPoints,
                    current: clampHp(value, c.combat.hitPoints.max, c.combat.hitPoints.temp),
                  },
                },
              }))
            }
          />
        </div>
      </div>

      <div className="form-grid form-grid--three">
        <div>
          <span>Death Saves</span>
          <div className="inline-badges">
            {isDead && <Badge tone="warning">Dead</Badge>}
            {isStable && !isDead && <Badge tone="success">Stable</Badge>}
          </div>
          <NumberAdjuster
            label="Successes"
            value={deathSaves.successes}
            min={0}
            onChange={(value) =>
              patch((c) => ({
                ...c,
                combat: {
                  ...c.combat,
                  deathSaves: { ...c.combat.deathSaves, successes: Math.min(3, value) },
                },
              }))
            }
          />
          <NumberAdjuster
            label="Failures"
            value={deathSaves.failures}
            min={0}
            onChange={(value) =>
              patch((c) => ({
                ...c,
                combat: {
                  ...c.combat,
                  deathSaves: { ...c.combat.deathSaves, failures: Math.min(3, value) },
                },
              }))
            }
          />
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={inspiration}
              onChange={(e) =>
                patch((c) => ({
                  ...c,
                  combat: { ...c.combat, inspiration: e.target.checked },
                }))
              }
            />
            {' '}Inspiration
          </label>
        </div>
      </div>

      <TagInput
        label="Resistances"
        values={resistances}
        placeholder="Add resistance"
        onChange={(values) =>
          patch((c) => ({ ...c, combat: { ...c.combat, resistances: values } }))
        }
      />
      <TagInput
        label="Immunities"
        values={immunities}
        placeholder="Add immunity"
        onChange={(values) =>
          patch((c) => ({ ...c, combat: { ...c.combat, immunities: values } }))
        }
      />
      <TagInput
        label="Vulnerabilities"
        values={vulnerabilities}
        placeholder="Add vulnerability"
        onChange={(values) =>
          patch((c) => ({ ...c, combat: { ...c.combat, vulnerabilities: values } }))
        }
      />
    </div>
  );
};
