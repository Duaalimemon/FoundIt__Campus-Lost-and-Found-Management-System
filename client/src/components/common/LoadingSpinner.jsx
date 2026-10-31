import React from 'react';

const SIZES = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-3',
  xl: 'w-14 h-14 border-4',
};

/**
 * Reusable LoadingSpinner component with accessible status announcement
 * and motion-reduce considerations.
 */
export function LoadingSpinner({
  size = 'md',
  label = 'Loading...',
  showLabel = false,
  className = ''
}) {
  const sizeStyles = SIZES[size] || SIZES.md;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center justify-center gap-2 ${className}`.trim()}
    >
      <div
        className={`${sizeStyles} rounded-full border-primary border-t-transparent animate-spin motion-reduce:animate-none`}
        aria-hidden="true"
      />
      <span className={showLabel ? 'text-sm font-medium text-muted' : 'sr-only'}>
        {label}
      </span>
    </div>
  );
}

export default LoadingSpinner;
