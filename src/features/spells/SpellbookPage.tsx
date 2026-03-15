import { useMemo, useState } from 'react';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { SearchBar } from '../../components/common/SearchBar';
import { SectionCard } from '../../components/common/SectionCard';
import { CharacterTabs } from '../../components/layout/CharacterTabs';
import { getAbilityModifier, getSpellAttackBonus, getSpellSaveDc } from '../../domain/derived';
import { SpellPreparationState } from '../../domain/models';
import { createBlankSpell, createSpellEntry } from '../../domain/seeds';
import { getMergedHomebrewData } from '../../domain/derived';
import { useCurrentCharacter } from '../../hooks/useCurrentCharacter';
import { useOpen5eResource } from '../../hooks/useOpen5eResource';
import { useAppStore } from '../../store/useAppStore';
import { formatModifier } from '../../utils/format';
import { isoNow, parseNumber } from '../../utils/numbers';

const views = [
  'all',
  'known',
  'prepared',
  'favorites',
  'ritual',
  'concentration',
  'combat',
] as const;

const buildOverride = (value: string) =>
  value === ''
    ? undefined
    : { value: parseNumber(value), reason: 'Manual override', updatedAt: isoNow() };

export const SpellbookPage = () => {
  const { character } = useCurrentCharacter();
  const updateCharacter = useAppStore((state) => state.updateCharacter);
  const addCharacterSpell = useAppStore((state) => state.addCharacterSpell);
  const updateCharacterSpell = useAppStore((state) => state.updateCharacterSpell);
  const updateSpellSlot = useAppStore((state) => state.updateSpellSlot);
  const updatePactMagic = useAppStore((state) => state.updatePactMagic);
  const settings = useAppStore((state) => state.settings);
  const homebrewSpells = useAppStore((state) =>
    state.homebrew.filter((entry) => entry.entityType === 'spell')
  );
  const [search, setSearch] = useState('');
  const [referenceSearch, setReferenceSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [view, setView] = useState<(typeof views)[number]>('prepared');

  const referenceSpells = useOpen5eResource('spells', {
    document__slug: settings.referenceDocumentFilter,
    search: referenceSearch,
    limit: 24,
  });

  if (!character) {
    return (
      <EmptyState title="Character not found" description="Select a character to manage spells." />
    );
  }

  const patch = (updater: Parameters<typeof updateCharacter>[1]) =>
    updateCharacter(character.id, updater);
  const allOwnedSpells = [
    ...character.spellbook.spells,
    ...character.spellbook.innateSpells,
    ...character.spellbook.itemGrantedSpells,
  ];

  const filteredSpells = allOwnedSpells.filter((entry) => {
    const matchesSearch = !search || entry.spell.name.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = !levelFilter || entry.spell.level === parseNumber(levelFilter);
    const matchesSchool =
      !schoolFilter || entry.spell.school.toLowerCase() === schoolFilter.toLowerCase();

    const matchesView = (() => {
      switch (view) {
        case 'known':
          return entry.known;
        case 'prepared':
          return entry.prepared || entry.alwaysPrepared;
        case 'favorites':
          return entry.pinned;
        case 'ritual':
          return entry.spell.ritual;
        case 'concentration':
          return entry.spell.concentration;
        case 'combat':
          return entry.pinned || entry.prepared || entry.spell.level === 0;
        case 'all':
        default:
          return true;
      }
    })();

    return matchesSearch && matchesLevel && matchesSchool && matchesView;
  });

  const filteredReferenceSpells = referenceSpells.items.filter((spell) => {
    const matchesLevel = !levelFilter || spell.level === parseNumber(levelFilter);
    const matchesSchool =
      !schoolFilter || spell.school.toLowerCase() === schoolFilter.toLowerCase();
    const matchesClass =
      !classFilter ||
      spell.classes.some((entry) => entry.toLowerCase().includes(classFilter.toLowerCase()));
    return matchesLevel && matchesSchool && matchesClass;
  });

  const addSpell = (entry: SpellPreparationState) => addCharacterSpell(character.id, entry);

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Spellbook</p>
          <h1>{character.name}</h1>
          <p>
            Prepared-state toggles, live slots, pact magic, favorite casting view, and local
            homebrew support.
          </p>
        </div>
      </section>

      <CharacterTabs characterId={character.id} />

      <SectionCard
        title="Spellcasting Summary"
        subtitle="Derived values can be overridden when table rulings or items change them."
      >
        <div className="form-grid form-grid--four">
          <label>
            Spellcasting Ability
            <select
              className="input"
              value={character.spellbook.spellcastingAbility}
              onChange={(event) =>
                patch((entry) => ({
                  ...entry,
                  spellbook: {
                    ...entry.spellbook,
                    spellcastingAbility: event.target
                      .value as typeof entry.spellbook.spellcastingAbility,
                  },
                }))
              }
            >
              <option value="intelligence">Intelligence</option>
              <option value="wisdom">Wisdom</option>
              <option value="charisma">Charisma</option>
            </select>
          </label>
          <label>
            Save DC Override
            <input
              className="input"
              type="number"
              placeholder={`${getSpellSaveDc(character)}`}
              value={character.spellbook.overrides.saveDc?.value ?? ''}
              onChange={(event) =>
                patch((entry) => ({
                  ...entry,
                  spellbook: {
                    ...entry.spellbook,
                    overrides: {
                      ...entry.spellbook.overrides,
                      saveDc: buildOverride(event.target.value),
                    },
                  },
                }))
              }
            />
          </label>
          <label>
            Attack Override
            <input
              className="input"
              type="number"
              placeholder={`${getSpellAttackBonus(character)}`}
              value={character.spellbook.overrides.attackBonus?.value ?? ''}
              onChange={(event) =>
                patch((entry) => ({
                  ...entry,
                  spellbook: {
                    ...entry.spellbook,
                    overrides: {
                      ...entry.spellbook.overrides,
                      attackBonus: buildOverride(event.target.value),
                    },
                  },
                }))
              }
            />
          </label>
          <label>
            Multiclass Summary
            <input
              className="input"
              value={character.spellbook.multiclassSummary}
              onChange={(event) =>
                patch((entry) => ({
                  ...entry,
                  spellbook: { ...entry.spellbook, multiclassSummary: event.target.value },
                }))
              }
            />
          </label>
        </div>
        <div className="stats-row stats-row--dense">
          <div className="sheet-chip">
            Ability Mod:{' '}
            {formatModifier(getAbilityModifier(character, character.spellbook.spellcastingAbility))}
          </div>
          <div className="sheet-chip">Spell Save DC: {getSpellSaveDc(character)}</div>
          <div className="sheet-chip">
            Spell Attack: {formatModifier(getSpellAttackBonus(character))}
          </div>
        </div>
        <div className="slot-grid">
          {character.spellbook.slots.map((slot) => (
            <div key={slot.level} className="slot-card">
              <strong>Level {slot.level}</strong>
              <div className="slot-card__controls">
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() =>
                    updateSpellSlot(character.id, slot.level, (current) => ({
                      ...current,
                      used: Math.max(0, current.used - 1),
                    }))
                  }
                >
                  -
                </button>
                <span>
                  {Math.max(0, slot.max - slot.used)} / {slot.max}
                </span>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() =>
                    updateSpellSlot(character.id, slot.level, (current) => ({
                      ...current,
                      used: Math.min(current.max, current.used + 1),
                    }))
                  }
                >
                  +
                </button>
              </div>
              <input
                className="input"
                type="number"
                value={slot.max}
                onChange={(event) =>
                  updateSpellSlot(character.id, slot.level, (current) => ({
                    ...current,
                    max: parseNumber(event.target.value),
                  }))
                }
              />
            </div>
          ))}
        </div>
        <div className="form-grid form-grid--four">
          <label className="checkbox-field">
            <span>Pact Magic</span>
            <input
              type="checkbox"
              checked={character.spellbook.pactMagic.enabled}
              onChange={(event) =>
                updatePactMagic(character.id, (current) => ({
                  ...current,
                  enabled: event.target.checked,
                }))
              }
            />
          </label>
          <label>
            Pact Slot Level
            <input
              className="input"
              type="number"
              min={1}
              max={9}
              value={character.spellbook.pactMagic.slotLevel}
              onChange={(event) =>
                updatePactMagic(character.id, (current) => ({
                  ...current,
                  slotLevel: parseNumber(event.target.value, 1),
                }))
              }
            />
          </label>
          <label>
            Pact Slots
            <input
              className="input"
              type="number"
              min={0}
              value={character.spellbook.pactMagic.slots}
              onChange={(event) =>
                updatePactMagic(character.id, (current) => ({
                  ...current,
                  slots: parseNumber(event.target.value),
                }))
              }
            />
          </label>
          <label>
            Pact Used
            <input
              className="input"
              type="number"
              min={0}
              value={character.spellbook.pactMagic.used}
              onChange={(event) =>
                updatePactMagic(character.id, (current) => ({
                  ...current,
                  used: parseNumber(event.target.value),
                }))
              }
            />
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title="Play View"
        actions={
          <div className="segmented">
            {views.map((entry) => (
              <button
                key={entry}
                type="button"
                className={view === entry ? 'button' : 'button button--ghost'}
                onClick={() => setView(entry)}
              >
                {entry}
              </button>
            ))}
          </div>
        }
      >
        <div className="toolbar">
          <SearchBar value={search} placeholder="Search owned spells" onChange={setSearch} />
          <select
            className="input"
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value)}
          >
            <option value="">All levels</option>
            {Array.from({ length: 10 }, (_, index) => (
              <option key={index} value={index}>
                {index === 0 ? 'Cantrip' : `Level ${index}`}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="School"
            value={schoolFilter}
            onChange={(event) => setSchoolFilter(event.target.value)}
          />
          <button
            type="button"
            className="button button--ghost"
            onClick={() =>
              addSpell({
                ...createSpellEntry(createBlankSpell('Custom Spell')),
                sourceKind: 'custom',
                sourceLabel: 'Custom',
              })
            }
          >
            Add Custom Spell
          </button>
        </div>
        <div className="stack-list">
          {filteredSpells.map((entry) => (
            <article key={entry.id} className="spell-card">
              <div className="spell-card__main">
                <div>
                  <h3>{entry.spell.name}</h3>
                  <p>
                    Level {entry.spell.level} {entry.spell.school} - {entry.sourceLabel}
                  </p>
                  <div className="inline-badges">
                    {entry.spell.concentration ? <Badge tone="warning">Concentration</Badge> : null}
                    {entry.spell.ritual ? <Badge tone="accent">Ritual</Badge> : null}
                    {entry.alwaysPrepared ? <Badge tone="success">Always Prepared</Badge> : null}
                  </div>
                </div>
                <div className="spell-card__controls">
                  <label className="checkbox-field">
                    <span>Known</span>
                    <input
                      type="checkbox"
                      checked={entry.known}
                      onChange={(event) =>
                        updateCharacterSpell(character.id, entry.id, (current) => ({
                          ...current,
                          known: event.target.checked,
                        }))
                      }
                    />
                  </label>
                  <label className="checkbox-field">
                    <span>Prepared</span>
                    <input
                      type="checkbox"
                      checked={entry.prepared}
                      onChange={(event) =>
                        updateCharacterSpell(character.id, entry.id, (current) => ({
                          ...current,
                          prepared: event.target.checked,
                        }))
                      }
                    />
                  </label>
                  <label className="checkbox-field">
                    <span>Always</span>
                    <input
                      type="checkbox"
                      checked={entry.alwaysPrepared}
                      onChange={(event) =>
                        updateCharacterSpell(character.id, entry.id, (current) => ({
                          ...current,
                          alwaysPrepared: event.target.checked,
                        }))
                      }
                    />
                  </label>
                  <label className="checkbox-field">
                    <span>Favorite</span>
                    <input
                      type="checkbox"
                      checked={entry.pinned}
                      onChange={(event) =>
                        updateCharacterSpell(character.id, entry.id, (current) => ({
                          ...current,
                          pinned: event.target.checked,
                        }))
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() =>
                      updateCharacterSpell(character.id, entry.id, (current) => ({
                        ...current,
                        castCount: Math.max(0, current.castCount - 1),
                      }))
                    }
                  >
                    - Cast
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() =>
                      updateCharacterSpell(character.id, entry.id, (current) => ({
                        ...current,
                        castCount: current.castCount + 1,
                      }))
                    }
                  >
                    + Cast
                  </button>
                </div>
              </div>
              <p>{entry.spell.description}</p>
              <textarea
                className="textarea"
                rows={2}
                value={entry.notes}
                placeholder="Spell notes"
                onChange={(event) =>
                  updateCharacterSpell(character.id, entry.id, (current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
              />
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Reference Browser"
        subtitle="Open5e SRD spells remain canonical reference records until you add a local spell entry."
      >
        <div className="toolbar">
          <SearchBar
            value={referenceSearch}
            placeholder="Search Open5e spells"
            onChange={setReferenceSearch}
          />
          <input
            className="input"
            value={classFilter}
            placeholder="Class filter"
            onChange={(event) => setClassFilter(event.target.value)}
          />
        </div>
        {referenceSpells.error ? <p className="callout">{referenceSpells.error}</p> : null}
        <div className="stack-list">
          {filteredReferenceSpells.map((spell) => (
            <article key={spell.id} className="spell-card spell-card--compact">
              <div>
                <h3>{spell.name}</h3>
                <p>
                  Level {spell.level} {spell.school} - {spell.classes.join(', ')}
                </p>
              </div>
              <div className="button-row">
                <button
                  type="button"
                  className="button"
                  onClick={() =>
                    addSpell({
                      ...createSpellEntry(spell),
                      spell,
                      sourceKind: 'class',
                      sourceLabel: character.className,
                      known: true,
                      prepared: spell.level === 0,
                    })
                  }
                >
                  Add to Spellbook
                </button>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Homebrew and Special Sources">
        <div className="button-row">
          <button
            type="button"
            className="button button--ghost"
            onClick={() =>
              patch((entry) => ({
                ...entry,
                spellbook: {
                  ...entry.spellbook,
                  innateSpells: [
                    ...entry.spellbook.innateSpells,
                    {
                      ...createSpellEntry(createBlankSpell('Innate Spell')),
                      sourceKind: 'innate',
                      sourceLabel: 'Innate',
                      known: true,
                      alwaysPrepared: true,
                    },
                  ],
                },
              }))
            }
          >
            Add Innate Spell
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={() =>
              patch((entry) => ({
                ...entry,
                spellbook: {
                  ...entry.spellbook,
                  itemGrantedSpells: [
                    ...entry.spellbook.itemGrantedSpells,
                    {
                      ...createSpellEntry(createBlankSpell('Item Spell')),
                      sourceKind: 'item',
                      sourceLabel: 'Item',
                      known: true,
                    },
                  ],
                },
              }))
            }
          >
            Add Item Spell
          </button>
        </div>
        <div className="stack-list">
          {homebrewSpells.map((entry) => {
            const merged = getMergedHomebrewData<Record<string, unknown>>(entry);
            const spell = {
              ...createBlankSpell(entry.name),
              id: entry.id,
              name: String(merged.name ?? entry.name),
              level: Number(merged.level ?? 0),
              school: String(merged.school ?? 'Custom'),
              castingTime: String(merged.castingTime ?? '1 action'),
              range: String(merged.range ?? 'Self'),
              duration: String(merged.duration ?? 'Instantaneous'),
              description: String(merged.description ?? entry.summary),
              sourceRef: entry.sourceRef,
            };

            return (
              <article key={entry.id} className="spell-card spell-card--compact">
                <div>
                  <h3>{spell.name}</h3>
                  <p>{entry.summary}</p>
                </div>
                <button
                  type="button"
                  className="button"
                  onClick={() =>
                    addSpell({
                      ...createSpellEntry(spell),
                      sourceKind: 'homebrew',
                      sourceLabel: 'Homebrew',
                      known: true,
                    })
                  }
                >
                  Add Homebrew Spell
                </button>
              </article>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
};
