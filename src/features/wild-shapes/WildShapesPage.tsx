import { useEffect, useMemo, useState } from 'react';
import { BeastFormOverlay } from '../../components/common/BeastFormOverlay';
import { EmptyState } from '../../components/common/EmptyState';
import { PolymorphOverlay } from '../../components/common/PolymorphOverlay';
import { SearchBar } from '../../components/common/SearchBar';
import { SectionCard } from '../../components/common/SectionCard';
import { WildShapePanel } from '../../components/common/WildShapePanel';
import { CharacterTabs } from '../../components/layout/CharacterTabs';
import { useCurrentCharacter } from '../../hooks/useCurrentCharacter';
import { useOpen5eResource } from '../../hooks/useOpen5eResource';
import { creatureToWildShape } from '../../services/open5e/normalizers';
import { useAppStore } from '../../store/useAppStore';

export const WildShapesPage = () => {
  const { character } = useCurrentCharacter();
  const addWildShapeForm = useAppStore((state) => state.addWildShapeForm);
  const updateWildShapeForm = useAppStore((state) => state.updateWildShapeForm);
  const removeWildShapeForm = useAppStore((state) => state.removeWildShapeForm);
  const setActiveWildShape = useAppStore((state) => state.setActiveWildShape);
  const clearActiveWildShape = useAppStore((state) => state.clearActiveWildShape);
  const updateActiveWildShapeHp = useAppStore((state) => state.updateActiveWildShapeHp);
  const clearPolymorph = useAppStore((state) => state.clearPolymorph);
  const settings = useAppStore((state) => state.settings);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const beastReferences = useOpen5eResource('monsters', {
    document__slug: settings.referenceDocumentFilter,
    search,
    type: 'Beast',
    limit: 12,
  });

  useEffect(() => {
    const nextId =
      selectedId && character?.wildShapes.forms.some((f) => f.id === selectedId)
        ? selectedId
        : (character?.wildShapes.forms[0]?.id ?? null);
    if (nextId !== selectedId) setSelectedId(nextId);
  }, [character?.wildShapes.forms, selectedId]);

  const selectedForm = useMemo(
    () => character?.wildShapes.forms.find((f) => f.id === selectedId) ?? null,
    [character?.wildShapes.forms, selectedId]
  );

  if (!character) {
    return (
      <EmptyState
        title="Character not found"
        description="Select a character to manage reusable forms."
      />
    );
  }

  const createForm = (form?: Parameters<typeof addWildShapeForm>[1]) => {
    const nextId = addWildShapeForm(character.id, form);
    setSelectedId(nextId);
  };

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Wild Shapes</p>
          <h1>{character.name}</h1>
          <p>Saved beast forms, quick transformation tracking, and polymorph overlays.</p>
        </div>
      </section>

      <CharacterTabs characterId={character.id} />

      {character.wildShapes.activeForm ? (
        <BeastFormOverlay
          character={character}
          onUpdateHp={(delta) => updateActiveWildShapeHp(character.id, delta)}
          onRevert={() => clearActiveWildShape(character.id)}
        />
      ) : null}

      {character.activePolymorph ? (
        <PolymorphOverlay
          character={character}
          onUpdateHp={() => {}}
          onClear={() => clearPolymorph(character.id)}
        />
      ) : null}

      <div className="split-layout split-layout--sidebar">
        <SectionCard
          title="Saved Forms"
          actions={
            <button type="button" className="button" onClick={() => createForm()}>
              New Form
            </button>
          }
        >
          <div className="stack-list">
            {character.wildShapes.forms.map((form) => (
              <button
                key={form.id}
                type="button"
                className={selectedId === form.id ? 'list-button list-button--active' : 'list-button'}
                onClick={() => setSelectedId(form.id)}
              >
                <strong>{form.name}</strong>
                <span>CR {form.challengeRating}</span>
              </button>
            ))}
          </div>
          <div className="toolbar">
            <SearchBar value={search} placeholder="Search beast references" onChange={setSearch} />
          </div>
          <div className="stack-list">
            {beastReferences.items.map((creature) => (
              <article key={creature.id} className="spell-card spell-card--compact">
                <div>
                  <h3>{creature.name}</h3>
                  <p>
                    {creature.size} {creature.creatureType} — CR {creature.challengeRating}
                  </p>
                </div>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => createForm(creatureToWildShape(creature))}
                >
                  Save Form
                </button>
              </article>
            ))}
          </div>
        </SectionCard>

        {selectedForm ? (
          <SectionCard title={selectedForm.name} subtitle="Stored locally with source provenance intact.">
            <WildShapePanel
              character={character}
              selectedForm={selectedForm}
              onActivate={(formId) => setActiveWildShape(character.id, formId)}
              onRevert={() => clearActiveWildShape(character.id)}
              onUpdateHp={(delta) => updateActiveWildShapeHp(character.id, delta)}
              onUpdateForm={(formId, updater) => updateWildShapeForm(character.id, formId, updater)}
              onRemoveForm={(formId) => removeWildShapeForm(character.id, formId)}
            />
          </SectionCard>
        ) : (
          <EmptyState
            title="No form selected"
            description="Save a form from Open5e or create one from scratch."
          />
        )}
      </div>
    </div>
  );
};
