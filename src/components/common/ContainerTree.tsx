import { useState } from 'react';
import { InventoryContainer, InventoryItem } from '../../domain/models';

interface ContainerTreeProps {
  containers: InventoryContainer[];
  items: InventoryItem[];
  selectedContainerId: string | null;
  onSelectContainer: (containerId: string | null) => void;
}

interface ContainerNodeProps {
  container: InventoryContainer;
  containers: InventoryContainer[];
  items: InventoryItem[];
  depth: number;
  selectedContainerId: string | null;
  onSelectContainer: (containerId: string | null) => void;
}

const ContainerNode = ({
  container,
  containers,
  items,
  depth,
  selectedContainerId,
  onSelectContainer,
}: ContainerNodeProps) => {
  const [expanded, setExpanded] = useState(true);
  const children = containers.filter((c) => c.parentId === container.id);
  const itemCount = items.filter((i) => i.containerId === container.id).length;
  const isSelected = selectedContainerId === container.id;

  return (
    <div className="container-tree__node" style={{ paddingLeft: `${depth * 16}px` }}>
      <button
        type="button"
        className={`container-tree__row${isSelected ? ' container-tree__row--active' : ''}`}
        onClick={() => onSelectContainer(container.id)}
        aria-pressed={isSelected}
      >
        {children.length > 0 ? (
          <span
            className="container-tree__toggle"
            role="button"
            tabIndex={0}
            aria-label={expanded ? 'Collapse' : 'Expand'}
            aria-expanded={expanded}
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setExpanded((v) => !v); } }}
          >
            {expanded ? '▾' : '▸'}
          </span>
        ) : (
          <span className="container-tree__toggle container-tree__toggle--leaf">·</span>
        )}
        <span className="container-tree__name">{container.name}</span>
        <span className="container-tree__count">{itemCount}</span>
      </button>
      {expanded &&
        children.map((child) => (
          <ContainerNode
            key={child.id}
            container={child}
            containers={containers}
            items={items}
            depth={depth + 1}
            selectedContainerId={selectedContainerId}
            onSelectContainer={onSelectContainer}
          />
        ))}
    </div>
  );
};

export const ContainerTree = ({
  containers,
  items,
  selectedContainerId,
  onSelectContainer,
}: ContainerTreeProps) => {
  const roots = containers.filter((c) => !c.parentId);

  return (
    <div className="container-tree" role="tree" aria-label="Container hierarchy">
      <button
        type="button"
        className={`container-tree__row${selectedContainerId === null ? ' container-tree__row--active' : ''}`}
        onClick={() => onSelectContainer(null)}
        aria-pressed={selectedContainerId === null}
      >
        <span className="container-tree__toggle container-tree__toggle--leaf">·</span>
        <span className="container-tree__name">Uncontained</span>
        <span className="container-tree__count">
          {items.filter((i) => !i.containerId).length}
        </span>
      </button>
      {roots.map((container) => (
        <ContainerNode
          key={container.id}
          container={container}
          containers={containers}
          items={items}
          depth={0}
          selectedContainerId={selectedContainerId}
          onSelectContainer={onSelectContainer}
        />
      ))}
    </div>
  );
};
