'use client';

import { useState, useEffect } from 'react';
import { ExtractedVariable } from '@/utils/extractVariablesTyped';
import { validateVariableValue } from '@/utils/validateVariableValue';

interface NumberVariableInputProps {
  variable: ExtractedVariable;
  value: string;
  onChange: (value: string) => void;
  onError?: (error: string | null) => void;
}

export default function NumberVariableInput({
  variable,
  value,
  onChange,
  onError,
}: NumberVariableInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const validation = variable.validation || {};
  const min = validation.min;
  const max = validation.max;
  const step = validation.step || (validation.decimals ? Math.pow(10, -validation.decimals) : 1);
  const decimals = validation.decimals || 0;

  useEffect(() => {
    if (touched) {
      const validationError = validateVariableValue(variable, value);
      const errorMsg = validationError?.message || null;
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [value, variable, touched, onError]);

  const handleIncrement = () => {
    const num = parseFloat(value) || 0;
    const newValue = num + step;
    if (max === undefined || newValue <= max) {
      onChange(newValue.toFixed(decimals));
    }
  };

  const handleDecrement = () => {
    const num = parseFloat(value) || 0;
    const newValue = num - step;
    if (min === undefined || newValue >= min) {
      onChange(newValue.toFixed(decimals));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Allow empty string, negative sign, and decimal point during typing
    if (inputValue === '' || inputValue === '-' || inputValue === '.' || inputValue === '-.') {
      onChange(inputValue);
      return;
    }

    // Validate that it's a valid number format
    const regex = decimals > 0 ? new RegExp(`^-?\\d*\\.?\\d{0,${decimals}}$`) : /^-?\d*$/;

    if (regex.test(inputValue)) {
      onChange(inputValue);
    }
  };

  return (
    <div className="space-y-1">
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          id={variable.name}
          value={value}
          onChange={handleInputChange}
          onBlur={() => {
            setTouched(true);
            // Format number on blur
            const num = parseFloat(value);
            if (!isNaN(num)) {
              onChange(num.toFixed(decimals));
            }
          }}
          placeholder={variable.placeholder || '0'}
          className={`w-full px-3 py-2 pr-16 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
            error && touched
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-gray-500 dark:focus:ring-gray-400'
          }`}
          required={variable.required}
        />
        <div className="absolute right-1 top-1 flex">
          <button
            type="button"
            onClick={handleDecrement}
            className="px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none"
            tabIndex={-1}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleIncrement}
            className="px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none"
            tabIndex={-1}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </div>
      {variable.helpText && !error && (
        <p className="text-xs text-gray-600 dark:text-gray-400">{variable.helpText}</p>
      )}
      {error && touched && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {(min !== undefined || max !== undefined) && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {min !== undefined && max !== undefined && `Range: ${min} - ${max}`}
          {min !== undefined && max === undefined && `Minimum: ${min}`}
          {min === undefined && max !== undefined && `Maximum: ${max}`}
        </p>
      )}
    </div>
  );
}
