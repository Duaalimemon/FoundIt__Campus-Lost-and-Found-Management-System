import React from 'react';

/**
 * Helper to compute an accessible array of page numbers and ellipsis tokens.
 * E.g., [1, 2, 3, 4, 5, '...', 12] or [1, '...', 5, 6, 7, '...', 12]
 */
function getPageRange(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Near the beginning
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }

  // Near the end
  if (currentPage >= totalPages - 3) {
    return [
      1,
      '...',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  // Middle
  return [
    1,
    '...',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    '...',
    totalPages,
  ];
}

/**
 * Reusable Pagination component for navigating paginated listings.
 */
export function Pagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  className = '',
}) {
  const safeCurrent = Math.max(1, Number(page) || 1);
  const safeTotal = Math.max(1, Number(totalPages) || 1);

  // If there is only 1 page (or 0), do not display redundant navigation
  if (safeTotal <= 1) {
    return null;
  }

  const pages = getPageRange(safeCurrent, safeTotal);

  const handlePageClick = (p) => {
    if (typeof p !== 'number') return;
    if (p < 1 || p > safeTotal || p === safeCurrent) return;
    onPageChange?.(p);
  };

  const handlePrev = () => {
    if (safeCurrent > 1) {
      onPageChange?.(safeCurrent - 1);
    }
  };

  const handleNext = () => {
    if (safeCurrent < safeTotal) {
      onPageChange?.(safeCurrent + 1);
    }
  };

  const isFirstPage = safeCurrent <= 1;
  const isLastPage = safeCurrent >= safeTotal;

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={`flex items-center justify-center gap-1 sm:gap-2 my-8 ${className}`.trim()}
    >
      {/* Previous Page Button */}
      <button
        type="button"
        disabled={isFirstPage}
        onClick={handlePrev}
        aria-label="Go to previous page"
        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-border dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:bg-slate-50 dark:disabled:bg-slate-950 disabled:text-slate-300 dark:disabled:text-slate-600 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-400"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span className="hidden sm:inline">Previous</span>
      </button>

      {/* Mobile Page Indicator (prevents horizontal overflow on <= 360px viewports) */}
      <div className="flex sm:hidden items-center px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 select-none">
        Page {safeCurrent} of {safeTotal}
      </div>

      {/* Desktop Numbered Page Buttons & Ellipses */}
      <div className="hidden sm:flex items-center gap-1">
        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 py-1 text-sm text-muted dark:text-slate-500 select-none"
                aria-hidden="true"
              >
                &hellip;
              </span>
            );
          }

          const isActive = p === safeCurrent;

          return (
            <button
              key={`page-${p}`}
              type="button"
              onClick={() => handlePageClick(p)}
              aria-label={isActive ? `Page ${p}` : `Go to page ${p}`}
              aria-current={isActive ? 'page' : undefined}
              className={`min-w-[2.25rem] h-9 px-3 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 ${
                isActive
                  ? 'bg-primary text-white shadow-sm font-semibold'
                  : 'bg-white dark:bg-slate-900 border border-border dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>

      {/* Next Page Button */}
      <button
        type="button"
        disabled={isLastPage}
        onClick={handleNext}
        aria-label="Go to next page"
        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-border dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:bg-slate-50 dark:disabled:bg-slate-950 disabled:text-slate-300 dark:disabled:text-slate-600 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-400"
      >
        <span className="hidden sm:inline">Next</span>
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
}

export default Pagination;
