import { useState } from 'react';
import { InventoryItem } from '../../domain/models';
import { ItemVisibilityBadge } from './ItemVisibilityBadge';

const DRAG_TYPE = 'application/x-inventory-item';

interface DraggableItemRowProps {
  item: InventoryItem;
  isGm?: boolean;
  onMove: (itemId: string, targetContainerId: string | null) => void;
  onEdit?: (item: InventoryItem) => void;
  onRemove?: (itemId: string) => void;
  /** containerId this row is rendered inside — used as drop target */
  containerId: string | null;
}

export const DraggableItemRow = ({
  item,
  isGm = false,
  onMove,
  onEdit,
  onRemove,
  containerId,
}: DraggableItemRowProps) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(DRAG_TYPE, item.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(DRAG_TYPE)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOver(true);
    }
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const draggedId = e.dataTransfer.getData(DRAG_TYPE);
    if (draggedId && draggedId !== item.id) {
      onMove(draggedId, containerId);
    }
  };

  return (
    <div
      className={`item-row${dragOver ? ' item-row--drag-over' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-label={`${item.name}, quantity ${item.quantity}`}
    >
      <span className="item-row__name">{item.name}</span>
      <span className="item-row__qty">×{item.quantity}</span>
      <span className="item-row__weight">{(item.weight * item.quantity).toFixed(1)} lb</span>
      <ItemVisibilityBadge item={item} isGm={isGm} />
      <div className="item-row__actions">
        {onEdit ? (
          <button
            type="button"
            className="button button--ghost button--small"
            onClick={() => onEdit(item)}
            aria-label={`Edit ${item.name}`}
          >
            Edit
          </button>
        ) : null}
        {onRemove ? (
          <button
            type="button"
            className="button button--ghost button--small"
            onClick={() => onRemove(item.id)}
            aria-label={`Remove ${item.name}`}
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
};
