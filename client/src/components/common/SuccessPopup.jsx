import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Reusable accessible SuccessPopup component.
 * Features:
 * - Renders via React Portal into document.body to prevent parent stacking/overflow clipping
 * - Fixed near the top of the viewport (below sticky navbar) for immediate visibility
 * - Accessible with role="status" and aria-live="polite"
 * - Keyboard-friendly: Closes on Escape key press
 * - Auto-dismisses after a configurable delay (default: 6000ms) with proper timer cleanup
 * - Manual close button with accessible labeling
 * - Supports light and dark modes
 */
export default function SuccessPopup({
  isOpen = false,
  onClose,
  title,
  message,
  children,
  autoDismissMs = 6000,
  className = ''
}) {
  useEffect(() => {
    if (!isOpen) return;

    // Auto-dismiss timer with cleanup
    let timerId = null;
    if (autoDismissMs && autoDismissMs > 0) {
      timerId = setTimeout(() => {
        onClose?.();
      }, autoDismissMs);
    }

    // Keyboard listener: dismiss on Escape key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      if (timerId) clearTimeout(timerId);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, autoDismissMs, onClose]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  const popupContent = (
    <aside
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg bg-white dark:bg-slate-900 border-2 border-emerald-500 dark:border-emerald-500/80 rounded-xl shadow-2xl p-4 sm:p-5 text-slate-900 dark:text-white flex items-start gap-3.5 animate-in fade-in slide-in-from-top-4 duration-200 ${className}`.trim()}
    >
      {/* Success Icon */}
      <div
        className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5"
        aria-hidden="true"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Message Body */}
      <div className="flex-1 min-w-0 pr-1">
        {title && (
          <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
            {title}
          </h3>
        )}
        {message && (
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-normal">
            {message}
          </p>
        )}
        {children && <div className="mt-3">{children}</div>}
      </div>

      {/* Accessible Close Button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </aside>
  );

  return createPortal(popupContent, document.body);
}

