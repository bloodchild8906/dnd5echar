import { InventoryItem } from '../../domain/models';

interface ItemVisibilityBadgeProps {
  item: InventoryItem;
  /** Whether the current viewer has GM privileges */
  isGm?: boolean;
}

/**
 * Shows cursed / unidentified / locked badges.
 * GM-only items are hidden from players until gmVisibleOnly is false or revealedAt is set.
 */
export const ItemVisibilityBadge = ({ item, isGm = false }: ItemVisibilityBadgeProps) => {
  const isRevealed = item.gmVisibleOnly === false || Boolean(item.revealedAt);
  const playerCanSee = isGm || isRevealed;

  if (!playerCanSee) return null;

  const badges: { label: string; className: string }[] = [];

  if (item.cursed) {
    badges.push({ label: 'Cursed', className: 'status-pill status-pill--danger' });
  }
  if (item.identified === false) {
    badges.push({ label: 'Unidentified', className: 'status-pill status-pill--warn' });
  }
  if (item.locked) {
    badges.push({ label: 'Locked', className: 'status-pill' });
  }
  if (item.gmVisibleOnly && isGm) {
    badges.push({ label: 'GM only', className: 'status-pill status-pill--warn' });
  }

  if (badges.length === 0) return null;

  return (
    <span className="inline-badges" aria-label="Item status badges">
      {badges.map((badge) => (
        <span key={badge.label} className={badge.className}>
          {badge.label}
        </span>
      ))}
    </span>
  );
};
