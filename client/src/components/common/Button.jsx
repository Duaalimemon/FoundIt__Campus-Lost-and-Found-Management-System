import React, { forwardRef } from 'react';

const VARIANTS = {
  primary:
    'bg-primary text-white hover:bg-blue-900 focus:ring-primary disabled:bg-blue-300 disabled:cursor-not-allowed dark:bg-primary dark:hover:bg-blue-800 dark:focus:ring-blue-400',
  secondary:
    'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus:ring-slate-500 dark:disabled:bg-slate-900 dark:disabled:text-slate-600',
  outline:
    'border border-border bg-white text-slate-700 hover:bg-slate-50 focus:ring-primary disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:ring-blue-400 dark:disabled:bg-slate-950 dark:disabled:text-slate-600',
  danger:
    'bg-danger text-white hover:bg-red-800 focus:ring-danger disabled:bg-red-300 disabled:cursor-not-allowed dark:bg-red-700 dark:hover:bg-red-800 dark:focus:ring-red-500',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs min-h-[36px]',
  md: 'px-4 py-2 text-sm min-h-[40px]',
  lg: 'px-5 py-2.5 text-base min-h-[44px]',
};

/**
 * Reusable Button component with accessible focus, loading, and variant states.
 * Uses native <button> with type defaulting to "button" to avoid accidental submissions.
 */
export const Button = forwardRef(function Button(
  {
    children,
    type = 'button',
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    className = '',
    onClick,
    ...props
  },
  ref
) {
  const variantStyles = VARIANTS[variant] || VARIANTS.primary;
  const sizeStyles = SIZES[size] || SIZES.md;
  const widthStyles = fullWidth ? 'w-full' : '';
  const isDisabled = disabled || loading;

  const handleClick = (e) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : undefined}
      aria-disabled={isDisabled ? 'true' : undefined}
      onClick={handleClick}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${variantStyles} ${sizeStyles} ${widthStyles} ${className}`.trim()}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current motion-reduce:animate-none"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
});

export default Button;
