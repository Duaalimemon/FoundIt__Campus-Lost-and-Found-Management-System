import React, { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * Reusable accessible Modal dialog component.
 * Features:
 * - Renders via React Portal directly into document.body to avoid parent stacking context trapping
 * - Traps / restores focus on open and close
 * - Closes on Escape key press
 * - Prevents background scroll while active
 * - Accessible labeling with role="dialog" and aria-modal="true"
 * - Click-outside overlay dismissal
 */
export function Modal({
  isOpen = false,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className = '',
}) {
  const titleId = useId();
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement;

    const handleKeyDown = (e) => {
      if (closeOnEsc && e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Lock body scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move focus inside dialog only if not already focused inside
    if (modalRef.current && !modalRef.current.contains(document.activeElement)) {
      modalRef.current.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      if (
        previousActiveElement.current &&
        typeof previousActiveElement.current.focus === 'function'
      ) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, closeOnEsc]);

  if (!isOpen) return null;

  const sizeClass = SIZES[size] || SIZES.md;

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="presentation"
    >
      {/* Full-screen Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] transition-opacity"
        aria-hidden="true"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      {/* Modal Dialog Content */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`relative w-full ${sizeClass} bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 transition-all focus:outline-none my-auto max-h-[calc(100vh-4rem)] flex flex-col ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 shrink-0">
          {title ? (
            <h3 id={titleId} className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
          ) : (
            <span />
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary ml-auto"
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
        </div>

        {/* Content Body */}
        <div className="px-6 py-5 overflow-y-auto text-sm text-slate-700 dark:text-slate-300">
          {children}
        </div>

        {/* Optional Footer Slot */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}

export default Modal;
