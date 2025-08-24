'use client';

import { useState, useEffect } from 'react';
import { ExtractedVariable } from '@/utils/extractVariablesTyped';
import { validateVariableValue } from '@/utils/validateVariableValue';

interface EmailVariableInputProps {
  variable: ExtractedVariable;
  value: string;
  onChange: (value: string) => void;
  onError?: (error: string | null) => void;
}

export default function EmailVariableInput({
  variable,
  value,
  onChange,
  onError
}: EmailVariableInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  
  const validation = variable.validation || {};
  const allowedDomains = validation.domains;
  
  useEffect(() => {
    if (touched) {
      const validationError = validateVariableValue(variable, value);
      const errorMsg = validationError?.message || null;
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [value, variable, touched, onError]);
  
  return (
    <div className="space-y-1">
      <div className="relative">
        <input
          type="email"
          id={variable.name}
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          onBlur={() => setTouched(true)}
          placeholder={variable.placeholder || 'email@example.com'}
          className={`w-full px-3 py-2 pl-9 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
            error && touched
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-gray-500 dark:focus:ring-gray-400'
          }`}
          required={variable.required}
          autoComplete="email"
        />
        <div className="absolute left-3 top-2.5 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        {value && !error && (
          <div className="absolute right-3 top-2.5 pointer-events-none">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      {variable.helpText && !error && (
        <p className="text-xs text-gray-600 dark:text-gray-400">{variable.helpText}</p>
      )}
      {error && touched && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      {allowedDomains && allowedDomains.length > 0 && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Allowed domains: {allowedDomains.join(', ')}
        </p>
      )}
    </div>
  );
}