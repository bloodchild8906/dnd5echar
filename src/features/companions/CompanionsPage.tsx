import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../../components/common/EmptyState';
import { SearchBar } from '../../components/common/SearchBar';
import { SectionCard } from '../../components/common/SectionCard';
import { TagInput } from '../../components/common/TagInput';
import { CharacterTabs } from '../../components/layout/CharacterTabs';
import { createAction, createSpellEntry } from '../../domain/seeds';
import { useCurrentCharacter } from '../../hooks/useCurrentCharacter';
import { useOpen5eResource } from '../../hooks/useOpen5eResource';
import { creatureToCompanion } from '../../services/open5e/normalizers';
import { useAppStore } from '../../store/useAppStore';
import { parseNumber } from '../../utils/numbers';

export const CompanionsPage = () => {
  const { character, companions } = useCurrentCharacter();
  const createCompanion = useAppStore((state) => state.createCompanion);
  const updateCompanion = useAppStore((state) => state.updateCompanion);
  const deleteCompanion = useAppStore((state) => state.deleteCompanion);
  const addCompanionItem = useAppStore((state) => state.addCompanionItem);
  const updateCompanionItem = useAppStore((state) => state.updateCompanionItem);
  const removeCompanionItem = useAppStore((state) => state.removeCompanionItem);
  const addCompanionSpell = useAppStore((state) => state.addCompanionSpell);
  const updateCompanionSpell = useAppStore((state) => state.updateCompanionSpell);
  const settings = useAppStore((state) => state.settings);
  const [selectedId, setSelectedId] = useState<string | null>(companions[0]?.id ?? null);
  const [referenceSearch, setReferenceSearch] = useState('');

  const referenceCreatures = useOpen5eResource('monsters', {
    document__slug: settings.referenceDocumentFilter,
    search: referenceSearch,
    limit: 12,
  });

  useEffect(() => {
    const nextSelectedId =
      selectedId && companions.some((entry) => entry.id === selectedId)
        ? selectedId
        : (companions[0]?.id ?? null);

    if (nextSelectedId !== selectedId) {
      setSelectedId(nextSelectedId);
    }
  }, [companions, selectedId]);

  const selectedCompanion = useMemo(
    () => companions.find((entry) => entry.id === selectedId) ?? null,
    [companions, selectedId]
  );

  if (!character) {
    return (
      <EmptyState
        title="Character not found"
        description="Open a character to manage companions."
      />
    );
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Companions</p>
          <h1>{character.name}</h1>
          <p>
            Manage pets, familiars, summons, mounts, and linked follower sheets as first-class
            entities.
          </p>
        </div>
      </section>

      <CharacterTabs characterId={character.id} />

      <div className="split-layout split-layout--sidebar">
        <SectionCard
          title="Roster"
          actions={
            <button
              type="button"
              className="button"
              onClick={() => setSelectedId(createCompanion(character.id))}
            >
              New Companion
            </button>
          }
        >
          <div className="stack-list">
            {companions.map((companion) => (
              <button
                key={companion.id}
                type="button"
                className={
                  selectedId === companion.id ? 'list-button list-button--active' : 'list-button'
                }
                onClick={() => setSelectedId(companion.id)}
              >
                <strong>{companion.name}</strong>
                <span>{companion.type}</span>
              </button>
            ))}
          </div>
          <div className="toolbar">
            <SearchBar
              value={referenceSearch}
              placeholder="Search Open5e creatures"
              onChange={setReferenceSearch}
            />
          </div>
          <div className="stack-list">
            {referenceCreatures.items.map((creature) => (
              <article key={creature.id} className="spell-card spell-card--compact">
                <div>
                  <h3>{creature.name}</h3>
                  <p>
                    {creature.size} {creature.creatureType} - CR {creature.challengeRating}
                  </p>
                </div>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() =>
                    setSelectedId(
                      createCompanion(character.id, creatureToCompanion(creature, character.id))
                    )
                  }
                >
                  Clone
                </button>
              </article>
            ))}
          </div>
        </SectionCard>

        {selectedCompanion ? (
          <SectionCard
            title={selectedCompanion.name}
            subtitle="Linked to the parent character, but editable independently."
          >
            <div className="form-grid form-grid--three">
              <label>
                Name
                <input
                  className="input"
                  value={selectedCompanion.name}
                  onChange={(event) =>
                    updateCompanion(selectedCompanion.id, (entry) => ({
                      ...entry,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Type
                <select
                  className="input"
                  value={selectedCompanion.type}
                  onChange={(event) =>
                    updateCompanion(selectedCompanion.id, (entry) => ({
                      ...entry,
                      type: event.target.value as typeof entry.type,
                    }))
                  }
                >
                  <option value="pet">Pet</option>
                  <option value="familiar">Familiar</option>
                  <option value="summoned">Summoned</option>
                  <option value="mount">Mount</option>
                  <option value="npc-follower">NPC Follower</option>
                </select>
              </label>
              <label>
                Initiative
                <input
                  className="input"
                  type="number"
                  value={selectedCompanion.initiative}
                  onChange={(event) =>
                    updateCompanion(selectedCompanion.id, (entry) => ({
                      ...entry,
                      initiative: parseNumber(event.target.value),
                      stats: { ...entry.stats, initiative: parseNumber(event.target.value) },
                    }))
                  }
                />
              </label>
              <label>
                AC
                <input
                  className="input"
                  type="number"
                  value={selectedCompanion.stats.ac}
                  onChange={(event) =>
                    updateCompanion(selectedCompanion.id, (entry) => ({
                      ...entry,
                      stats: { ...entry.stats, ac: parseNumber(event.target.value) },
                    }))
                  }
                />
              </label>
              <label>
                Max HP
                <input
                  className="input"
                  type="number"
                  value={selectedCompanion.stats.hp.max}
                  onChange={(event) =>
                    updateCompanion(selectedCompanion.id, (entry) => ({
                      ...entry,
                      stats: {
                        ...entry.stats,
                        hp: { ...entry.stats.hp, max: parseNumber(event.target.value) },
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
                  value={selectedCompanion.stats.hp.current}
                  onChange={(event) =>
                    updateCompanion(selectedCompanion.id, (entry) => ({
                      ...entry,
                      stats: {
                        ...entry.stats,
                        hp: { ...entry.stats.hp, current: parseNumber(event.target.value) },
                      },
                    }))
                  }
                />
              </label>
            </div>
            <TagInput
              label="Relationship Tags"
              values={selectedCompanion.tags}
              onChange={(values) =>
                updateCompanion(selectedCompanion.id, (entry) => ({ ...entry, tags: values }))
              }
            />
            <div className="ability-grid">
              {(
                [
                  'strength',
                  'dexterity',
                  'constitution',
                  'intelligence',
                  'wisdom',
                  'charisma',
                ] as const
              ).map((ability) => (
                <label key={ability}>
                  {ability.slice(0, 3).toUpperCase()}
                  <input
                    className="input"
                    type="number"
                    value={selectedCompanion.stats.abilities[ability].score}
                    onChange={(event) =>
                      updateCompanion(selectedCompanion.id, (entry) => ({
                        ...entry,
                        stats: {
                          ...entry.stats,
                          abilities: {
                            ...entry.stats.abilities,
                            [ability]: {
                              ...entry.stats.abilities[ability],
                              score: parseNumber(event.target.value),
                            },
                          },
                        },
                      }))
                    }
                  />
                </label>
              ))}
            </div>
            <div className="section-inline-header">
              <h3>Actions</h3>
              <button
                type="button"
                className="button button--ghost"
                onClick={() =>
                  updateCompanion(selectedCompanion.id, (entry) => ({
                    ...entry,
                    stats: { ...entry.stats, actions: [...entry.stats.actions, createAction()] },
                  }))
                }
              >
                Add Action
              </button>
            </div>
            {selectedCompanion.stats.actions.map((action) => (
              <div key={action.id} className="stacked-editor">
                <input
                  className="input"
                  value={action.name}
                  onChange={(event) =>
                    updateCompanion(selectedCompanion.id, (entry) => ({
                      ...entry,
                      stats: {
                        ...entry.stats,
                        actions: entry.stats.actions.map((current) =>
                          current.id === action.id
                            ? { ...current, name: event.target.value }
                            : current
                        ),
                      },
                    }))
                  }
                />
                <textarea
                  className="textarea"
                  rows={2}
                  value={action.description}
                  onChange={(event) =>
                    updateCompanion(selectedCompanion.id, (entry) => ({
                      ...entry,
                      stats: {
                        ...entry.stats,
                        actions: entry.stats.actions.map((current) =>
                          current.id === action.id
                            ? { ...current, description: event.target.value }
                            : current
                        ),
                      },
                    }))
                  }
                />
              </div>
            ))}
            <div className="section-inline-header">
              <h3>Inventory</h3>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => addCompanionItem(selectedCompanion.id)}
              >
                Add Item
              </button>
            </div>
            {selectedCompanion.inventory.items.map((item) => (
              <div key={item.id} className="form-grid form-grid--four compact-grid">
                <input
                  className="input"
                  value={item.name}
                  onChange={(event) =>
                    updateCompanionItem(selectedCompanion.id, item.id, (current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
                <input
                  className="input"
                  type="number"
                  value={item.quantity}
                  onChange={(event) =>
                    updateCompanionItem(selectedCompanion.id, item.id, (current) => ({
                      ...current,
                      quantity: parseNumber(event.target.value),
                    }))
                  }
                />
                <input
                  className="input"
                  type="number"
                  value={item.weight}
                  onChange={(event) =>
                    updateCompanionItem(selectedCompanion.id, item.id, (current) => ({
                      ...current,
                      weight: parseNumber(event.target.value),
                    }))
                  }
                />
                <button
                  type="button"
                  className="button button--ghost button--danger"
                  onClick={() => removeCompanionItem(selectedCompanion.id, item.id)}
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="section-inline-header">
              <h3>Spell List</h3>
              <button
                type="button"
                className="button button--ghost"
                onClick={() =>
                  addCompanionSpell(selectedCompanion.id, {
                    ...createSpellEntry(),
                    sourceKind: 'companion',
                    sourceLabel: selectedCompanion.name,
                  })
                }
              >
                Add Spell
              </button>
            </div>
            {selectedCompanion.spellbook.spells.map((spell) => (
              <div key={spell.id} className="form-grid form-grid--four compact-grid">
                <input
                  className="input"
                  value={spell.spell.name}
                  onChange={(event) =>
                    updateCompanionSpell(selectedCompanion.id, spell.id, (current) => ({
                      ...current,
                      spell: { ...current.spell, name: event.target.value },
                    }))
                  }
                />
                <label className="checkbox-field">
                  <span>Prepared</span>
                  <input
                    type="checkbox"
                    checked={spell.prepared}
                    onChange={(event) =>
                      updateCompanionSpell(selectedCompanion.id, spell.id, (current) => ({
                        ...current,
                        prepared: event.target.checked,
                      }))
                    }
                  />
                </label>
                <input
                  className="input"
                  type="number"
                  value={spell.castCount}
                  onChange={(event) =>
                    updateCompanionSpell(selectedCompanion.id, spell.id, (current) => ({
                      ...current,
                      castCount: parseNumber(event.target.value),
                    }))
                  }
                />
              </div>
            ))}
            <textarea
              className="textarea"
              rows={4}
              value={selectedCompanion.notes}
              placeholder="Companion notes"
              onChange={(event) =>
                updateCompanion(selectedCompanion.id, (entry) => ({
                  ...entry,
                  notes: event.target.value,
                }))
              }
            />
            <button
              type="button"
              className="button button--ghost button--danger"
              onClick={() => deleteCompanion(selectedCompanion.id)}
            >
              Delete Companion
            </button>
          </SectionCard>
        ) : (
          <EmptyState
            title="No companion selected"
            description="Create or clone a companion to begin editing."
          />
        )}
      </div>
    </div>
  );
};
