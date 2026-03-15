import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { NumberAdjuster } from '../../components/common/NumberAdjuster';
import { SectionCard } from '../../components/common/SectionCard';
import { TagInput } from '../../components/common/TagInput';
import { Ability, Character, ReferenceOption, abilities, skills } from '../../domain/models';
import { createAction, createTrait } from '../../domain/seeds';
import { useCurrentCharacter } from '../../hooks/useCurrentCharacter';
import { useOpen5eResource } from '../../hooks/useOpen5eResource';
import { useAppStore } from '../../store/useAppStore';
import { formatModifier, titleCase } from '../../utils/format';
import { createId } from '../../utils/id';
import { parseNumber } from '../../utils/numbers';
import {
  POINT_BUY_BUDGET,
  STANDARD_ARRAY,
  assignStandardArrayScore,
  clampPointBuyScore,
  getPointBuyRemaining,
  getPointBuyTotal,
  inferAbilityBuilderMode,
  isStandardArray,
} from './builderMath';

type BuilderStepId =
  | 'profile'
  | 'origins'
  | 'abilities'
  | 'combat'
  | 'loadout'
  | 'story'
  | 'review';

const builderSteps: { id: BuilderStepId; label: string; detail: string }[] = [
  { id: 'profile', label: 'Profile', detail: 'Name, level, alignment, and identity basics.' },
  { id: 'origins', label: 'Origins', detail: 'Pick race, class, background, and subclass.' },
  {
    id: 'abilities',
    label: 'Abilities',
    detail: 'Assign scores by standard array or point buy, then set bonuses.',
  },
  {
    id: 'combat',
    label: 'Combat',
    detail: 'Configure survivability, speed, initiative, and death save state.',
  },
  {
    id: 'loadout',
    label: 'Loadout',
    detail: 'Track proficiencies, quick inventory items, and starting currency.',
  },
  {
    id: 'story',
    label: 'Story',
    detail: 'Capture features, signature actions, and freeform notes.',
  },
  {
    id: 'review',
    label: 'Review',
    detail: 'Confirm the dossier before jumping into the live sheet.',
  },
] as const;

const getOptionSuggestions = (items: ReferenceOption[], value: string): ReferenceOption[] => {
  const normalized = value.trim().toLowerCase();
  const exact = normalized ? items.filter((item) => item.name.toLowerCase() === normalized) : [];
  const partial = normalized
    ? items.filter(
        (item) =>
          item.name.toLowerCase().includes(normalized) &&
          !exact.some((entry) => entry.id === item.id)
      )
    : [];
  const fallback = items.filter(
    (item) =>
      !exact.some((entry) => entry.id === item.id) && !partial.some((entry) => entry.id === item.id)
  );

  return [...exact, ...partial, ...fallback].slice(0, 6);
};

const mapAbilityScores = (
  character: Character,
  updater: (
    ability: Ability,
    current: Character['abilityScores'][Ability]
  ) => Character['abilityScores'][Ability]
): Character['abilityScores'] => {
  const next = { ...character.abilityScores };

  for (const ability of abilities) {
    next[ability] = updater(ability, character.abilityScores[ability]);
  }

  return next;
};

const buildQuickItem = (name: string): Character['inventory']['items'][number] => ({
  id: createId('item'),
  name,
  description: '',
  quantity: 1,
  weight: 0,
  value: { amount: 0, denomination: 'gp' },
  rarity: 'Common',
  attunementRequired: false,
  attuned: false,
  equipped: false,
  consumable: false,
  tags: ['builder'],
  notes: '',
  containerId: null,
  sourceRef: {
    sourceType: 'user-created',
    sourceName: 'Builder Wizard',
  },
});

export const CharacterBuilderPage = () => {
  const navigate = useNavigate();
  const { character } = useCurrentCharacter();
  const updateCharacter = useAppStore((state) => state.updateCharacter);
  const addCharacterItem = useAppStore((state) => state.addCharacterItem);
  const updateCharacterItem = useAppStore((state) => state.updateCharacterItem);
  const removeCharacterItem = useAppStore((state) => state.removeCharacterItem);
  const settings = useAppStore((state) => state.settings);
  const classOptions = useOpen5eResource('classes', {
    document__slug: settings.referenceDocumentFilter,
    limit: 100,
  });
  const raceOptions = useOpen5eResource('races', {
    document__slug: settings.referenceDocumentFilter,
    limit: 100,
  });
  const backgroundOptions = useOpen5eResource('backgrounds', {
    document__slug: settings.referenceDocumentFilter,
    limit: 100,
  });
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [abilityMode, setAbilityMode] = useState<'standard' | 'point-buy'>('point-buy');
  const [quickItemName, setQuickItemName] = useState('');

  useEffect(() => {
    if (!character) {
      return;
    }

    setAbilityMode(
      inferAbilityBuilderMode(abilities.map((ability) => character.abilityScores[ability].score))
    );
    setActiveStepIndex(0);
  }, [character?.id]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeStepIndex]);

  const selectedClass = useMemo(
    () =>
      classOptions.items.find(
        (item) => item.name.toLowerCase() === character?.className.toLowerCase()
      ) ?? null,
    [character?.className, classOptions.items]
  );
  const selectedRace = useMemo(
    () =>
      raceOptions.items.find(
        (item) => item.name.toLowerCase() === character?.raceName.toLowerCase()
      ) ?? null,
    [character?.raceName, raceOptions.items]
  );
  const selectedBackground = useMemo(
    () =>
      backgroundOptions.items.find(
        (item) => item.name.toLowerCase() === character?.backgroundName.toLowerCase()
      ) ?? null,
    [backgroundOptions.items, character?.backgroundName]
  );

  if (!character) {
    return (
      <EmptyState
        title="Character not found"
        description="Pick a character from the dashboard to edit builder details."
      />
    );
  }

  const patchCharacter = (updater: Parameters<typeof updateCharacter>[1]) =>
    updateCharacter(character.id, updater);
  const currentStep = builderSteps[activeStepIndex];
  const abilityScores = abilities.reduce(
    (record, ability) => ({ ...record, [ability]: character.abilityScores[ability].score }),
    {} as Record<Ability, number>
  );
  const abilityScoreValues = abilities.map((ability) => character.abilityScores[ability].score);
  const pointBuySpent = getPointBuyTotal(abilityScoreValues);
  const pointBuyRemaining = getPointBuyRemaining(abilityScoreValues);
  const classSuggestions = getOptionSuggestions(classOptions.items, character.className);
  const raceSuggestions = getOptionSuggestions(raceOptions.items, character.raceName);
  const backgroundSuggestions = getOptionSuggestions(
    backgroundOptions.items,
    character.backgroundName
  );

  const stepValidity: Record<BuilderStepId, boolean> = {
    profile: Boolean(character.name.trim()),
    origins: Boolean(
      character.className.trim() && character.raceName.trim() && character.backgroundName.trim()
    ),
    abilities:
      abilityMode === 'standard'
        ? isStandardArray(abilityScoreValues)
        : pointBuyRemaining >= 0 && pointBuyRemaining <= POINT_BUY_BUDGET,
    combat: character.combat.hitPoints.max > 0,
    loadout: true,
    story: true,
    review: true,
  };

  const goToStep = (index: number) => {
    setActiveStepIndex(Math.max(0, Math.min(builderSteps.length - 1, index)));
  };

  const applyScoreMap = (scores: Record<Ability, number>) => {
    patchCharacter((entry) => ({
      ...entry,
      abilityScores: mapAbilityScores(entry, (ability, current) => ({
        ...current,
        score: scores[ability],
      })),
    }));
  };

  const activateStandardArray = () => {
    setAbilityMode('standard');

    if (!isStandardArray(abilityScoreValues)) {
      applyScoreMap(
        abilities.reduce(
          (record, ability, index) => ({ ...record, [ability]: STANDARD_ARRAY[index] }),
          {} as Record<Ability, number>
        )
      );
    }
  };

  const activatePointBuy = () => {
    setAbilityMode('point-buy');
    applyScoreMap(
      abilities.reduce(
        (record, ability) => ({
          ...record,
          [ability]: clampPointBuyScore(character.abilityScores[ability].score),
        }),
        {} as Record<Ability, number>
      )
    );
  };

  const nextStep = () => {
    if (!stepValidity[currentStep.id]) {
      return;
    }

    if (activeStepIndex === builderSteps.length - 1) {
      navigate(`/characters/${character.id}/sheet`);
      return;
    }

    goToStep(activeStepIndex + 1);
  };

  const renderReferencePicker = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    selected: ReferenceOption | null,
    suggestions: ReferenceOption[],
    loading: boolean,
    error: string | null
  ) => (
    <div className="builder-picker">
      <label>
        {label}
        <input className="input" value={value} onChange={(event) => onChange(event.target.value)} />
      </label>
      {selected?.summary ? <p className="builder-picker__summary">{selected.summary}</p> : null}
      {error ? <p className="callout">{error}</p> : null}
      <div className="reference-picks">
        {loading ? (
          <div className="empty-state">Loading {label.toLowerCase()} references...</div>
        ) : null}
        {!loading
          ? suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                className={
                  item.name === value ? 'reference-card reference-card--active' : 'reference-card'
                }
                onClick={() => onChange(item.name)}
              >
                <strong>{item.name}</strong>
                <span>{item.summary || 'Open5e reference available.'}</span>
              </button>
            ))
          : null}
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'profile':
        return (
          <SectionCard
            title="Identity Profile"
            subtitle="Set the core dossier information that appears throughout the admin workspace."
          >
            <div className="form-grid form-grid--three">
              <label>
                Name
                <input
                  className="input"
                  value={character.name}
                  onChange={(event) =>
                    patchCharacter((entry) => ({ ...entry, name: event.target.value }))
                  }
                />
              </label>
              <label>
                Portrait URL
                <input
                  className="input"
                  value={character.portraitUrl}
                  onChange={(event) =>
                    patchCharacter((entry) => ({ ...entry, portraitUrl: event.target.value }))
                  }
                />
              </label>
              <label>
                Alignment
                <input
                  className="input"
                  value={character.alignment}
                  onChange={(event) =>
                    patchCharacter((entry) => ({ ...entry, alignment: event.target.value }))
                  }
                />
              </label>
              <label>
                Level
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={20}
                  value={character.level}
                  onChange={(event) =>
                    patchCharacter((entry) => ({
                      ...entry,
                      level: parseNumber(event.target.value, 1),
                    }))
                  }
                />
              </label>
              <label>
                Experience
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={character.experience}
                  onChange={(event) =>
                    patchCharacter((entry) => ({
                      ...entry,
                      experience: parseNumber(event.target.value),
                    }))
                  }
                />
              </label>
              <label className="checkbox-field">
                <span>Inspiration Ready</span>
                <input
                  type="checkbox"
                  checked={character.combat.inspiration}
                  onChange={(event) =>
                    patchCharacter((entry) => ({
                      ...entry,
                      combat: { ...entry.combat, inspiration: event.target.checked },
                    }))
                  }
                />
              </label>
            </div>
          </SectionCard>
        );

      case 'origins':
        return (
          <SectionCard
            title="Origins and Training"
            subtitle="Use Open5e references as quick picks, then localize the final fields for your dossier."
          >
            <div className="form-grid">
              {renderReferencePicker(
                'Race',
                character.raceName,
                (value) => patchCharacter((entry) => ({ ...entry, raceName: value })),
                selectedRace,
                raceSuggestions,
                raceOptions.loading,
                raceOptions.error
              )}
              {renderReferencePicker(
                'Class',
                character.className,
                (value) =>
                  patchCharacter((entry) => ({
                    ...entry,
                    className: value,
                    spellbook: {
                      ...entry.spellbook,
                      spellcastingClass: value || entry.spellbook.spellcastingClass,
                    },
                  })),
                selectedClass,
                classSuggestions,
                classOptions.loading,
                classOptions.error
              )}
              {renderReferencePicker(
                'Background',
                character.backgroundName,
                (value) => patchCharacter((entry) => ({ ...entry, backgroundName: value })),
                selectedBackground,
                backgroundSuggestions,
                backgroundOptions.loading,
                backgroundOptions.error
              )}
              <div className="form-grid form-grid--two">
                <label>
                  Subclass
                  <input
                    className="input"
                    value={character.subclassName}
                    onChange={(event) =>
                      patchCharacter((entry) => ({
                        ...entry,
                        subclassName: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Subrace
                  <input
                    className="input"
                    value={character.subraceName}
                    onChange={(event) =>
                      patchCharacter((entry) => ({
                        ...entry,
                        subraceName: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </div>
          </SectionCard>
        );

      case 'abilities':
        return (
          <SectionCard
            title="Ability Assignment"
            subtitle="Use standard array or point buy. Bonus fields can hold racial ASI or manual builder adjustments."
          >
            <div className="segmented">
              <button
                type="button"
                className={abilityMode === 'standard' ? 'button' : 'button button--ghost'}
                onClick={activateStandardArray}
              >
                Standard Array
              </button>
              <button
                type="button"
                className={abilityMode === 'point-buy' ? 'button' : 'button button--ghost'}
                onClick={activatePointBuy}
              >
                Point Buy
              </button>
              {abilityMode === 'standard' ? (
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() =>
                    applyScoreMap(
                      abilities.reduce(
                        (record, ability, index) => ({
                          ...record,
                          [ability]: STANDARD_ARRAY[index],
                        }),
                        {} as Record<Ability, number>
                      )
                    )
                  }
                >
                  Reset Array
                </button>
              ) : (
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() =>
                    applyScoreMap(
                      abilities.reduce(
                        (record, ability) => ({ ...record, [ability]: 8 }),
                        {} as Record<Ability, number>
                      )
                    )
                  }
                >
                  Reset Point Buy
                </button>
              )}
            </div>
            <div className="point-buy-meter">
              <div>
                <span className="eyebrow">Budget</span>
                <strong>
                  {abilityMode === 'point-buy'
                    ? `${pointBuyRemaining} points remaining`
                    : '15 / 14 / 13 / 12 / 10 / 8 assigned'}
                </strong>
              </div>
              {abilityMode === 'point-buy' ? (
                <Badge tone={pointBuyRemaining >= 0 ? 'success' : 'warning'}>
                  {pointBuySpent}/{POINT_BUY_BUDGET} spent
                </Badge>
              ) : null}
            </div>
            <div className="ability-builder-grid">
              {abilities.map((ability) => {
                const current = character.abilityScores[ability];
                const total = current.score + current.bonus + current.temp;

                return (
                  <article key={ability} className="ability-card ability-card--builder">
                    <div className="section-inline-header">
                      <strong>{titleCase(ability)}</strong>
                      <Badge tone="accent">{formatModifier(Math.floor((total - 10) / 2))}</Badge>
                    </div>
                    {abilityMode === 'standard' ? (
                      <label>
                        Array Score
                        <select
                          className="input"
                          value={current.score}
                          onChange={(event) =>
                            applyScoreMap(
                              assignStandardArrayScore(
                                abilityScores,
                                ability,
                                parseNumber(event.target.value, current.score)
                              )
                            )
                          }
                        >
                          {STANDARD_ARRAY.map((score) => (
                            <option key={score} value={score}>
                              {score}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <NumberAdjuster
                        label="Base Score"
                        min={8}
                        value={current.score}
                        onChange={(value) =>
                          patchCharacter((entry) => ({
                            ...entry,
                            abilityScores: mapAbilityScores(entry, (candidate, state) =>
                              candidate === ability
                                ? { ...state, score: clampPointBuyScore(value) }
                                : state
                            ),
                          }))
                        }
                      />
                    )}
                    <label>
                      Bonus / ASI
                      <input
                        className="input"
                        type="number"
                        value={current.bonus}
                        onChange={(event) =>
                          patchCharacter((entry) => ({
                            ...entry,
                            abilityScores: mapAbilityScores(entry, (candidate, state) =>
                              candidate === ability
                                ? { ...state, bonus: parseNumber(event.target.value) }
                                : state
                            ),
                          }))
                        }
                      />
                    </label>
                    <label>
                      Temporary Mod
                      <input
                        className="input"
                        type="number"
                        value={current.temp}
                        onChange={(event) =>
                          patchCharacter((entry) => ({
                            ...entry,
                            abilityScores: mapAbilityScores(entry, (candidate, state) =>
                              candidate === ability
                                ? { ...state, temp: parseNumber(event.target.value) }
                                : state
                            ),
                          }))
                        }
                      />
                    </label>
                    <label className="checkbox-field">
                      <span>Saving Throw Proficiency</span>
                      <input
                        type="checkbox"
                        checked={character.savingThrows[ability].proficient}
                        onChange={(event) =>
                          patchCharacter((entry) => ({
                            ...entry,
                            savingThrows: {
                              ...entry.savingThrows,
                              [ability]: {
                                ...entry.savingThrows[ability],
                                proficient: event.target.checked,
                              },
                            },
                          }))
                        }
                      />
                    </label>
                    <div className="sheet-chip">
                      Final total: <strong>{total}</strong>
                    </div>
                  </article>
                );
              })}
            </div>
          </SectionCard>
        );

      case 'combat':
        return (
          <SectionCard
            title="Combat Readiness"
            subtitle="Set survivability, movement, initiative, and death-save state before opening the live sheet."
          >
            <div className="form-grid form-grid--four">
              <label>
                Base AC
                <input
                  className="input"
                  type="number"
                  value={character.combat.baseArmorClass}
                  onChange={(event) =>
                    patchCharacter((entry) => ({
                      ...entry,
                      combat: {
                        ...entry.combat,
                        baseArmorClass: parseNumber(event.target.value, 10),
                      },
                    }))
                  }
                />
              </label>
              <label>
                Initiative Bonus
                <input
                  className="input"
                  type="number"
                  value={character.combat.initiativeBonus}
                  onChange={(event) =>
                    patchCharacter((entry) => ({
                      ...entry,
                      combat: {
                        ...entry.combat,
                        initiativeBonus: parseNumber(event.target.value),
                      },
                    }))
                  }
                />
              </label>
              <label>
                Max HP
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={character.combat.hitPoints.max}
                  onChange={(event) =>
                    patchCharacter((entry) => ({
                      ...entry,
                      combat: {
                        ...entry.combat,
                        hitPoints: {
                          ...entry.combat.hitPoints,
                          max: parseNumber(event.target.value, 1),
                        },
                      },
                    }))
                  }
                />
              </label>
              <label>
                Current HP
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={character.combat.hitPoints.current}
                  onChange={(event) =>
                    patchCharacter((entry) => ({
                      ...entry,
                      combat: {
                        ...entry.combat,
                        hitPoints: {
                          ...entry.combat.hitPoints,
                          current: parseNumber(event.target.value),
                        },
                      },
                    }))
                  }
                />
              </label>
              <label>
                Temp HP
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={character.combat.hitPoints.temp}
                  onChange={(event) =>
                    patchCharacter((entry) => ({
                      ...entry,
                      combat: {
                        ...entry.combat,
                        hitPoints: {
                          ...entry.combat.hitPoints,
                          temp: parseNumber(event.target.value),
                        },
                      },
                    }))
                  }
                />
              </label>
              <label>
                Hit Dice
                <input
                  className="input"
                  value={character.combat.hitDice}
                  onChange={(event) =>
                    patchCharacter((entry) => ({
                      ...entry,
                      combat: { ...entry.combat, hitDice: event.target.value },
                    }))
                  }
                />
              </label>
              <label>
                Walk Speed
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={character.movement.walk}
                  onChange={(event) =>
                    patchCharacter((entry) => ({
                      ...entry,
                      movement: { ...entry.movement, walk: parseNumber(event.target.value) },
                    }))
                  }
                />
              </label>
              <label>
                Fly Speed
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={character.movement.fly ?? ''}
                  onChange={(event) =>
                    patchCharacter((entry) => ({
                      ...entry,
                      movement: {
                        ...entry.movement,
                        fly:
                          event.target.value === '' ? undefined : parseNumber(event.target.value),
                      },
                    }))
                  }
                />
              </label>
              <label>
                Death Successes
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={3}
                  value={character.combat.deathSaves.successes}
                  onChange={(event) =>
                    patchCharacter((entry) => ({
                      ...entry,
                      combat: {
                        ...entry.combat,
                        deathSaves: {
                          ...entry.combat.deathSaves,
                          successes: Math.min(3, parseNumber(event.target.value)),
                        },
                      },
                    }))
                  }
                />
              </label>
              <label>
                Death Failures
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={3}
                  value={character.combat.deathSaves.failures}
                  onChange={(event) =>
                    patchCharacter((entry) => ({
                      ...entry,
                      combat: {
                        ...entry.combat,
                        deathSaves: {
                          ...entry.combat.deathSaves,
                          failures: Math.min(3, parseNumber(event.target.value)),
                        },
                      },
                    }))
                  }
                />
              </label>
            </div>
          </SectionCard>
        );

      case 'loadout':
        return (
          <>
            <SectionCard
              title="Proficiencies and States"
              subtitle="Track languages, senses, conditions, and skill proficiency directly in the wizard."
            >
              <div className="form-grid form-grid--three">
                <TagInput
                  label="Languages"
                  values={character.languages}
                  onChange={(values) =>
                    patchCharacter((entry) => ({ ...entry, languages: values }))
                  }
                />
                <TagInput
                  label="Senses"
                  values={character.senses}
                  onChange={(values) => patchCharacter((entry) => ({ ...entry, senses: values }))}
                />
                <TagInput
                  label="Conditions"
                  values={character.conditions}
                  onChange={(values) =>
                    patchCharacter((entry) => ({ ...entry, conditions: values }))
                  }
                />
              </div>
              <div className="skill-grid">
                {skills.map((skill) => (
                  <div key={skill} className="skill-row">
                    <strong>{titleCase(skill)}</strong>
                    <select
                      className="input"
                      value={character.skills[skill].proficiency}
                      onChange={(event) =>
                        patchCharacter((entry) => ({
                          ...entry,
                          skills: {
                            ...entry.skills,
                            [skill]: {
                              ...entry.skills[skill],
                              proficiency: event.target
                                .value as Character['skills'][typeof skill]['proficiency'],
                            },
                          },
                        }))
                      }
                    >
                      <option value="none">None</option>
                      <option value="proficient">Proficient</option>
                      <option value="expertise">Expertise</option>
                    </select>
                    <input
                      className="input"
                      type="number"
                      value={character.skills[skill].bonus}
                      onChange={(event) =>
                        patchCharacter((entry) => ({
                          ...entry,
                          skills: {
                            ...entry.skills,
                            [skill]: {
                              ...entry.skills[skill],
                              bonus: parseNumber(event.target.value),
                            },
                          },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Starting Loadout"
              subtitle="Capture quick builder equipment here, then use the Inventory route for full detail."
            >
              <div className="toolbar">
                <input
                  className="input"
                  value={quickItemName}
                  placeholder="Add starting item by name"
                  onChange={(event) => setQuickItemName(event.target.value)}
                />
                <button
                  type="button"
                  className="button"
                  disabled={!quickItemName.trim()}
                  onClick={() => {
                    addCharacterItem(character.id, buildQuickItem(quickItemName.trim()));
                    setQuickItemName('');
                  }}
                >
                  Add Item
                </button>
              </div>
              <div className="inventory-inline-list">
                {character.inventory.items.map((item) => (
                  <article key={item.id} className="inventory-inline-row">
                    <input
                      className="input"
                      value={item.name}
                      onChange={(event) =>
                        updateCharacterItem(character.id, item.id, (entry) => ({
                          ...entry,
                          name: event.target.value,
                        }))
                      }
                    />
                    <input
                      className="input"
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) =>
                        updateCharacterItem(character.id, item.id, (entry) => ({
                          ...entry,
                          quantity: Math.max(1, parseNumber(event.target.value, 1)),
                        }))
                      }
                    />
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={item.weight}
                      onChange={(event) =>
                        updateCharacterItem(character.id, item.id, (entry) => ({
                          ...entry,
                          weight: parseNumber(event.target.value),
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="button button--ghost button--danger"
                      onClick={() => removeCharacterItem(character.id, item.id)}
                    >
                      Remove
                    </button>
                  </article>
                ))}
                {character.inventory.items.length === 0 ? (
                  <div className="empty-state">No starting items added yet.</div>
                ) : null}
              </div>
              <div className="form-grid form-grid--five compact-grid">
                {(['cp', 'sp', 'ep', 'gp', 'pp'] as const).map((coin) => (
                  <label key={coin}>
                    {coin.toUpperCase()}
                    <input
                      className="input"
                      type="number"
                      value={character.currency[coin]}
                      onChange={(event) =>
                        patchCharacter((entry) => ({
                          ...entry,
                          currency: {
                            ...entry.currency,
                            [coin]: parseNumber(event.target.value),
                          },
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
            </SectionCard>
          </>
        );

      case 'story':
        return (
          <>
            <SectionCard
              title="Features and Traits"
              subtitle="Record class features, heritage traits, and background callouts."
            >
              <div className="section-inline-header">
                <h3>Feature Blocks</h3>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() =>
                    patchCharacter((entry) => ({
                      ...entry,
                      features: [...entry.features, createTrait()],
                    }))
                  }
                >
                  Add Feature
                </button>
              </div>
              <div className="stack-list">
                {character.features.map((feature) => (
                  <article key={feature.id} className="stacked-editor">
                    <input
                      className="input"
                      value={feature.name}
                      onChange={(event) =>
                        patchCharacter((entry) => ({
                          ...entry,
                          features: entry.features.map((current) =>
                            current.id === feature.id
                              ? { ...current, name: event.target.value }
                              : current
                          ),
                        }))
                      }
                    />
                    <textarea
                      className="textarea"
                      rows={3}
                      value={feature.description}
                      onChange={(event) =>
                        patchCharacter((entry) => ({
                          ...entry,
                          features: entry.features.map((current) =>
                            current.id === feature.id
                              ? { ...current, description: event.target.value }
                              : current
                          ),
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="button button--ghost button--danger"
                      onClick={() =>
                        patchCharacter((entry) => ({
                          ...entry,
                          features: entry.features.filter((current) => current.id !== feature.id),
                        }))
                      }
                    >
                      Remove
                    </button>
                  </article>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Actions and Backstory"
              subtitle="Capture signature attacks and the freeform notes that make the dossier playable."
            >
              <div className="section-inline-header">
                <h3>Action Blocks</h3>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() =>
                    patchCharacter((entry) => ({
                      ...entry,
                      actions: [...entry.actions, createAction()],
                    }))
                  }
                >
                  Add Action
                </button>
              </div>
              <div className="stack-list">
                {character.actions.map((action) => (
                  <article key={action.id} className="stacked-editor">
                    <input
                      className="input"
                      value={action.name}
                      onChange={(event) =>
                        patchCharacter((entry) => ({
                          ...entry,
                          actions: entry.actions.map((current) =>
                            current.id === action.id
                              ? { ...current, name: event.target.value }
                              : current
                          ),
                        }))
                      }
                    />
                    <textarea
                      className="textarea"
                      rows={3}
                      value={action.description}
                      onChange={(event) =>
                        patchCharacter((entry) => ({
                          ...entry,
                          actions: entry.actions.map((current) =>
                            current.id === action.id
                              ? { ...current, description: event.target.value }
                              : current
                          ),
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="button button--ghost button--danger"
                      onClick={() =>
                        patchCharacter((entry) => ({
                          ...entry,
                          actions: entry.actions.filter((current) => current.id !== action.id),
                        }))
                      }
                    >
                      Remove
                    </button>
                  </article>
                ))}
              </div>
              <div className="form-grid">
                <label>
                  Backstory and Personality Notes
                  <textarea
                    className="textarea"
                    rows={5}
                    value={character.notes}
                    onChange={(event) =>
                      patchCharacter((entry) => ({ ...entry, notes: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Feature and Play Notes
                  <textarea
                    className="textarea"
                    rows={5}
                    value={character.featureNotes}
                    onChange={(event) =>
                      patchCharacter((entry) => ({ ...entry, featureNotes: event.target.value }))
                    }
                  />
                </label>
              </div>
            </SectionCard>
          </>
        );

      case 'review':
        return (
          <SectionCard
            title="Review Dossier"
            subtitle="This summary is the final checkpoint before opening the live character sheet."
          >
            <div className="review-grid">
              <article className="review-card">
                <h3>Identity</h3>
                <p>
                  <strong>{character.name}</strong>
                </p>
                <p>
                  Level {character.level} {character.className}
                  {character.subclassName ? ` - ${character.subclassName}` : ''}
                </p>
                <p>
                  {character.raceName}
                  {character.subraceName ? ` (${character.subraceName})` : ''} -{' '}
                  {character.backgroundName}
                </p>
                <p>{character.alignment}</p>
              </article>
              <article className="review-card">
                <h3>Abilities</h3>
                <div className="inline-badges">
                  {abilities.map((ability) => {
                    const entry = character.abilityScores[ability];
                    const total = entry.score + entry.bonus + entry.temp;
                    return (
                      <Badge key={ability} tone="accent">
                        {titleCase(ability)} {total} ({formatModifier(Math.floor((total - 10) / 2))}
                        )
                      </Badge>
                    );
                  })}
                </div>
                <p>
                  {abilityMode === 'point-buy'
                    ? `${pointBuySpent}/${POINT_BUY_BUDGET} points spent`
                    : 'Standard array assigned'}
                </p>
              </article>
              <article className="review-card">
                <h3>Combat</h3>
                <p>
                  AC {character.combat.baseArmorClass}, HP {character.combat.hitPoints.current}/
                  {character.combat.hitPoints.max}, Init{' '}
                  {formatModifier(character.combat.initiativeBonus)}
                </p>
                <p>Speed {character.movement.walk} ft.</p>
                <p>
                  Death saves: {character.combat.deathSaves.successes} success /{' '}
                  {character.combat.deathSaves.failures} fail
                </p>
              </article>
              <article className="review-card">
                <h3>Loadout</h3>
                <p>{character.inventory.items.length} starting items captured</p>
                <p>
                  {character.languages.length} languages, {character.senses.length} senses,{' '}
                  {character.conditions.length} active conditions
                </p>
                <p>
                  {character.features.length} features and {character.actions.length} actions
                </p>
              </article>
            </div>
            <div className="stack-list">
              <article className="review-card">
                <h3>Reference Snapshots</h3>
                <div className="stacked-editor stacked-editor--compact">
                  <strong>Race</strong>
                  <p>{selectedRace?.summary || 'No Open5e summary available.'}</p>
                </div>
                <div className="stacked-editor stacked-editor--compact">
                  <strong>Class</strong>
                  <p>{selectedClass?.summary || 'No Open5e summary available.'}</p>
                </div>
                <div className="stacked-editor stacked-editor--compact">
                  <strong>Background</strong>
                  <p>{selectedBackground?.summary || 'No Open5e summary available.'}</p>
                </div>
              </article>
            </div>
          </SectionCard>
        );
    }
  };

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Builder Wizard</p>
          <h1>{character.name}</h1>
          <p>{currentStep.detail}</p>
        </div>
        <div className="button-row">
          <button
            type="button"
            className="button button--ghost"
            onClick={() => navigate(`/characters/${character.id}/sheet`)}
          >
            Open Live Sheet
          </button>
        </div>
      </section>

      <section className="wizard-stepper" aria-label="Builder steps">
        {builderSteps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            className={[
              'wizard-step',
              index === activeStepIndex ? 'wizard-step--active' : '',
              stepValidity[step.id] && index < activeStepIndex ? 'wizard-step--complete' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => goToStep(index)}
          >
            <span className="wizard-step__index">{index + 1}</span>
            <span className="wizard-step__copy">
              <strong>{step.label}</strong>
              <span>{step.detail}</span>
            </span>
          </button>
        ))}
      </section>

      {renderStepContent()}

      <section className="wizard-footer">
        <div className="wizard-footer__progress">
          <span className="eyebrow">Step {activeStepIndex + 1}</span>
          <strong>
            {currentStep.label} of {builderSteps.length}
          </strong>
          <p>{currentStep.detail}</p>
        </div>
        <div className="button-row">
          <button
            type="button"
            className="button button--ghost"
            disabled={activeStepIndex === 0}
            onClick={() => goToStep(activeStepIndex - 1)}
          >
            Back
          </button>
          <button
            type="button"
            className="button"
            disabled={!stepValidity[currentStep.id]}
            onClick={nextStep}
          >
            {activeStepIndex === builderSteps.length - 1 ? 'Finish and Open Sheet' : 'Next Step'}
          </button>
        </div>
      </section>
    </div>
  );
};
