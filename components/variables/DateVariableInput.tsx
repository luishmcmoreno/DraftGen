'use client';

import { useState, useEffect } from 'react';
import { ExtractedVariable } from '@/utils/extractVariablesTyped';
import { validateVariableValue } from '@/utils/validateVariableValue';

interface DateVariableInputProps {
  variable: ExtractedVariable;
  value: string;
  onChange: (value: string) => void;
  onError?: (error: string | null) => void;
}

export default function DateVariableInput({
  variable,
  value,
  onChange,
  onError
}: DateVariableInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  
  const validation = variable.validation || {};
  const minDate = validation.minDate;
  const maxDate = validation.maxDate;
  
  // Convert value to YYYY-MM-DD format for input
  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };
  
  // Get today's date as default
  const getDefaultDate = () => {
    if (variable.defaultValue === 'today') {
      return new Date().toISOString().split('T')[0];
    }
    return variable.defaultValue || '';
  };
  
  useEffect(() => {
    if (touched) {
      const validationError = validateVariableValue(variable, value);
      const errorMsg = validationError?.message || null;
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [value, variable, touched, onError]);
  
  // Set default value on mount if empty
  useEffect(() => {
    if (!value && variable.defaultValue) {
      onChange(getDefaultDate());
    }
  }, []);
  
  return (
    <div className="space-y-1">
      <div className="relative">
        <input
          type="date"
          id={variable.name}
          value={formatDateForInput(value)}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          min={minDate ? formatDateForInput(minDate) : undefined}
          max={maxDate ? formatDateForInput(maxDate) : undefined}
          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
            error && touched
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-gray-500 dark:focus:ring-gray-400'
          }`}
          required={variable.required}
        />
        <div className="absolute right-8 top-2.5 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
      {variable.helpText && !error && (
        <p className="text-xs text-gray-600 dark:text-gray-400">{variable.helpText}</p>
      )}
      {error && touched && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      {(minDate || maxDate) && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {minDate && maxDate && `Between ${minDate} and ${maxDate}`}
          {minDate && !maxDate && `After ${minDate}`}
          {!minDate && maxDate && `Before ${maxDate}`}
        </p>
      )}
    </div>
  );
}