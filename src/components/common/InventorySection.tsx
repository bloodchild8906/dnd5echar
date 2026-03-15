import { useState } from 'react';
import { Character, CurrencyWallet, InventoryItem } from '../../domain/models';
import {
  getAttunedItemCount,
  getCarryCapacity,
  getEncumbranceStatus,
  getTotalCarriedWeight,
} from '../../domain/derived';
import { Badge } from './Badge';
import { CapacityBar } from './CapacityBar';
import { ContainerTree } from './ContainerTree';
import { DraggableItemRow } from './DraggableItemRow';
import { VirtualList } from './VirtualList';

interface InventorySectionProps {
  character: Character;
  isGm?: boolean;
  onAddItem: () => void;
  onUpdateItem: (itemId: string, updater: (item: InventoryItem) => InventoryItem) => void;
  onRemoveItem: (itemId: string) => void;
  onMoveItem: (itemId: string, containerId: string | null) => void;
  onUpdateCurrency: (updater: (currency: CurrencyWallet) => CurrencyWallet) => void;
}

export const InventorySection = ({
  character,
  isGm = false,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onMoveItem,
  onUpdateCurrency,
}: InventorySectionProps) => {
  const { items, containers } = character.inventory;
  const currency = character.currency;
  const totalWeight = getTotalCarriedWeight(items);
  const capacity = getCarryCapacity(character);
  const encumbered = getEncumbranceStatus(character) === 'encumbered';
  const attuned = getAttunedItemCount(items);
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);

  const visibleItems =
    selectedContainerId === null
      ? items.filter((i) => !i.containerId)
      : items.filter((i) => i.containerId === selectedContainerId);

  const selectedContainer =
    selectedContainerId !== null
      ? containers.find((c) => c.id === selectedContainerId)
      : null;

  const containerWeight = visibleItems.reduce((sum, i) => sum + i.weight * i.quantity, 0);

  return (
    <div className="inventory-section">
      <div className="stats-row">
        <div className="stat-tile">
          <span>Weight</span>
          <strong>
            {totalWeight.toFixed(1)} / {capacity} lb
          </strong>
          {encumbered && <Badge tone="warning">Encumbered</Badge>}
        </div>
        <div className="stat-tile">
          <span>Attuned</span>
          <strong>{attuned} / 3</strong>
          {attuned >= 3 && <Badge tone="warning">At limit</Badge>}
        </div>
      </div>

      <div className="callout">
        <strong>Currency</strong>
        <div className="form-grid form-grid--three">
          {(['cp', 'sp', 'ep', 'gp', 'pp'] as const).map((denom) => (
            <label key={denom}>
              {denom.toUpperCase()}
              <input
                className="input"
                type="number"
                value={currency[denom]}
                onChange={(e) =>
                  onUpdateCurrency((cur) => ({
                    ...cur,
                    [denom]: parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
            </label>
          ))}
        </div>
      </div>

      <button type="button" className="button" onClick={onAddItem}>
        + Add Item
      </button>

      <div className="split-layout split-layout--sidebar">
        <ContainerTree
          containers={containers}
          items={items}
          selectedContainerId={selectedContainerId}
          onSelectContainer={setSelectedContainerId}
        />

        <div className="inventory-section__items">
          {selectedContainer?.weightCapacity !== undefined ? (
            <CapacityBar
              currentWeight={containerWeight}
              weightCapacity={selectedContainer.weightCapacity}
              label={`${selectedContainer.name} capacity`}
            />
          ) : null}

          <div className="stack-list">
            <VirtualList
              items={visibleItems}
              estimateSize={52}
              maxHeight={400}
              getKey={(item) => item.id}
              renderItem={(item) => (
                <DraggableItemRow
                  item={item}
                  isGm={isGm}
                  containerId={selectedContainerId}
                  onMove={onMoveItem}
                  onEdit={(i) => onUpdateItem(i.id, () => i)}
                  onRemove={onRemoveItem}
                />
              )}
            />
            {visibleItems.length === 0 && <p className="empty-hint">No items here.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
