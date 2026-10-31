import React from 'react';
import ItemCard from './ItemCard';
import SkeletonCard from './SkeletonCard';
import { EmptyState } from '../common/EmptyState';

/**
 * Reusable responsive ItemGrid component.
 * Features:
 * - Renders a responsive 1-to-3 column grid
 * - Handles loading state with a collection of SkeletonCards
 * - Handles empty states via shared EmptyState component
 * - Uses stable unique keys from item._id or item.id
 */
export function ItemGrid({
  items = [],
  isLoading = false,
  skeletonCount = 6,
  emptyTitle = 'No items found',
  emptyDescription = 'There are no items matching your criteria. Try adjusting your search filters or check back later.',
  emptyAction,
  onItemClick,
  actionRenderer,
  className = '',
}) {
  // 1. Loading state: render grid of skeletons
  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Loading items"
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`.trim()}
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <SkeletonCard key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  // 2. Empty state: render EmptyState feedback component
  if (!items || items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className={className}
      />
    );
  }

  // 3. Populated state: render grid of ItemCards with stable unique keys
  const seenKeys = new Set();

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`.trim()}
    >
      {items.map((item, index) => {
        // 1. Prefer persisted primary identifier (_id or id)
        const rawId = item._id || item.id;
        let baseKey;

        if (
          (typeof rawId === 'string' && rawId.trim().length > 0) ||
          typeof rawId === 'number'
        ) {
          baseKey = String(rawId);
        } else if (
          item.title &&
          (item.createdAt || item.dateLost || item.dateFound)
        ) {
          // 2. Deterministic fallback derived from immutable item properties
          baseKey = `item-${item.title}-${item.createdAt || item.dateLost || item.dateFound}`;
        } else {
          // 3. Fallback when item lacks distinguishing properties
          baseKey = `item-${index}`;
        }

        // 4. Guard against duplicate keys in malformed or repeated collections
        const key = seenKeys.has(baseKey) ? `${baseKey}-dup-${index}` : baseKey;
        seenKeys.add(baseKey);
        seenKeys.add(key);

        const action = actionRenderer ? actionRenderer(item) : undefined;

        return (
          <ItemCard
            key={key}
            item={item}
            onClick={onItemClick}
            action={action}
          />
        );
      })}
    </div>
  );
}

export default ItemGrid;
