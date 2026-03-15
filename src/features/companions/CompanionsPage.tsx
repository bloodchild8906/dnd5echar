import { useEffect, useMemo, useState } from 'react';
import { CompanionCard } from '../../components/common/CompanionCard';
import { CompanionStatBlock } from '../../components/common/CompanionStatBlock';
import { EmptyState } from '../../components/common/EmptyState';
import { InventorySection } from '../../components/common/InventorySection';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { SearchBar } from '../../components/common/SearchBar';
import { SectionCard } from '../../components/common/SectionCard';
import { SpellbookSection } from '../../components/common/SpellbookSection';
import { CharacterTabs } from '../../components/layout/CharacterTabs';
import { creatureToCompanion } from '../../services/open5e/normalizers';
import { useCurrentCharacter } from '../../hooks/useCurrentCharacter';
import { useOpen5eResource } from '../../hooks/useOpen5eResource';
import { useAppStore } from '../../store/useAppStore';

type CompanionTab = 'stats' | 'spellbook' | 'inventory';

export const CompanionsPage = () => {
  const { character, companions } = useCurrentCharacter();
  const createCompanion = useAppStore((state) => state.createCompanion);
  const updateCompanion = useAppStore((state) => state.updateCompanion);
  const deleteCompanion = useAppStore((state) => state.deleteCompanion);
  const addCompanionItem = useAppStore((state) => state.addCompanionItem);
  const updateCompanionItem = useAppStore((state) => state.updateCompanionItem);
  const removeCompanionItem = useAppStore((state) => state.removeCompanionItem);
  const moveCompanionItem = useAppStore((state) => state.moveCompanionItem);
  const addCompanionSpell = useAppStore((state) => state.addCompanionSpell);
  const updateCompanionSpell = useAppStore((state) => state.updateCompanionSpell);
  const removeCompanionSpell = useAppStore((state) => state.removeCompanionSpell);
  const updateCompanionCurrency = useAppStore((state) => state.updateCharacterCurrency);
  const settings = useAppStore((state) => state.settings);

  const [selectedId, setSelectedId] = useState<string | null>(companions[0]?.id ?? null);
  const [activeTab, setActiveTab] = useState<CompanionTab>('stats');
  const [referenceSearch, setReferenceSearch] = useState('');

  const referenceCreatures = useOpen5eResource('monsters', {
    document__slug: settings.referenceDocumentFilter,
    search: referenceSearch,
    limit: 12,
  });

  useEffect(() => {
    const nextId =
      selectedId && companions.some((c) => c.id === selectedId)
        ? selectedId
        : (companions[0]?.id ?? null);
    if (nextId !== selectedId) setSelectedId(nextId);
  }, [companions, selectedId]);

  const selectedCompanion = useMemo(
    () => companions.find((c) => c.id === selectedId) ?? null,
    [companions, selectedId]
  );

  if (!character) {
    return (
      <EmptyState title="Character not found" description="Open a character to manage companions." />
    );
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Companions</p>
          <h1>{character.name}</h1>
          <p>Manage pets, familiars, summons, mounts, and linked follower sheets.</p>
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
                className={selectedId === companion.id ? 'list-button list-button--active' : 'list-button'}
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
          <div className="stack-list" aria-label="Open5e creature reference">
            {referenceCreatures.loading && referenceCreatures.items.length === 0 ? (
              <LoadingSkeleton rows={3} variant="card" label="Loading creatures…" />
            ) : null}
            {referenceCreatures.error ? (
              <p role="alert" className="callout">{referenceCreatures.error}</p>
            ) : null}
            {referenceCreatures.items.map((creature) => (
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
          <div className="stack">
            <CompanionCard
              companion={selectedCompanion}
              onUpdate={(updater) => updateCompanion(selectedCompanion.id, updater)}
            >
              <div className="tab-bar" role="tablist" aria-label="Companion sections">
                {(['stats', 'spellbook', 'inventory'] as CompanionTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab}
                    aria-controls={`companion-tab-${tab}`}
                    id={`companion-tab-btn-${tab}`}
                    className={activeTab === tab ? 'tab-button tab-button--active' : 'tab-button'}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {activeTab === 'stats' ? (
                <div role="tabpanel" id="companion-tab-stats" aria-labelledby="companion-tab-btn-stats">
                  <CompanionStatBlock
                    companion={selectedCompanion}
                    onUpdate={(updater) => updateCompanion(selectedCompanion.id, updater)}
                  />
                </div>
              ) : null}

              {activeTab === 'spellbook' ? (
                <div role="tabpanel" id="companion-tab-spellbook" aria-labelledby="companion-tab-btn-spellbook">
                  <SpellbookSection
                    character={selectedCompanion as never}
                    onUpdateSpellSlot={() => {}}
                    onUpdatePactMagic={() => {}}
                    onAddSpell={() => addCompanionSpell(selectedCompanion.id)}
                    onUpdateSpell={(spellId, updater) =>
                      updateCompanionSpell(selectedCompanion.id, spellId, updater)
                    }
                    onRemoveSpell={(spellId) => removeCompanionSpell(selectedCompanion.id, spellId)}
                  />
                </div>
              ) : null}

              {activeTab === 'inventory' ? (
                <div role="tabpanel" id="companion-tab-inventory" aria-labelledby="companion-tab-btn-inventory">
                  <InventorySection
                    character={selectedCompanion as never}
                    onAddItem={() => addCompanionItem(selectedCompanion.id)}
                    onUpdateItem={(itemId, updater) =>
                      updateCompanionItem(selectedCompanion.id, itemId, updater)
                    }
                    onRemoveItem={(itemId) => removeCompanionItem(selectedCompanion.id, itemId)}
                    onMoveItem={(itemId, containerId) =>
                      moveCompanionItem(selectedCompanion.id, itemId, containerId)
                    }
                    onUpdateCurrency={(updater) =>
                      updateCompanionCurrency(selectedCompanion.id, updater)
                    }
                  />
                </div>
              ) : null}
            </CompanionCard>

            <button
              type="button"
              className="button button--ghost button--danger"
              onClick={() => deleteCompanion(selectedCompanion.id)}
            >
              Delete Companion
            </button>
          </div>
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
