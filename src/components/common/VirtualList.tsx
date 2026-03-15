import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

const VIRTUAL_THRESHOLD = 50;

interface VirtualListProps<T> {
  items: T[];
  /** Estimated row height in px — used for initial layout; actual height is measured. */
  estimateSize?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  /** CSS class applied to the outer scroll container. */
  className?: string;
  /** Max height of the scroll container (default: 480px). */
  maxHeight?: number;
  /** Key extractor — defaults to index. */
  getKey?: (item: T, index: number) => string | number;
}

/**
 * Renders a virtualised list when `items.length > VIRTUAL_THRESHOLD (50)`.
 * Falls back to a plain render for smaller lists to avoid virtualiser overhead.
 */
export const VirtualList = <T,>({
  items,
  estimateSize = 48,
  renderItem,
  className,
  maxHeight = 480,
  getKey,
}: VirtualListProps<T>) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 5,
  });

  // For small lists skip virtualisation entirely
  if (items.length <= VIRTUAL_THRESHOLD) {
    return (
      <div className={className}>
        {items.map((item, index) => (
          <div key={getKey ? getKey(item, index) : index}>{renderItem(item, index)}</div>
        ))}
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div
      ref={parentRef}
      className={className}
      style={{ maxHeight, overflowY: 'auto' }}
      role="list"
    >
      <div style={{ height: totalSize, width: '100%', position: 'relative' }}>
        {virtualItems.map((virtualRow) => {
          const item = items[virtualRow.index];
          return (
            <div
              key={getKey ? getKey(item, virtualRow.index) : virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              role="listitem"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderItem(item, virtualRow.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
};
