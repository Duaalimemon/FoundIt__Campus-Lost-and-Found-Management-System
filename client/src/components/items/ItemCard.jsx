import React, { useState } from 'react';
import StatusBadge from '../StatusBadge';
import { formatDate } from '../../utils/format';
import Button from '../common/Button';

/**
 * Category-based fallback icon graphics.
 */
function CategoryIcon({ category, className = 'w-10 h-10 text-slate-400' }) {
  switch (category) {
    case 'ID Card':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.364a4.125 4.125 0 00-6.338 0" />
        </svg>
      );
    case 'Electronics':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
        </svg>
      );
    case 'Keys':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
      );
    case 'Wallet':
    case 'Bag':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.25v4.5a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-4.5m16.5 0v-4.5A2.25 2.25 0 0018 7.5H6a2.25 2.25 0 00-2.25 2.25v4.5m16.5 0h-16.5" />
        </svg>
      );
    case 'Book':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      );
  }
}

/**
 * Reusable ItemCard component for displaying a single lost or found item.
 * Privacy rule: Strictly displays public fields (title, category, description, location, date, status).
 * Never exposes contact or finder details.
 */
export function ItemCard({
  item,
  onClick,
  action,
  className = '',
}) {
  const [imageError, setImageError] = useState(false);

  if (!item) return null;

  const {
    title = 'Untitled Item',
    category = 'Other',
    description = '',
    status,
    lastSeenLocation,
    foundLocation,
    dateLost,
    dateFound,
    createdAt,
    imageUrl,
    image,
  } = item;

  // Resolve location & date depending on whether item is lost or found
  const location = lastSeenLocation || foundLocation || item.location || 'Campus';
  const itemDate = dateLost || dateFound || createdAt;
  const resolvedImage = !imageError ? imageUrl || image : null;

  const handleClick = (e) => {
    if (onClick) {
      onClick(item, e);
    }
  };

  return (
    <article
      onClick={onClick ? handleClick : undefined}
      className={`bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 shadow-sm hover:shadow-md dark:hover:border-slate-700 transition-all overflow-hidden flex flex-col justify-between group ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`.trim()}
    >
      <div>
        {/* Top visual area: Image or Category placeholder */}
        <div className="relative h-44 w-full bg-slate-50 dark:bg-slate-800/60 border-b border-border dark:border-slate-800 flex items-center justify-center overflow-hidden">
          {resolvedImage ? (
            <img
              src={resolvedImage}
              alt={title}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-4">
              <CategoryIcon category={category} className="w-12 h-12 mb-1 text-slate-400 dark:text-slate-500 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {category}
              </span>
            </div>
          )}

          {/* Floating Status Badge */}
          {status && (
            <div className="absolute top-3 right-3 shadow-sm">
              <StatusBadge status={status} />
            </div>
          )}
        </div>

        {/* Content body */}
        <div className="p-5">
          {/* Category pill */}
          <div className="mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary dark:text-blue-400">
              {category}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">
            {title}
          </h3>

          {/* Description */}
          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 leading-relaxed">
            {description || 'No additional description provided.'}
          </p>

          {/* Metadata: Location and Date */}
          <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-muted dark:text-slate-400">
            <div className="flex items-center gap-1.5 truncate">
              <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{location}</span>
            </div>

            <div className="flex items-center gap-1.5 truncate">
              <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(itemDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action footer */}
      {action ? (
        <div className="px-5 pb-5 pt-0">
          {action}
        </div>
      ) : onClick ? (
        <div className="px-5 pb-5 pt-0">
          <Button variant="outline" size="sm" fullWidth>
            View Details
          </Button>
        </div>
      ) : null}
    </article>
  );
}

export default ItemCard;
