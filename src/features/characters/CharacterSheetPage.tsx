import { AbilityScoreGrid } from '../../components/common/AbilityScoreGrid';
import { Badge } from '../../components/common/Badge';
import { BeastFormOverlay } from '../../components/common/BeastFormOverlay';
import { CombatBlock } from '../../components/common/CombatBlock';
import { ConditionsBar } from '../../components/common/ConditionsBar';
import { DropZone } from '../../components/common/DropZone';
import { EmptyState } from '../../components/common/EmptyState';
import { FeaturesSection } from '../../components/common/FeaturesSection';
import { InventorySection } from '../../components/common/InventorySection';
import { PolymorphOverlay } from '../../components/common/PolymorphOverlay';
import { SectionCard } from '../../components/common/SectionCard';
import { SkillList } from '../../components/common/SkillList';
import { SpellbookSection } from '../../components/common/SpellbookSection';
import { CharacterTabs } from '../../components/layout/CharacterTabs';
import { useCurrentCharacter } from '../../hooks/useCurrentCharacter';
import { useAppStore } from '../../store/useAppStore';

export const CharacterSheetPage = () => {
  const { character } = useCurrentCharacter();
  const printOptions = useAppStore((state) => state.settings.printOptions);
  const updateCharacter = useAppStore((state) => state.updateCharacter);
  const updateSpellSlot = useAppStore((state) => state.updateSpellSlot);
  const updatePactMagic = useAppStore((state) => state.updatePactMagic);
  const addCharacterSpell = useAppStore((state) => state.addCharacterSpell);
  const updateCharacterSpell = useAppStore((state) => state.updateCharacterSpell);
  const removeCharacterSpell = useAppStore((state) => state.removeCharacterSpell);
  const addCharacterItem = useAppStore((state) => state.addCharacterItem);
  const updateCharacterItem = useAppStore((state) => state.updateCharacterItem);
  const removeCharacterItem = useAppStore((state) => state.removeCharacterItem);
  const moveCharacterItem = useAppStore((state) => state.moveCharacterItem);
  const updateCharacterCurrency = useAppStore((state) => state.updateCharacterCurrency);
  const clearActiveWildShape = useAppStore((state) => state.clearActiveWildShape);
  const updateActiveWildShapeHp = useAppStore((state) => state.updateActiveWildShapeHp);
  const clearPolymorph = useAppStore((state) => state.clearPolymorph);

  if (!character) {
    return (
      <EmptyState
        title="Character not found"
        description="Select a character from the dashboard."
      />
    );
  }

  const activeFormName =
    character.wildShapes.activeForm
      ? (character.wildShapes.forms.find((f) => f.id === character.wildShapes.activeForm?.formId)
          ?.name ?? 'Wild Shape')
      : null;

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Character Sheet</p>
          <h1>{character.name}</h1>
          <p>
            Level {character.level} {character.raceName} {character.className}
            {character.subclassName ? ` (${character.subclassName})` : ''}
          </p>
          <span aria-live="polite" aria-atomic="true">
            {activeFormName ? (
              <Badge tone="success">Wild Shape: {activeFormName}</Badge>
            ) : null}
            {character.activePolymorph ? (
              <Badge tone="accent">Polymorphed</Badge>
            ) : null}
          </span>
        </div>
        <button className="button" type="button" onClick={() => window.print()}>
          Print
        </button>
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

      <SectionCard title="Ability Scores">
        <AbilityScoreGrid
          character={character}
          onUpdate={(updater) => updateCharacter(character.id, updater)}
        />
      </SectionCard>

      <SectionCard title="Combat">
        <CombatBlock
          character={character}
          onUpdate={(updater) => updateCharacter(character.id, updater)}
        />
      </SectionCard>

      <SectionCard title="Skills">
        <SkillList
          character={character}
          onUpdate={(updater) => updateCharacter(character.id, updater)}
        />
      </SectionCard>

      <SectionCard title="Conditions">
        <ConditionsBar
          character={character}
          onUpdate={(updater) => updateCharacter(character.id, updater)}
        />
      </SectionCard>

      <SectionCard title="Features and Actions">
        <FeaturesSection
          character={character}
          onAddFeature={() =>
            updateCharacter(character.id, (c) => ({
              ...c,
              features: [
                ...c.features,
                { id: crypto.randomUUID(), name: 'New Feature', description: '' },
              ],
            }))
          }
          onUpdateFeature={(id, updater) =>
            updateCharacter(character.id, (c) => ({
              ...c,
              features: c.features.map((f) => (f.id === id ? updater(f) : f)),
            }))
          }
          onRemoveFeature={(id) =>
            updateCharacter(character.id, (c) => ({
              ...c,
              features: c.features.filter((f) => f.id !== id),
            }))
          }
          onAddAction={() =>
            updateCharacter(character.id, (c) => ({
              ...c,
              actions: [
                ...c.actions,
                { id: crypto.randomUUID(), name: 'New Action', description: '' },
              ],
            }))
          }
          onUpdateAction={(id, updater) =>
            updateCharacter(character.id, (c) => ({
              ...c,
              actions: c.actions.map((a) => (a.id === id ? updater(a) : a)),
            }))
          }
          onRemoveAction={(id) =>
            updateCharacter(character.id, (c) => ({
              ...c,
              actions: c.actions.filter((a) => a.id !== id),
            }))
          }
        />
      </SectionCard>

      {printOptions.showSpellbook ? (
        <SectionCard title="Spellbook">
          <DropZone characterId={character.id} accepts="spell" />
          <SpellbookSection
            character={character}
            onUpdateSpellSlot={(level, updater) => updateSpellSlot(character.id, level, updater)}
            onUpdatePactMagic={(updater) => updatePactMagic(character.id, updater)}
            onAddSpell={() => addCharacterSpell(character.id)}
            onUpdateSpell={(spellId, updater) =>
              updateCharacterSpell(character.id, spellId, updater)
            }
            onRemoveSpell={(spellId) => removeCharacterSpell(character.id, spellId)}
          />
        </SectionCard>
      ) : null}

      <SectionCard title="Inventory">
        <DropZone characterId={character.id} accepts="item" />
        <InventorySection
          character={character}
          onAddItem={() => addCharacterItem(character.id)}
          onUpdateItem={(itemId, updater) => updateCharacterItem(character.id, itemId, updater)}
          onRemoveItem={(itemId) => removeCharacterItem(character.id, itemId)}
          onMoveItem={(itemId, containerId) => moveCharacterItem(character.id, itemId, containerId)}
          onUpdateCurrency={(updater) => updateCharacterCurrency(character.id, updater)}
        />
      </SectionCard>

      {printOptions.showNotes ? (
        <SectionCard title="Notes">
          <div className="form-grid">
            <label>
              Appearance
              <textarea
                className="input"
                rows={3}
                value={character.appearance}
                onChange={(e) =>
                  updateCharacter(character.id, (c) => ({ ...c, appearance: e.target.value }))
                }
              />
            </label>
            <label>
              Notes
              <textarea
                className="input"
                rows={4}
                value={character.notes}
                onChange={(e) =>
                  updateCharacter(character.id, (c) => ({ ...c, notes: e.target.value }))
                }
              />
            </label>
            <label>
              Feature Notes
              <textarea
                className="input"
                rows={3}
                value={character.featureNotes}
                onChange={(e) =>
                  updateCharacter(character.id, (c) => ({ ...c, featureNotes: e.target.value }))
                }
              />
            </label>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
};
