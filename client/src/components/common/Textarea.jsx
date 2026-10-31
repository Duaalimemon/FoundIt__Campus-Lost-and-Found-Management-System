import React, { forwardRef, useId } from 'react';

/**
 * Reusable labeled Textarea component with accessible label association,
 * validation error states, and aria-describedby linkage.
 */
export const Textarea = forwardRef(function Textarea(
  {
    id,
    name,
    label,
    value,
    onChange,
    placeholder,
    rows = 4,
    required = false,
    disabled = false,
    error,
    helperText,
    maxLength,
    className = '',
    wrapperClassName = '',
    ...props
  },
  ref
) {
  const generatedId = useId();
  const textareaId = id || `textarea-${generatedId.replace(/:/g, '')}`;
  const errorId = error ? `${textareaId}-error` : undefined;
  const helperId = helperText ? `${textareaId}-helper` : undefined;

  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;
  const hasError = Boolean(error);

  const baseTextareaStyles =
    'block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:outline-none resize-y';
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
          htmlFor={textareaId}
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
      <textarea
        ref={ref}
        id={textareaId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        required={required}
        disabled={disabled}
        aria-invalid={hasError ? 'true' : 'false'}
        aria-describedby={describedBy}
        className={`${baseTextareaStyles} ${stateStyles} ${disabledStyles} ${className}`.trim()}
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

export default Textarea;
