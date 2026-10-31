import React from 'react';

/**
 * Reusable EmptyState component for empty collections or no search results.
 * Renders title, optional description, and optional action slot.
 */
export function EmptyState({
  title = 'No items found',
  description,
  action,
  icon,
  className = ''
}) {
  return (
    <div
      className={`text-center py-12 px-4 rounded-xl border border-dashed border-border dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center transition-colors ${className}`.trim()}
    >
      <div
        className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-muted dark:text-slate-400 mb-3"
        aria-hidden="true"
      >
        {icon || (
          <svg
            className="w-6 h-6 text-slate-400 dark:text-slate-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        )}
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-muted dark:text-slate-400 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
