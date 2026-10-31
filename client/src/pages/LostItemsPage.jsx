import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FilterBar from '../components/items/FilterBar';
import ItemGrid from '../components/items/ItemGrid';
import Pagination from '../components/common/Pagination';
import Button from '../components/common/Button';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { getLostItems } from '../api/lostItems';

export default function LostItemsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ q: '', category: '', status: '' });
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  // Sequence ref to prevent stale responses from overwriting newer query results
  const requestSeq = useRef(0);

  const fetchItems = useCallback(async () => {
    const currentSeq = ++requestSeq.current;
    setIsLoading(true);
    setError(null);

    const queryParams = {
      page,
      limit: 12
    };

    if (filters.q && filters.q.trim()) {
      queryParams.q = filters.q.trim();
    }
    if (filters.category) {
      queryParams.category = filters.category;
    }
    if (filters.status) {
      queryParams.status = filters.status;
    }
    if (filters.dateFrom) {
      queryParams.dateFrom = filters.dateFrom;
    }
    if (filters.dateTo) {
      queryParams.dateTo = filters.dateTo;
    }

    try {
      const res = await getLostItems(queryParams);
      // Guard against stale asynchronous resolution
      if (currentSeq === requestSeq.current && res) {
        setItems(Array.isArray(res.data) ? res.data : []);
        if (res.meta) {
          setMeta(res.meta);
        }
      }
    } catch (err) {
      if (currentSeq === requestSeq.current) {
        setError(err.message || 'Failed to load lost items. Please try again.');
        setItems([]);
      }
    } finally {
      if (currentSeq === requestSeq.current) {
        setIsLoading(false);
      }
    }
  }, [filters, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filtering
  };

  const handleResetFilters = () => {
    setFilters({ q: '', category: '', status: '' });
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemClick = (item) => {
    if (item?._id) {
      navigate(`/lost/${item._id}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-6 border-b border-border dark:border-slate-800">
        <div>
          <Breadcrumbs
            className="mb-1"
            items={[
              { label: 'Home', to: '/' },
              { label: 'Lost Items' }
            ]}
          />
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Lost Items on Campus
          </h1>
          <p className="text-sm text-muted dark:text-slate-400 mt-1">
            Browse reports of missing items or file a new lost report to notify security and students.
          </p>
        </div>

        <div>
          <Link to="/lost/new">
            <Button variant="primary" size="md">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Report a Lost Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6">
        <FilterBar
          filters={filters}
          itemType="lost"
          isLoading={isLoading}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </div>

      {/* Items Grid */}
      <ItemGrid
        items={items}
        loading={isLoading}
        error={error}
        onRetry={fetchItems}
        onItemClick={handleItemClick}
        emptyTitle="No Lost Items Found"
        emptyMessage="No reports match your current search and filter criteria."
      />

      {/* Pagination Controls */}
      <div className="mt-8 flex justify-center">
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
