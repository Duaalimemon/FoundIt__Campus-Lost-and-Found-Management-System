import React, { forwardRef, useId } from 'react';

/**
 * Reusable labeled Input component with accessible label association,
 * validation error states, and aria-describedby linkage.
 */
export const Input = forwardRef(function Input(
  {
    id,
    name,
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    required = false,
    disabled = false,
    error,
    helperText,
    className = '',
    wrapperClassName = '',
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || `input-${generatedId.replace(/:/g, '')}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;
  const hasError = Boolean(error);

  const baseInputStyles =
    'block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:outline-none';
  const stateStyles = hasError
    ? 'border-danger text-danger focus:border-danger focus:ring-1 focus:ring-danger'
    : 'border-border dark:border-slate-700 focus:border-primary dark:focus:border-blue-400 focus:ring-1 focus:ring-primary dark:focus:ring-blue-400';
  const disabledStyles = disabled
    ? 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-700'
    : 'bg-white dark:bg-slate-900';

  return (
    <div className={`w-full ${wrapperClassName}`.trim()}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          {label}
          {required && (
            <span className="text-danger ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-invalid={hasError ? 'true' : 'false'}
        aria-describedby={describedBy}
        className={`${baseInputStyles} ${stateStyles} ${disabledStyles} ${className}`.trim()}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1 text-xs text-danger font-medium" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-1 text-xs text-muted dark:text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
});

export default Input;
