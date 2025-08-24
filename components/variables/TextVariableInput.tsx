'use client';

import { useState, useEffect } from 'react';
import { ExtractedVariable } from '@/utils/extractVariablesTyped';
import { validateVariableValue } from '@/utils/validateVariableValue';

interface TextVariableInputProps {
  variable: ExtractedVariable;
  value: string;
  onChange: (value: string) => void;
  onError?: (error: string | null) => void;
}

export default function TextVariableInput({
  variable,
  value,
  onChange,
  onError
}: TextVariableInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  
  const validation = variable.validation || {};
  const maxLength = validation.maxLength;
  
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
          type="text"
          id={variable.name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={variable.placeholder || `Enter ${variable.label?.toLowerCase() || variable.name.toLowerCase()}`}
          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
            error && touched
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-gray-500 dark:focus:ring-gray-400'
          }`}
          maxLength={maxLength}
          required={variable.required}
        />
        {maxLength && (
          <div className="absolute right-2 top-2 text-xs text-gray-500 dark:text-gray-400">
            {value.length}/{maxLength}
          </div>
        )}
      </div>
      {variable.helpText && !error && (
        <p className="text-xs text-gray-600 dark:text-gray-400">{variable.helpText}</p>
      )}
      {error && touched && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}