import { useMemo } from 'react';
import { CharacterTabs } from '../../components/layout/CharacterTabs';
import { EmptyState } from '../../components/common/EmptyState';
import { SectionCard } from '../../components/common/SectionCard';
import { TagInput } from '../../components/common/TagInput';
import { useCurrentCharacter } from '../../hooks/useCurrentCharacter';
import { useOpen5eResource } from '../../hooks/useOpen5eResource';
import { abilities, skills } from '../../domain/models';
import { parseNumber, isoNow } from '../../utils/numbers';
import { titleCase } from '../../utils/format';
import { createAction, createTrait } from '../../domain/seeds';
import { useAppStore } from '../../store/useAppStore';

const buildOverride = (value: string) => {
  if (value === '') {
    return undefined;
  }

  return {
    value: parseNumber(value),
    reason: 'Manual override',
    updatedAt: isoNow(),
  };
};

export const CharacterBuilderPage = () => {
  const { character } = useCurrentCharacter();
  const updateCharacter = useAppStore((state) => state.updateCharacter);
  const settings = useAppStore((state) => state.settings);
  const classOptions = useOpen5eResource('classes', { document__slug: settings.referenceDocumentFilter, limit: 100 });
  const raceOptions = useOpen5eResource('races', { document__slug: settings.referenceDocumentFilter, limit: 100 });
  const backgroundOptions = useOpen5eResource('backgrounds', { document__slug: settings.referenceDocumentFilter, limit: 100 });

  const datalistIds = useMemo(
    () => ({
      classes: `classes-${character?.id ?? 'global'}`,
      races: `races-${character?.id ?? 'global'}`,
      backgrounds: `backgrounds-${character?.id ?? 'global'}`,
    }),
    [character?.id],
  );

  if (!character) {
    return <EmptyState title="Character not found" description="Pick a character from the dashboard to edit builder details." />;
  }

  const patchCharacter = (updater: Parameters<typeof updateCharacter>[1]) => updateCharacter(character.id, updater);

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Character Builder</p>
          <h1>{character.name}</h1>
          <p>Edit identity, combat stats, proficiencies, resources, and roleplay notes.</p>
        </div>
      </section>

      <CharacterTabs characterId={character.id} />

      <SectionCard title="Identity" subtitle="Canonical Open5e references remain separate from your local overrides.">
        <div className="form-grid form-grid--three">
          <label>
            Name
            <input className="input" value={character.name} onChange={(event) => patchCharacter((entry) => ({ ...entry, name: event.target.value }))} />
          </label>
          <label>
            Portrait URL
            <input className="input" value={character.portraitUrl} onChange={(event) => patchCharacter((entry) => ({ ...entry, portraitUrl: event.target.value }))} />
          </label>
          <label>
            Level
            <input className="input" type="number" min={1} max={20} value={character.level} onChange={(event) => patchCharacter((entry) => ({ ...entry, level: parseNumber(event.target.value, 1) }))} />
          </label>
          <label>
            Class
            <input className="input" list={datalistIds.classes} value={character.className} onChange={(event) => patchCharacter((entry) => ({ ...entry, className: event.target.value, spellbook: { ...entry.spellbook, spellcastingClass: event.target.value || entry.spellbook.spellcastingClass } }))} />
          </label>
          <label>
            Subclass
            <input className="input" value={character.subclassName} onChange={(event) => patchCharacter((entry) => ({ ...entry, subclassName: event.target.value }))} />
          </label>
          <label>
            Race
            <input className="input" list={datalistIds.races} value={character.raceName} onChange={(event) => patchCharacter((entry) => ({ ...entry, raceName: event.target.value }))} />
          </label>
          <label>
            Subrace
            <input className="input" value={character.subraceName} onChange={(event) => patchCharacter((entry) => ({ ...entry, subraceName: event.target.value }))} />
          </label>
          <label>
            Background
            <input className="input" list={datalistIds.backgrounds} value={character.backgroundName} onChange={(event) => patchCharacter((entry) => ({ ...entry, backgroundName: event.target.value }))} />
          </label>
          <label>
            Alignment
            <input className="input" value={character.alignment} onChange={(event) => patchCharacter((entry) => ({ ...entry, alignment: event.target.value }))} />
          </label>
          <label>
            Experience
            <input className="input" type="number" min={0} value={character.experience} onChange={(event) => patchCharacter((entry) => ({ ...entry, experience: parseNumber(event.target.value) }))} />
          </label>
          <label>
            Proficiency Override
            <input className="input" type="number" placeholder="Auto" value={character.proficiencyBonusOverride?.value ?? ''} onChange={(event) => patchCharacter((entry) => ({ ...entry, proficiencyBonusOverride: buildOverride(event.target.value) }))} />
          </label>
          <label className="checkbox-field">
            <span>Inspiration</span>
            <input type="checkbox" checked={character.combat.inspiration} onChange={(event) => patchCharacter((entry) => ({ ...entry, combat: { ...entry.combat, inspiration: event.target.checked } }))} />
          </label>
        </div>
        <datalist id={datalistIds.classes}>{classOptions.items.map((item) => <option key={item.id} value={item.name} />)}</datalist>
        <datalist id={datalistIds.races}>{raceOptions.items.map((item) => <option key={item.id} value={item.name} />)}</datalist>
        <datalist id={datalistIds.backgrounds}>{backgroundOptions.items.map((item) => <option key={item.id} value={item.name} />)}</datalist>
      </SectionCard>

      <SectionCard title="Abilities" subtitle="Base score, custom bonus, and temporary modifier are all tracked independently.">
        <div className="ability-grid">
          {abilities.map((ability) => {
            const state = character.abilityScores[ability];
            return (
              <div key={ability} className="ability-card">
                <strong>{titleCase(ability)}</strong>
                <label>
                  Score
                  <input className="input" type="number" min={1} max={30} value={state.score} onChange={(event) => patchCharacter((entry) => ({ ...entry, abilityScores: { ...entry.abilityScores, [ability]: { ...entry.abilityScores[ability], score: parseNumber(event.target.value, 10) } } }))} />
                </label>
                <label>
                  Bonus
                  <input className="input" type="number" value={state.bonus} onChange={(event) => patchCharacter((entry) => ({ ...entry, abilityScores: { ...entry.abilityScores, [ability]: { ...entry.abilityScores[ability], bonus: parseNumber(event.target.value) } } }))} />
                </label>
                <label>
                  Temp
                  <input className="input" type="number" value={state.temp} onChange={(event) => patchCharacter((entry) => ({ ...entry, abilityScores: { ...entry.abilityScores, [ability]: { ...entry.abilityScores[ability], temp: parseNumber(event.target.value) } } }))} />
                </label>
                <label className="checkbox-field">
                  <span>Save Proficiency</span>
                  <input type="checkbox" checked={character.savingThrows[ability].proficient} onChange={(event) => patchCharacter((entry) => ({ ...entry, savingThrows: { ...entry.savingThrows, [ability]: { ...entry.savingThrows[ability], proficient: event.target.checked } } }))} />
                </label>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Combat and Survival">
        <div className="form-grid form-grid--four">
          <label>
            Base AC
            <input className="input" type="number" value={character.combat.baseArmorClass} onChange={(event) => patchCharacter((entry) => ({ ...entry, combat: { ...entry.combat, baseArmorClass: parseNumber(event.target.value, 10) } }))} />
          </label>
          <label>
            AC Override
            <input className="input" type="number" placeholder="Auto" value={character.combat.armorClassOverride?.value ?? ''} onChange={(event) => patchCharacter((entry) => ({ ...entry, combat: { ...entry.combat, armorClassOverride: buildOverride(event.target.value) } }))} />
          </label>
          <label>
            Initiative Bonus
            <input className="input" type="number" value={character.combat.initiativeBonus} onChange={(event) => patchCharacter((entry) => ({ ...entry, combat: { ...entry.combat, initiativeBonus: parseNumber(event.target.value) } }))} />
          </label>
          <label>
            Initiative Override
            <input className="input" type="number" placeholder="Auto" value={character.combat.initiativeOverride?.value ?? ''} onChange={(event) => patchCharacter((entry) => ({ ...entry, combat: { ...entry.combat, initiativeOverride: buildOverride(event.target.value) } }))} />
          </label>
          <label>
            Max HP
            <input className="input" type="number" min={0} value={character.combat.hitPoints.max} onChange={(event) => patchCharacter((entry) => ({ ...entry, combat: { ...entry.combat, hitPoints: { ...entry.combat.hitPoints, max: parseNumber(event.target.value) } } }))} />
          </label>
          <label>
            Current HP
            <input className="input" type="number" min={0} value={character.combat.hitPoints.current} onChange={(event) => patchCharacter((entry) => ({ ...entry, combat: { ...entry.combat, hitPoints: { ...entry.combat.hitPoints, current: parseNumber(event.target.value) } } }))} />
          </label>
          <label>
            Temp HP
            <input className="input" type="number" min={0} value={character.combat.hitPoints.temp} onChange={(event) => patchCharacter((entry) => ({ ...entry, combat: { ...entry.combat, hitPoints: { ...entry.combat.hitPoints, temp: parseNumber(event.target.value) } } }))} />
          </label>
          <label>
            Hit Dice
            <input className="input" value={character.combat.hitDice} onChange={(event) => patchCharacter((entry) => ({ ...entry, combat: { ...entry.combat, hitDice: event.target.value } }))} />
          </label>
          <label>
            Speed (walk)
            <input className="input" type="number" min={0} value={character.movement.walk} onChange={(event) => patchCharacter((entry) => ({ ...entry, movement: { ...entry.movement, walk: parseNumber(event.target.value) } }))} />
          </label>
          <label>
            Speed (fly)
            <input className="input" type="number" min={0} value={character.movement.fly ?? ''} onChange={(event) => patchCharacter((entry) => ({ ...entry, movement: { ...entry.movement, fly: event.target.value === '' ? undefined : parseNumber(event.target.value) } }))} />
          </label>
          <label>
            Death Successes
            <input className="input" type="number" min={0} max={3} value={character.combat.deathSaves.successes} onChange={(event) => patchCharacter((entry) => ({ ...entry, combat: { ...entry.combat, deathSaves: { ...entry.combat.deathSaves, successes: parseNumber(event.target.value) } } }))} />
          </label>
          <label>
            Death Failures
            <input className="input" type="number" min={0} max={3} value={character.combat.deathSaves.failures} onChange={(event) => patchCharacter((entry) => ({ ...entry, combat: { ...entry.combat, deathSaves: { ...entry.combat.deathSaves, failures: parseNumber(event.target.value) } } }))} />
          </label>
        </div>
        <div className="form-grid form-grid--three">
          <TagInput label="Resistances" values={character.combat.resistances} onChange={(values) => patchCharacter((entry) => ({ ...entry, combat: { ...entry.combat, resistances: values } }))} />
          <TagInput label="Immunities" values={character.combat.immunities} onChange={(values) => patchCharacter((entry) => ({ ...entry, combat: { ...entry.combat, immunities: values } }))} />
          <TagInput label="Vulnerabilities" values={character.combat.vulnerabilities} onChange={(values) => patchCharacter((entry) => ({ ...entry, combat: { ...entry.combat, vulnerabilities: values } }))} />
        </div>
      </SectionCard>

      <SectionCard title="Proficiencies and Senses">
        <div className="form-grid form-grid--three">
          <TagInput label="Languages" values={character.languages} onChange={(values) => patchCharacter((entry) => ({ ...entry, languages: values }))} />
          <TagInput label="Senses" values={character.senses} onChange={(values) => patchCharacter((entry) => ({ ...entry, senses: values }))} />
          <TagInput label="Conditions" values={character.conditions} onChange={(values) => patchCharacter((entry) => ({ ...entry, conditions: values }))} />
        </div>
        <div className="skill-grid">
          {skills.map((skill) => (
            <div key={skill} className="skill-row">
              <strong>{titleCase(skill)}</strong>
              <select className="input" value={character.skills[skill].proficiency} onChange={(event) => patchCharacter((entry) => ({ ...entry, skills: { ...entry.skills, [skill]: { ...entry.skills[skill], proficiency: event.target.value as (typeof entry.skills)[typeof skill]['proficiency'] } } }))}>
                <option value="none">None</option>
                <option value="proficient">Proficient</option>
                <option value="expertise">Expertise</option>
              </select>
              <input className="input" type="number" value={character.skills[skill].bonus} onChange={(event) => patchCharacter((entry) => ({ ...entry, skills: { ...entry.skills, [skill]: { ...entry.skills[skill], bonus: parseNumber(event.target.value) } } }))} />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Features, Actions, and Currency">
        <div className="split-layout">
          <div>
            <div className="section-inline-header">
              <h3>Features and Traits</h3>
              <button type="button" className="button button--ghost" onClick={() => patchCharacter((entry) => ({ ...entry, features: [...entry.features, createTrait()] }))}>Add Feature</button>
            </div>
            {character.features.map((feature) => (
              <div key={feature.id} className="stacked-editor">
                <input className="input" value={feature.name} onChange={(event) => patchCharacter((entry) => ({ ...entry, features: entry.features.map((current) => (current.id === feature.id ? { ...current, name: event.target.value } : current)) }))} />
                <textarea className="textarea" rows={3} value={feature.description} onChange={(event) => patchCharacter((entry) => ({ ...entry, features: entry.features.map((current) => (current.id === feature.id ? { ...current, description: event.target.value } : current)) }))} />
                <button type="button" className="button button--ghost button--danger" onClick={() => patchCharacter((entry) => ({ ...entry, features: entry.features.filter((current) => current.id !== feature.id) }))}>Remove</button>
              </div>
            ))}
          </div>
          <div>
            <div className="section-inline-header">
              <h3>Attacks and Actions</h3>
              <button type="button" className="button button--ghost" onClick={() => patchCharacter((entry) => ({ ...entry, actions: [...entry.actions, createAction()] }))}>Add Action</button>
            </div>
            {character.actions.map((action) => (
              <div key={action.id} className="stacked-editor">
                <input className="input" value={action.name} onChange={(event) => patchCharacter((entry) => ({ ...entry, actions: entry.actions.map((current) => (current.id === action.id ? { ...current, name: event.target.value } : current)) }))} />
                <textarea className="textarea" rows={3} value={action.description} onChange={(event) => patchCharacter((entry) => ({ ...entry, actions: entry.actions.map((current) => (current.id === action.id ? { ...current, description: event.target.value } : current)) }))} />
                <button type="button" className="button button--ghost button--danger" onClick={() => patchCharacter((entry) => ({ ...entry, actions: entry.actions.filter((current) => current.id !== action.id) }))}>Remove</button>
              </div>
            ))}
            <div className="form-grid form-grid--five compact-grid">
              {(['cp', 'sp', 'ep', 'gp', 'pp'] as const).map((coin) => (
                <label key={coin}>
                  {coin.toUpperCase()}
                  <input className="input" type="number" value={character.currency[coin]} onChange={(event) => patchCharacter((entry) => ({ ...entry, currency: { ...entry.currency, [coin]: parseNumber(event.target.value) } }))} />
                </label>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Notes">
        <div className="form-grid">
          <label>
            Builder Notes
            <textarea className="textarea" rows={5} value={character.notes} onChange={(event) => patchCharacter((entry) => ({ ...entry, notes: event.target.value }))} />
          </label>
          <label>
            Feature Notes
            <textarea className="textarea" rows={5} value={character.featureNotes} onChange={(event) => patchCharacter((entry) => ({ ...entry, featureNotes: event.target.value }))} />
          </label>
        </div>
      </SectionCard>
    </div>
  );
};
