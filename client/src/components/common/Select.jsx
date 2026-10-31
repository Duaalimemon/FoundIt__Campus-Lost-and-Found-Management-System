import React, { forwardRef, useId } from 'react';

/**
 * Reusable accessible Select component supporting string or object option shapes:
 * - string: 'Electronics'
 * - object: { value: 'electronics', label: 'Electronics', disabled?: boolean }
 */
export const Select = forwardRef(function Select(
  {
    id,
    name,
    label,
    value,
    onChange,
    options = [],
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
  const selectId = id || `select-${generatedId.replace(/:/g, '')}`;
  const errorId = error ? `${selectId}-error` : undefined;
  const helperId = helperText ? `${selectId}-helper` : undefined;

  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;
  const hasError = Boolean(error);

  const baseSelectStyles =
    'block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:outline-none';
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
          htmlFor={selectId}
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
      <select
        ref={ref}
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        aria-invalid={hasError ? 'true' : 'false'}
        aria-describedby={describedBy}
        className={`${baseSelectStyles} ${stateStyles} ${disabledStyles} ${className}`.trim()}
        {...props}
      >
        {placeholder && (
          <option value="" disabled={required}>
            {placeholder}
          </option>
        )}
        {options.map((opt, index) => {
          if (typeof opt === 'string' || typeof opt === 'number') {
            return (
              <option key={`${opt}-${index}`} value={opt}>
                {opt}
              </option>
            );
          }
          return (
            <option
              key={`${opt.value}-${index}`}
              value={opt.value}
              disabled={opt.disabled}
            >
              {opt.label ?? opt.value}
            </option>
          );
        })}
      </select>
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

export default Select;
