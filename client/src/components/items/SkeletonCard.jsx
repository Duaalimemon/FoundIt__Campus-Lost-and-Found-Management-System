import React from 'react';

/**
 * Reusable loading placeholder skeleton matching ItemCard layout.
 * Respects prefers-reduced-motion via motion-reduce:animate-none.
 */
export function SkeletonCard({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between animate-pulse motion-reduce:animate-none ${className}`.trim()}
    >
      <div>
        {/* Header: Category & Status placeholder pills */}
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
          <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>

        {/* Thumbnail / Image placeholder */}
        <div className="h-36 w-full bg-slate-200 dark:bg-slate-800 rounded-lg mb-4" />

        {/* Title placeholder */}
        <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded mb-2" />

        {/* Description placeholders */}
        <div className="space-y-1.5 mb-4">
          <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
          <div className="h-3.5 w-5/6 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>

        {/* Location & Date metadata */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <div className="h-3.5 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <div className="h-3.5 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>
      </div>

      {/* Action button placeholder */}
      <div className="h-9 w-full bg-slate-200 dark:bg-slate-800 rounded-lg mt-5" />
    </div>
  );
}

export default SkeletonCard;
