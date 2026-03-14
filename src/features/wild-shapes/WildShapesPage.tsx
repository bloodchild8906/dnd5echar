import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { SearchBar } from '../../components/common/SearchBar';
import { SectionCard } from '../../components/common/SectionCard';
import { CharacterTabs } from '../../components/layout/CharacterTabs';
import { compareFormToCharacter } from '../../domain/derived';
import { createAction } from '../../domain/seeds';
import { useCurrentCharacter } from '../../hooks/useCurrentCharacter';
import { useOpen5eResource } from '../../hooks/useOpen5eResource';
import { creatureToWildShape } from '../../services/open5e/normalizers';
import { useAppStore } from '../../store/useAppStore';
import { parseNumber } from '../../utils/numbers';

export const WildShapesPage = () => {
  const { character } = useCurrentCharacter();
  const addWildShapeForm = useAppStore((state) => state.addWildShapeForm);
  const updateWildShapeForm = useAppStore((state) => state.updateWildShapeForm);
  const removeWildShapeForm = useAppStore((state) => state.removeWildShapeForm);
  const setActiveWildShape = useAppStore((state) => state.setActiveWildShape);
  const clearActiveWildShape = useAppStore((state) => state.clearActiveWildShape);
  const updateActiveWildShapeHp = useAppStore((state) => state.updateActiveWildShapeHp);
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
    if (!selectedId && character?.wildShapes.forms[0]) {
      setSelectedId(character.wildShapes.forms[0].id);
    }
  }, [character?.wildShapes.forms, selectedId]);

  const selectedForm = useMemo(() => character?.wildShapes.forms.find((entry) => entry.id === selectedId) ?? null, [character?.wildShapes.forms, selectedId]);
  const comparison = character && selectedForm ? compareFormToCharacter(character, selectedForm) : null;

  if (!character) {
    return <EmptyState title="Character not found" description="Select a character to manage reusable forms." />;
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Wild Shapes</p>
          <h1>{character.name}</h1>
          <p>Saved beast forms, quick transformation tracking, and a generic architecture for future polymorph workflows.</p>
        </div>
      </section>

      <CharacterTabs characterId={character.id} />

      <div className="split-layout split-layout--sidebar">
        <SectionCard title="Saved Forms" actions={<button type="button" className="button" onClick={() => { addWildShapeForm(character.id); setSelectedId(character.wildShapes.forms[0]?.id ?? null); }}>New Form</button>}>
          <div className="stack-list">
            {character.wildShapes.forms.map((form) => (
              <button key={form.id} type="button" className={selectedId === form.id ? 'list-button list-button--active' : 'list-button'} onClick={() => setSelectedId(form.id)}>
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
                  <p>{creature.size} {creature.creatureType} • CR {creature.challengeRating}</p>
                </div>
                <button type="button" className="button button--ghost" onClick={() => { addWildShapeForm(character.id, creatureToWildShape(creature)); setSelectedId(creature.id); }}>
                  Save Form
                </button>
              </article>
            ))}
          </div>
        </SectionCard>

        {selectedForm ? (
          <SectionCard title={selectedForm.name} subtitle="Stored locally with source provenance intact.">
            <div className="form-grid form-grid--three">
              <label>
                Name
                <input className="input" value={selectedForm.name} onChange={(event) => updateWildShapeForm(character.id, selectedForm.id, (entry) => ({ ...entry, name: event.target.value }))} />
              </label>
              <label>
                Size
                <input className="input" value={selectedForm.size} onChange={(event) => updateWildShapeForm(character.id, selectedForm.id, (entry) => ({ ...entry, size: event.target.value }))} />
              </label>
              <label>
                CR
                <input className="input" value={selectedForm.challengeRating} onChange={(event) => updateWildShapeForm(character.id, selectedForm.id, (entry) => ({ ...entry, challengeRating: event.target.value }))} />
              </label>
              <label>
                AC
                <input className="input" type="number" value={selectedForm.stats.ac} onChange={(event) => updateWildShapeForm(character.id, selectedForm.id, (entry) => ({ ...entry, stats: { ...entry.stats, ac: parseNumber(event.target.value) } }))} />
              </label>
              <label>
                Max HP
                <input className="input" type="number" value={selectedForm.stats.hp.max} onChange={(event) => updateWildShapeForm(character.id, selectedForm.id, (entry) => ({ ...entry, stats: { ...entry.stats, hp: { ...entry.stats.hp, max: parseNumber(event.target.value) } } }))} />
              </label>
              <label className="checkbox-field">
                <span>Favorite</span>
                <input type="checkbox" checked={selectedForm.favorite} onChange={(event) => updateWildShapeForm(character.id, selectedForm.id, (entry) => ({ ...entry, favorite: event.target.checked }))} />
              </label>
            </div>
            <div className="ability-grid">
              {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map((ability) => (
                <label key={ability}>
                  {ability.slice(0, 3).toUpperCase()}
                  <input className="input" type="number" value={selectedForm.stats.abilities[ability].score} onChange={(event) => updateWildShapeForm(character.id, selectedForm.id, (entry) => ({ ...entry, stats: { ...entry.stats, abilities: { ...entry.stats.abilities, [ability]: { ...entry.stats.abilities[ability], score: parseNumber(event.target.value) } } } }))} />
                </label>
              ))}
            </div>
            <div className="form-grid form-grid--four">
              <label>
                Walk
                <input className="input" type="number" value={selectedForm.stats.speed.walk} onChange={(event) => updateWildShapeForm(character.id, selectedForm.id, (entry) => ({ ...entry, stats: { ...entry.stats, speed: { ...entry.stats.speed, walk: parseNumber(event.target.value) } } }))} />
              </label>
              <label>
                Climb
                <input className="input" type="number" value={selectedForm.stats.speed.climb ?? ''} onChange={(event) => updateWildShapeForm(character.id, selectedForm.id, (entry) => ({ ...entry, stats: { ...entry.stats, speed: { ...entry.stats.speed, climb: event.target.value === '' ? undefined : parseNumber(event.target.value) } } }))} />
              </label>
              <label>
                Fly
                <input className="input" type="number" value={selectedForm.stats.speed.fly ?? ''} onChange={(event) => updateWildShapeForm(character.id, selectedForm.id, (entry) => ({ ...entry, stats: { ...entry.stats, speed: { ...entry.stats.speed, fly: event.target.value === '' ? undefined : parseNumber(event.target.value) } } }))} />
              </label>
              <label>
                Swim
                <input className="input" type="number" value={selectedForm.stats.speed.swim ?? ''} onChange={(event) => updateWildShapeForm(character.id, selectedForm.id, (entry) => ({ ...entry, stats: { ...entry.stats, speed: { ...entry.stats.speed, swim: event.target.value === '' ? undefined : parseNumber(event.target.value) } } }))} />
              </label>
            </div>
            {comparison ? (
              <div className="comparison-grid">
                <div>
                  <Badge tone="accent">Base AC {comparison.baseAc}</Badge>
                  <Badge tone="success">Form AC {comparison.formAc}</Badge>
                </div>
                <div>
                  <p>Base speed: {comparison.baseSpeed}</p>
                  <p>Form speed: {comparison.formSpeed}</p>
                  <p>Mental stats retained: Int {comparison.baseMental.intelligence}, Wis {comparison.baseMental.wisdom}, Cha {comparison.baseMental.charisma}</p>
                </div>
              </div>
            ) : null}
            <div className="section-inline-header">
              <h3>Actions</h3>
              <button type="button" className="button button--ghost" onClick={() => updateWildShapeForm(character.id, selectedForm.id, (entry) => ({ ...entry, stats: { ...entry.stats, actions: [...entry.stats.actions, createAction()] } }))}>Add Action</button>
            </div>
            {selectedForm.stats.actions.map((action) => (
              <div key={action.id} className="stacked-editor">
                <input className="input" value={action.name} onChange={(event) => updateWildShapeForm(character.id, selectedForm.id, (entry) => ({ ...entry, stats: { ...entry.stats, actions: entry.stats.actions.map((current) => (current.id === action.id ? { ...current, name: event.target.value } : current)) } }))} />
                <textarea className="textarea" rows={2} value={action.description} onChange={(event) => updateWildShapeForm(character.id, selectedForm.id, (entry) => ({ ...entry, stats: { ...entry.stats, actions: entry.stats.actions.map((current) => (current.id === action.id ? { ...current, description: event.target.value } : current)) } }))} />
              </div>
            ))}
            <textarea className="textarea" rows={3} value={selectedForm.notes} placeholder="Form notes" onChange={(event) => updateWildShapeForm(character.id, selectedForm.id, (entry) => ({ ...entry, notes: event.target.value }))} />
            <textarea className="textarea" rows={3} value={selectedForm.rulesNotes} placeholder="Rules notes" onChange={(event) => updateWildShapeForm(character.id, selectedForm.id, (entry) => ({ ...entry, rulesNotes: event.target.value }))} />
            <div className="button-row">
              <button type="button" className="button" onClick={() => setActiveWildShape(character.id, selectedForm.id)}>Activate</button>
              <button type="button" className="button button--ghost" onClick={() => clearActiveWildShape(character.id)}>Clear Active Form</button>
              <button type="button" className="button button--ghost button--danger" onClick={() => { removeWildShapeForm(character.id, selectedForm.id); setSelectedId(character.wildShapes.forms.find((entry) => entry.id !== selectedForm.id)?.id ?? null); }}>Delete Form</button>
            </div>
            {character.wildShapes.activeForm?.formId === selectedForm.id ? (
              <div className="toolbar">
                <Badge tone="success">Active HP {character.wildShapes.activeForm.currentHp}</Badge>
                <button type="button" className="button button--ghost" onClick={() => updateActiveWildShapeHp(character.id, -1)}>-1</button>
                <button type="button" className="button button--ghost" onClick={() => updateActiveWildShapeHp(character.id, 1)}>+1</button>
              </div>
            ) : null}
          </SectionCard>
        ) : (
          <EmptyState title="No form selected" description="Save a form from Open5e or create one from scratch." />
        )}
      </div>
    </div>
  );
};
