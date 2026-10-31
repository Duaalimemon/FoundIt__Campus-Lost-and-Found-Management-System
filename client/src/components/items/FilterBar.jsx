import React from 'react';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { CATEGORIES, LOST_STATUSES, FOUND_STATUSES } from '../../utils/constants';

/**
 * Reusable FilterBar component for lost and found listings.
 * Integrates search keyword, category selection, status filter, and reset action.
 */
export function FilterBar({
  filters = { q: '', category: '', status: '' },
  onFilterChange,
  onReset,
  itemType = 'lost',
  isLoading = false,
  className = '',
}) {
  const currentQ = filters.q ?? filters.search ?? '';
  const currentCategory = filters.category ?? '';
  const currentStatus = filters.status ?? '';

  const hasActiveFilters = Boolean(currentQ || currentCategory || currentStatus);

  const handleSearchChange = (e) => {
    onFilterChange?.({
      ...filters,
      q: e.target.value,
      search: e.target.value,
    });
  };

  const handleCategoryChange = (e) => {
    onFilterChange?.({
      ...filters,
      category: e.target.value,
    });
  };

  const handleStatusChange = (e) => {
    onFilterChange?.({
      ...filters,
      status: e.target.value,
    });
  };

  const handleClear = () => {
    if (onReset) {
      onReset();
    } else {
      onFilterChange?.({
        q: '',
        search: '',
        category: '',
        status: '',
      });
    }
  };

  // Determine available statuses based on item type
  const availableStatuses = itemType === 'found' ? FOUND_STATUSES : LOST_STATUSES;

  const categoryOptions = CATEGORIES.map((cat) => ({
    value: cat,
    label: cat,
  }));

  const statusOptions = availableStatuses.map((st) => ({
    value: st,
    label: st.charAt(0).toUpperCase() + st.slice(1),
  }));

  return (
    <form
      role="search"
      aria-label="Filter items"
      onSubmit={(e) => e.preventDefault()}
      className={`bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 p-4 sm:p-5 shadow-sm mb-6 transition-colors duration-200 ${className}`.trim()}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        {/* Search input */}
        <Input
          id="filter-search-input"
          label="Search Keyword"
          placeholder="Title, description, location..."
          value={currentQ}
          onChange={handleSearchChange}
          disabled={isLoading}
        />

        {/* Category select */}
        <Select
          id="filter-category-select"
          label="Category"
          placeholder="All Categories"
          options={categoryOptions}
          value={currentCategory}
          onChange={handleCategoryChange}
          disabled={isLoading}
        />

        {/* Status select */}
        <Select
          id="filter-status-select"
          label="Status"
          placeholder="All Statuses"
          options={statusOptions}
          value={currentStatus}
          onChange={handleStatusChange}
          disabled={isLoading}
        />

        {/* Reset / Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={!hasActiveFilters || isLoading}
            fullWidth
          >
            Clear Filters
          </Button>
        </div>
      </div>
    </form>
  );
}

export default FilterBar;
