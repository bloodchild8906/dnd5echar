import { useState } from 'react';
import { Badge } from '../../components/common/Badge';
import { CapacityBar } from '../../components/common/CapacityBar';
import { ContainerTree } from '../../components/common/ContainerTree';
import { DraggableItemRow } from '../../components/common/DraggableItemRow';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { SearchBar } from '../../components/common/SearchBar';
import { SectionCard } from '../../components/common/SectionCard';
import { TagInput } from '../../components/common/TagInput';
import { CharacterTabs } from '../../components/layout/CharacterTabs';
import {
  getAttunedItemCount,
  getCarryCapacity,
  getEncumbranceStatus,
  getTotalCarriedWeight,
} from '../../domain/derived';
import { useCurrentCharacter } from '../../hooks/useCurrentCharacter';
import { useOpen5eResource } from '../../hooks/useOpen5eResource';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrencyValue } from '../../utils/format';
import { parseNumber } from '../../utils/numbers';
import { referenceToInventoryItem } from '../../services/open5e/normalizers';
import { getMergedHomebrewData } from '../../domain/derived';

const referenceKinds = ['weapons', 'armor', 'magicitems'] as const;

export const InventoryPage = () => {
  const { character } = useCurrentCharacter();
  const addCharacterItem = useAppStore((state) => state.addCharacterItem);
  const updateCharacterItem = useAppStore((state) => state.updateCharacterItem);
  const removeCharacterItem = useAppStore((state) => state.removeCharacterItem);
  const moveCharacterItem = useAppStore((state) => state.moveCharacterItem);
  const addCharacterContainer = useAppStore((state) => state.addCharacterContainer);
  const updateCharacterCurrency = useAppStore((state) => state.updateCharacterCurrency);
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const settings = useAppStore((state) => state.settings);
  const homebrewItems = useAppStore((state) =>
    state.homebrew.filter((entry) => entry.entityType === 'item')
  );
  const [search, setSearch] = useState('');
  const [referenceSearch, setReferenceSearch] = useState('');
  const [resource, setResource] = useState<(typeof referenceKinds)[number]>('weapons');

  const references = useOpen5eResource(resource, {
    document__slug: settings.referenceDocumentFilter,
    search: referenceSearch,
    limit: 18,
  });

  if (!character) {
    return (
      <EmptyState
        title="Character not found"
        description="Select a character to manage inventory."
      />
    );
  }

  const filteredItems = character.inventory.items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1>{character.name}</h1>
          <p>Track carried weight, attunement, nested containers, charges, and quick-use items.</p>
        </div>
      </section>

      <CharacterTabs characterId={character.id} />

      <SectionCard
        title="Inventory Summary"
        actions={
          <Badge tone={getEncumbranceStatus(character) === 'encumbered' ? 'warning' : 'success'}>
            {settings.encumbranceMode === 'off'
              ? 'Encumbrance Off'
              : getEncumbranceStatus(character)}
          </Badge>
        }
      >
        <div className="stats-row stats-row--dense">
          <div className="sheet-chip">
            Carry Weight: {getTotalCarriedWeight(character.inventory.items).toFixed(1)} lb
          </div>
          <div className="sheet-chip">Capacity: {getCarryCapacity(character)} lb</div>
          <div className="sheet-chip">
            Attuned Items: {getAttunedItemCount(character.inventory.items)}
          </div>
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
                  updateCharacterCurrency(character.id, (wallet) => ({
                    ...wallet,
                    [coin]: parseNumber(event.target.value),
                  }))
                }
              />
            </label>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Backpack and Equipment"
        actions={
          <div className="button-row">
            <button type="button" className="button" onClick={() => addCharacterItem(character.id)}>
              Add Item
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => addCharacterContainer(character.id)}
            >
              Add Container
            </button>
          </div>
        }
      >
        <div className="split-layout split-layout--sidebar">
          <ContainerTree
            containers={character.inventory.containers}
            items={character.inventory.items}
            selectedContainerId={selectedContainerId}
            onSelectContainer={setSelectedContainerId}
          />
          <div>
            {(() => {
              const selectedContainer =
                selectedContainerId !== null
                  ? character.inventory.containers.find((c) => c.id === selectedContainerId)
                  : null;
              const visibleItems =
                selectedContainerId === null
                  ? character.inventory.items.filter((i) => !i.containerId)
                  : character.inventory.items.filter((i) => i.containerId === selectedContainerId);
              const containerWeight = visibleItems.reduce(
                (sum, i) => sum + i.weight * i.quantity,
                0
              );
              return (
                <>
                  {selectedContainer?.weightCapacity !== undefined ? (
                    <CapacityBar
                      currentWeight={containerWeight}
                      weightCapacity={selectedContainer.weightCapacity}
                      label={`${selectedContainer.name} capacity`}
                    />
                  ) : null}
                  <div className="toolbar">
                    <SearchBar value={search} placeholder="Filter items" onChange={setSearch} />
                  </div>
                  <div className="stack-list">
                    {visibleItems
                      .filter(
                        (item) =>
                          !search ||
                          item.name.toLowerCase().includes(search.toLowerCase()) ||
                          item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
                      )
                      .map((item) => (
                        <DraggableItemRow
                          key={item.id}
                          item={item}
                          containerId={selectedContainerId}
                          onMove={(itemId, cid) => moveCharacterItem(character.id, itemId, cid)}
                          onEdit={(i) =>
                            updateCharacterItem(character.id, i.id, () => i)
                          }
                          onRemove={(itemId) => removeCharacterItem(character.id, itemId)}
                        />
                      ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Reference and Homebrew Items"
        subtitle="Clone canonical data into local inventory without mutating source records."
      >
        <div className="toolbar">
          <label>
            <span className="sr-only">Item category</span>
            <select
              className="input"
              aria-label="Item category"
              value={resource}
              onChange={(event) =>
                setResource(event.target.value as (typeof referenceKinds)[number])
              }
            >
              {referenceKinds.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>
          <SearchBar
            value={referenceSearch}
            placeholder="Search Open5e items"
            onChange={setReferenceSearch}
          />
        </div>
        {references.loading && references.items.length === 0 ? (
          <LoadingSkeleton rows={3} variant="card" label="Loading reference items…" />
        ) : null}
        {references.error ? (
          <p role="alert" className="callout">{references.error}</p>
        ) : null}
        <div className="stack-list">
          {references.items.map((entry) => (
            <article key={entry.id} className="spell-card spell-card--compact">
              <div>
                <h3>{entry.name}</h3>
                <p>{entry.summary}</p>
              </div>
              <button
                type="button"
                className="button"
                onClick={() =>
                  addCharacterItem(character.id, referenceToInventoryItem(resource, entry.raw))
                }
              >
                Add Item
              </button>
            </article>
          ))}
          {homebrewItems.map((entry) => {
            const merged = getMergedHomebrewData<Record<string, unknown>>(entry);
            return (
              <article key={entry.id} className="spell-card spell-card--compact">
                <div>
                  <h3>{String(merged.name ?? entry.name)}</h3>
                  <p>{entry.summary}</p>
                </div>
                <button
                  type="button"
                  className="button"
                  onClick={() =>
                    addCharacterItem(character.id, {
                      id: entry.id,
                      name: String(merged.name ?? entry.name),
                      description: String(merged.description ?? entry.summary),
                      quantity: 1,
                      weight: Number(merged.weight ?? 0),
                      value: { amount: Number(merged.value ?? 0), denomination: 'gp' },
                      rarity: String(merged.rarity ?? 'Homebrew'),
                      attunementRequired: Boolean(merged.attunementRequired ?? false),
                      attuned: false,
                      equipped: false,
                      consumable: Boolean(merged.consumable ?? false),
                      tags: entry.tags,
                      notes: entry.notes,
                      containerId: null,
                      sourceRef: entry.sourceRef,
                    })
                  }
                >
                  Add Homebrew Item
                </button>
              </article>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
};
