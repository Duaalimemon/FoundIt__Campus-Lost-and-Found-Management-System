import React from 'react';

/**
 * Reusable ErrorAlert component for displaying accessible error messages.
 * Uses role="alert" and aria-live="assertive" for immediate assistive announcement.
 * Renders null when no meaningful content (title, message, or children) is provided.
 */
export function ErrorAlert({
  title,
  message,
  children,
  onDismiss,
  className = ''
}) {
  if (!title && !message && !children) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-4 text-red-900 dark:text-red-200 flex items-start justify-between gap-3 ${className}`.trim()}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <svg
          className="w-5 h-5 text-danger dark:text-red-400 flex-shrink-0 mt-0.5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-0.5">
              {title}
            </h4>
          )}
          {message && (
            <div className="text-sm text-red-800 dark:text-red-300 break-words">
              {message}
            </div>
          )}
          {children && (
            <div className="mt-2 text-sm text-red-800 dark:text-red-300">
              {children}
            </div>
          )}
        </div>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 p-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-danger"
        >
          <svg
            className="w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default ErrorAlert;
