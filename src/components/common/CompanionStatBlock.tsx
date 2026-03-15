import { Ability, ActorStatBlock, Companion, abilities } from '../../domain/models';
import { getAbilityModifier } from '../../domain/derived';
import { formatModifier } from '../../utils/format';
import { parseNumber } from '../../utils/numbers';

interface CompanionStatBlockProps {
  companion: Companion;
  onUpdate: (updater: (c: Companion) => Companion) => void;
}

const patchStats =
  (patch: Partial<ActorStatBlock>) =>
  (c: Companion): Companion => ({
    ...c,
    stats: { ...c.stats, ...patch },
  });

export const CompanionStatBlock = ({ companion, onUpdate }: CompanionStatBlockProps) => {
  const { stats } = companion;

  return (
    <div className="stack">
      <div className="stats-row">
        {(abilities as readonly Ability[]).map((ability) => {
          const score = stats.abilities[ability].score;
          const mod = getAbilityModifier({ abilityScores: stats.abilities } as never, ability);
          return (
            <div key={ability} className="stat-tile">
              <span>{ability.slice(0, 3).toUpperCase()}</span>
              <input
                className="input input--score"
                type="number"
                value={score}
                aria-label={ability}
                onChange={(e) =>
                  onUpdate((c) => ({
                    ...c,
                    stats: {
                      ...c.stats,
                      abilities: {
                        ...c.stats.abilities,
                        [ability]: { ...c.stats.abilities[ability], score: parseNumber(e.target.value) },
                      },
                    },
                  }))
                }
              />
              <small>{formatModifier(mod)}</small>
            </div>
          );
        })}
      </div>

      <div className="form-grid form-grid--three">
        <label>
          AC
          <input
            className="input"
            type="number"
            value={stats.ac}
            onChange={(e) => onUpdate(patchStats({ ac: parseNumber(e.target.value) }))}
          />
        </label>
        <label>
          HP Max
          <input
            className="input"
            type="number"
            value={stats.hp.max}
            onChange={(e) =>
              onUpdate((c) => ({
                ...c,
                stats: { ...c.stats, hp: { ...c.stats.hp, max: parseNumber(e.target.value) } },
              }))
            }
          />
        </label>
        <label>
          Speed (ft)
          <input
            className="input"
            type="number"
            value={stats.speed.walk}
            onChange={(e) =>
              onUpdate((c) => ({
                ...c,
                stats: { ...c.stats, speed: { ...c.stats.speed, walk: parseNumber(e.target.value) } },
              }))
            }
          />
        </label>
        <label>
          Hit Dice
          <input
            className="input"
            type="text"
            value={stats.hitDice}
            onChange={(e) => onUpdate(patchStats({ hitDice: e.target.value }))}
          />
        </label>
        <label>
          Initiative
          <input
            className="input"
            type="number"
            value={stats.initiative}
            onChange={(e) => onUpdate(patchStats({ initiative: parseNumber(e.target.value) }))}
          />
        </label>
      </div>

      <section>
        <h4>Traits</h4>
        {stats.traits.map((trait, idx) => (
          <div key={trait.id} className="callout">
            <input
              className="input"
              type="text"
              value={trait.name}
              aria-label="Trait name"
              onChange={(e) =>
                onUpdate((c) => ({
                  ...c,
                  stats: {
                    ...c.stats,
                    traits: c.stats.traits.map((t, i) =>
                      i === idx ? { ...t, name: e.target.value } : t
                    ),
                  },
                }))
              }
            />
            <textarea
              className="input"
              value={trait.description}
              aria-label="Trait description"
              onChange={(e) =>
                onUpdate((c) => ({
                  ...c,
                  stats: {
                    ...c.stats,
                    traits: c.stats.traits.map((t, i) =>
                      i === idx ? { ...t, description: e.target.value } : t
                    ),
                  },
                }))
              }
            />
            <button
              type="button"
              className="button button--ghost"
              onClick={() =>
                onUpdate((c) => ({
                  ...c,
                  stats: { ...c.stats, traits: c.stats.traits.filter((_, i) => i !== idx) },
                }))
              }
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="button button--ghost"
          onClick={() =>
            onUpdate((c) => ({
              ...c,
              stats: {
                ...c.stats,
                traits: [
                  ...c.stats.traits,
                  { id: crypto.randomUUID(), name: 'New Trait', description: '' },
                ],
              },
            }))
          }
        >
          + Add Trait
        </button>
      </section>

      <section>
        <h4>Actions</h4>
        {stats.actions.map((action, idx) => (
          <div key={action.id} className="callout">
            <input
              className="input"
              type="text"
              value={action.name}
              aria-label="Action name"
              onChange={(e) =>
                onUpdate((c) => ({
                  ...c,
                  stats: {
                    ...c.stats,
                    actions: c.stats.actions.map((a, i) =>
                      i === idx ? { ...a, name: e.target.value } : a
                    ),
                  },
                }))
              }
            />
            <textarea
              className="input"
              value={action.description}
              aria-label="Action description"
              onChange={(e) =>
                onUpdate((c) => ({
                  ...c,
                  stats: {
                    ...c.stats,
                    actions: c.stats.actions.map((a, i) =>
                      i === idx ? { ...a, description: e.target.value } : a
                    ),
                  },
                }))
              }
            />
            <button
              type="button"
              className="button button--ghost"
              onClick={() =>
                onUpdate((c) => ({
                  ...c,
                  stats: { ...c.stats, actions: c.stats.actions.filter((_, i) => i !== idx) },
                }))
              }
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="button button--ghost"
          onClick={() =>
            onUpdate((c) => ({
              ...c,
              stats: {
                ...c.stats,
                actions: [
                  ...c.stats.actions,
                  { id: crypto.randomUUID(), name: 'New Action', description: '' },
                ],
              },
            }))
          }
        >
          + Add Action
        </button>
      </section>
    </div>
  );
};
