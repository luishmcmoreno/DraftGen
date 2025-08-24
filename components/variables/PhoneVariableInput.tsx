'use client';

import { useState, useEffect } from 'react';
import { ExtractedVariable } from '@/utils/extractVariablesTyped';
import { validateVariableValue } from '@/utils/validateVariableValue';

interface PhoneVariableInputProps {
  variable: ExtractedVariable;
  value: string;
  onChange: (value: string) => void;
  onError?: (error: string | null) => void;
}

export default function PhoneVariableInput({
  variable,
  value,
  onChange,
  onError
}: PhoneVariableInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  
  const validation = variable.validation || {};
  const format = validation.format || 'INTERNATIONAL';
  
  useEffect(() => {
    if (touched) {
      const validationError = validateVariableValue(variable, value);
      const errorMsg = validationError?.message || null;
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [value, variable, touched, onError]);
  
  const formatUSPhone = (input: string) => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, '');
    
    // Format based on length
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else if (digits.length <= 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else {
      // Handle 11 digits (with country code)
      return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
    }
  };
  
  const formatInternationalPhone = (input: string) => {
    // Keep + at the beginning if present
    let formatted = input.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +
    if (formatted && !formatted.startsWith('+')) {
      formatted = '+' + formatted;
    }
    
    // Add spaces for readability (simple formatting)
    if (formatted.length > 4) {
      const countryCode = formatted.slice(0, 3);
      const rest = formatted.slice(3);
      
      // Format in groups of 3-4 digits
      const groups = [];
      let remaining = rest;
      while (remaining.length > 0) {
        if (remaining.length <= 4) {
          groups.push(remaining);
          break;
        }
        groups.push(remaining.slice(0, 3));
        remaining = remaining.slice(3);
      }
      
      formatted = countryCode + ' ' + groups.join(' ');
    }
    
    return formatted;
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    if (format === 'US') {
      // Only allow digits for US format
      const digits = input.replace(/\D/g, '');
      if (digits.length <= 11) {
        onChange(formatUSPhone(input));
      }
    } else {
      // International format
      onChange(formatInternationalPhone(input));
    }
  };
  
  const getPlaceholder = () => {
    if (variable.placeholder) return variable.placeholder;
    return format === 'US' ? '(555) 123-4567' : '+1 234 567 8900';
  };
  
  const getHelpText = () => {
    if (variable.helpText) return variable.helpText;
    return format === 'US' 
      ? 'Enter a 10-digit US phone number'
      : 'Enter phone number with country code (e.g., +1 for US)';
  };
  
  return (
    <div className="space-y-1">
      <div className="relative">
        <input
          type="tel"
          id={variable.name}
          value={value}
          onChange={handleInputChange}
          onBlur={() => setTouched(true)}
          placeholder={getPlaceholder()}
          className={`w-full px-3 py-2 pl-9 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
            error && touched
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-gray-500 dark:focus:ring-gray-400'
          }`}
          required={variable.required}
          autoComplete="tel"
        />
        <div className="absolute left-3 top-2.5 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
        {format === 'US' && (
          <div className="absolute right-3 top-2.5 pointer-events-none">
            <span className="text-xs text-gray-500 dark:text-gray-400">US</span>
          </div>
        )}
      </div>
      {!error && (
        <p className="text-xs text-gray-600 dark:text-gray-400">{getHelpText()}</p>
      )}
      {error && touched && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}