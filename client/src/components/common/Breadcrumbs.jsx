import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Accessible Breadcrumbs navigation component.
 * Uses semantic <nav> and <ol> list structure.
 * Separates segments with decorative chevron-right icons (no raw slashes).
 * Distinguishes the final/current page as non-link text with aria-current="page".
 *
 * @param {Array<{ label: string, to?: string }>} items - Breadcrumb items in hierarchy order
 * @param {string} [className] - Optional extra class names for container
 */
export default function Breadcrumbs({ items = [], className = '' }) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      className={`text-xs text-muted dark:text-slate-400 mb-4 ${className}`.trim()}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center flex-wrap gap-1 sm:gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <li
                  className="flex items-center text-slate-400 dark:text-slate-500 select-none"
                  aria-hidden="true"
                >
                  <svg
                    className="w-3.5 h-3.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </li>
              )}
              <li className="flex items-center min-w-0">
                {item.to && !isLast ? (
                  <Link
                    to={item.to}
                    className="hover:text-primary dark:hover:text-blue-400 transition-colors font-medium truncate"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className="text-slate-700 dark:text-slate-200 font-semibold truncate max-w-xs sm:max-w-md"
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

