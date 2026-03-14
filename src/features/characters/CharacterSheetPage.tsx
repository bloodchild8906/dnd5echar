import { Badge } from '../../components/common/Badge';
import { NumberAdjuster } from '../../components/common/NumberAdjuster';
import { EmptyState } from '../../components/common/EmptyState';
import { SectionCard } from '../../components/common/SectionCard';
import { CharacterTabs } from '../../components/layout/CharacterTabs';
import {
  compareFormToCharacter,
  getAbilityArray,
  getArmorClass,
  getAttunedItemCount,
  getCarryCapacity,
  getInitiative,
  getPassiveScore,
  getSpellAttackBonus,
  getSpellSaveDc,
  getTotalCarriedWeight,
  summarizeSpeed,
} from '../../domain/derived';
import { useCurrentCharacter } from '../../hooks/useCurrentCharacter';
import { isoNow, parseNumber } from '../../utils/numbers';
import { formatModifier, totalCurrencyInGold } from '../../utils/format';
import { useAppStore } from '../../store/useAppStore';

const setOverride = (value: string) => (value === '' ? undefined : { value: parseNumber(value), reason: 'Manual override', updatedAt: isoNow() });

export const CharacterSheetPage = () => {
  const { character } = useCurrentCharacter();
  const updateCharacter = useAppStore((state) => state.updateCharacter);

  if (!character) {
    return <EmptyState title="Character not found" description="Open a character from the dashboard to view the live sheet." />;
  }

  const patch = (updater: Parameters<typeof updateCharacter>[1]) => updateCharacter(character.id, updater);
  const activeForm = character.wildShapes.activeForm ? character.wildShapes.forms.find((form) => form.id === character.wildShapes.activeForm?.formId) : null;
  const formCompare = compareFormToCharacter(character, activeForm ?? undefined);

  return (
    <div className="page-stack print-surface">
      <section className="page-header page-header--hero">
        <div>
          <p className="eyebrow">Character Sheet</p>
          <h1>{character.name}</h1>
          <p>{character.raceName} {character.subraceName ? `(${character.subraceName}) ` : ''}Level {character.level} {character.className}{character.subclassName ? ` • ${character.subclassName}` : ''}</p>
        </div>
        <div className="inline-badges">
          <Badge tone="accent">AC {getArmorClass(character)}</Badge>
          <Badge tone="success">HP {character.combat.hitPoints.current}/{character.combat.hitPoints.max}</Badge>
          <Badge>Init {formatModifier(getInitiative(character))}</Badge>
        </div>
      </section>

      <CharacterTabs characterId={character.id} />

      <SectionCard title="Core Stats" subtitle="Fast-adjust play view for table use.">
        <div className="stats-row">
          {getAbilityArray(character).map((entry) => (
            <div key={entry.ability} className="stat-tile">
              <span>{entry.ability.slice(0, 3).toUpperCase()}</span>
              <strong>{entry.total}</strong>
              <small>{formatModifier(entry.modifier)}</small>
            </div>
          ))}
        </div>
        <div className="stats-row stats-row--dense">
          <NumberAdjuster value={character.combat.hitPoints.current} label="Current HP" onChange={(value) => patch((entry) => ({ ...entry, combat: { ...entry.combat, hitPoints: { ...entry.combat.hitPoints, current: value } } }))} />
          <NumberAdjuster value={character.combat.hitPoints.temp} label="Temp HP" onChange={(value) => patch((entry) => ({ ...entry, combat: { ...entry.combat, hitPoints: { ...entry.combat.hitPoints, temp: value } } }))} />
          <NumberAdjuster value={character.combat.deathSaves.successes} label="Death Successes" min={0} onChange={(value) => patch((entry) => ({ ...entry, combat: { ...entry.combat, deathSaves: { ...entry.combat.deathSaves, successes: Math.min(3, value) } } }))} />
          <NumberAdjuster value={character.combat.deathSaves.failures} label="Death Failures" min={0} onChange={(value) => patch((entry) => ({ ...entry, combat: { ...entry.combat, deathSaves: { ...entry.combat.deathSaves, failures: Math.min(3, value) } } }))} />
        </div>
        <div className="stats-row stats-row--dense">
          <div className="sheet-chip">Speed: {summarizeSpeed(character.movement)}</div>
          <div className="sheet-chip">Spell DC: {getSpellSaveDc(character)}</div>
          <div className="sheet-chip">Spell Attack: {formatModifier(getSpellAttackBonus(character))}</div>
          <div className="sheet-chip">Carry: {getTotalCarriedWeight(character.inventory.items).toFixed(1)} / {getCarryCapacity(character)} lb</div>
          <div className="sheet-chip">Attuned: {getAttunedItemCount(character.inventory.items)}</div>
          <div className="sheet-chip">Currency: {totalCurrencyInGold(character.currency).toFixed(2)} gp</div>
        </div>
      </SectionCard>

      <SectionCard title="Passives and Overrides" subtitle="Derived values can be overridden without losing their auto-calculated source.">
        <div className="form-grid form-grid--three">
          <label>
            Passive Perception
            <input className="input" type="number" value={character.combat.passiveOverrides.perception?.value ?? getPassiveScore(character, 'perception')} onChange={(event) => patch((entry) => ({ ...entry, combat: { ...entry.combat, passiveOverrides: { ...entry.combat.passiveOverrides, perception: setOverride(event.target.value) } } }))} />
          </label>
          <label>
            Passive Investigation
            <input className="input" type="number" value={character.combat.passiveOverrides.investigation?.value ?? getPassiveScore(character, 'investigation')} onChange={(event) => patch((entry) => ({ ...entry, combat: { ...entry.combat, passiveOverrides: { ...entry.combat.passiveOverrides, investigation: setOverride(event.target.value) } } }))} />
          </label>
          <label>
            Passive Insight
            <input className="input" type="number" value={character.combat.passiveOverrides.insight?.value ?? getPassiveScore(character, 'insight')} onChange={(event) => patch((entry) => ({ ...entry, combat: { ...entry.combat, passiveOverrides: { ...entry.combat.passiveOverrides, insight: setOverride(event.target.value) } } }))} />
          </label>
        </div>
        <div className="inline-badges">
          {character.combat.armorClassOverride ? <Badge tone="warning">AC override: {character.combat.armorClassOverride.reason || 'manual'}</Badge> : null}
          {character.combat.initiativeOverride ? <Badge tone="warning">Initiative override: {character.combat.initiativeOverride.reason || 'manual'}</Badge> : null}
          {character.proficiencyBonusOverride ? <Badge tone="warning">Proficiency override: {character.proficiencyBonusOverride.reason || 'manual'}</Badge> : null}
        </div>
      </SectionCard>

      {activeForm && formCompare ? (
        <SectionCard title="Active Form" subtitle="Shows what changes during a transformation and what carries over.">
          <div className="comparison-grid">
            <div>
              <h3>{activeForm.name}</h3>
              <p>{activeForm.size} {activeForm.creatureType} • CR {activeForm.challengeRating}</p>
              <p>Form HP: {character.wildShapes.activeForm?.currentHp}</p>
              <div className="button-row">
                <button type="button" className="button button--ghost" onClick={() => patch((entry) => ({ ...entry, wildShapes: entry.wildShapes.activeForm ? { ...entry.wildShapes, activeForm: { ...entry.wildShapes.activeForm, currentHp: Math.max(0, entry.wildShapes.activeForm.currentHp - 1) } } : entry.wildShapes }))}>-1 HP</button>
                <button type="button" className="button button--ghost" onClick={() => patch((entry) => ({ ...entry, wildShapes: entry.wildShapes.activeForm ? { ...entry.wildShapes, activeForm: { ...entry.wildShapes.activeForm, currentHp: entry.wildShapes.activeForm.currentHp + 1 } } : entry.wildShapes }))}>+1 HP</button>
              </div>
            </div>
            <div>
              <p>Base AC: {formCompare.baseAc}</p>
              <p>Form AC: {formCompare.formAc}</p>
              <p>Base Speed: {formCompare.baseSpeed}</p>
              <p>Form Speed: {formCompare.formSpeed}</p>
              <p>Retained mental stats: Int {formCompare.baseMental.intelligence}, Wis {formCompare.baseMental.wisdom}, Cha {formCompare.baseMental.charisma}</p>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <div className="split-layout">
        <SectionCard title="Features and Traits">
          <div className="stack-list">
            {character.features.map((feature) => (
              <article key={feature.id} className="stacked-editor stacked-editor--compact">
                <strong>{feature.name}</strong>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Attacks and Actions">
          <div className="stack-list">
            {character.actions.map((action) => (
              <article key={action.id} className="stacked-editor stacked-editor--compact">
                <strong>{action.name}</strong>
                <p>{action.description}</p>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Conditions and Notes">
        <div className="inline-badges">
          {character.conditions.length ? character.conditions.map((condition) => <Badge key={condition} tone="warning">{condition}</Badge>) : <Badge>Unconditioned</Badge>}
        </div>
        <textarea className="textarea" rows={6} value={character.notes} onChange={(event) => patch((entry) => ({ ...entry, notes: event.target.value }))} />
      </SectionCard>
    </div>
  );
};
