'use client';

import { useState, useEffect } from 'react';
import PhoneInput, { isValidPhoneNumber, Country } from 'react-phone-number-input';
import { ExtractedVariable } from '@/utils/extractVariablesTyped';
import type { E164Number } from 'libphonenumber-js';
import 'react-phone-number-input/style.css';

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
  const [phoneValue, setPhoneValue] = useState<E164Number | undefined>(value as E164Number || undefined);
  
  const validation = variable.validation || {};
  const defaultCountry = validation.defaultCountry || 'US';
  const placeholder = variable.placeholder || 'Enter phone number';
  const helpText = variable.helpText || 'Enter phone number with country code';
  
  useEffect(() => {
    if (touched && phoneValue) {
      let errorMsg: string | null = null;
      
      try {
        if (!isValidPhoneNumber(phoneValue)) {
          errorMsg = 'Invalid phone number format';
        }
      } catch {
        errorMsg = 'Invalid phone number';
      }
      
      if (variable.required && !phoneValue) {
        errorMsg = 'Phone number is required';
      }
      
      setError(errorMsg);
      onError?.(errorMsg);
    } else if (touched && variable.required && !phoneValue) {
      const errorMsg = 'Phone number is required';
      setError(errorMsg);
      onError?.(errorMsg);
    } else {
      setError(null);
      onError?.(null);
    }
  }, [phoneValue, variable, touched, onError]);
  
  const handlePhoneChange = (value: E164Number | undefined) => {
    setPhoneValue(value);
    onChange(value || '');
  };
  
  return (
    <div className="space-y-1">
      <div className={`phone-input-wrapper ${error && touched ? 'error' : ''}`}>
        <PhoneInput
          international
          countryCallingCodeEditable={false}
          defaultCountry={defaultCountry as Country}
          value={phoneValue}
          onChange={handlePhoneChange}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          className="phone-input-field"
          inputComponent={CustomPhoneInput}
          required={variable.required}
        />
      </div>
      {!error && !touched && (
        <p className="text-xs text-gray-600 dark:text-gray-400">{helpText}</p>
      )}
      {error && touched && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      
      <style jsx global>{`
        .phone-input-wrapper {
          position: relative;
        }
        
        .phone-input-field {
          width: 100%;
        }
        
        .phone-input-field .PhoneInput {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .phone-input-field .PhoneInputCountry {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .phone-input-field .PhoneInputCountryIcon {
          width: 1.5rem;
          height: 1rem;
          border-radius: 2px;
          overflow: hidden;
          background-color: #f3f4f6;
        }
        
        .phone-input-field .PhoneInputCountryIcon svg {
          display: block;
          width: 100%;
          height: 100%;
        }
        
        .phone-input-field .PhoneInputCountryIcon--border {
          border: 1px solid #e5e7eb;
        }
        
        .phone-input-field .PhoneInputCountrySelect {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
        
        .phone-input-field .PhoneInputCountrySelectArrow {
          width: 0.75rem;
          height: 0.75rem;
          color: #6b7280;
          margin-left: 0.25rem;
        }
        
        .phone-input-field input {
          flex: 1;
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          background-color: white;
          color: #111827;
          font-size: 0.875rem;
          transition: all 0.15s ease-in-out;
        }
        
        .phone-input-field input:focus {
          outline: none;
          border-color: #6b7280;
          ring: 2px;
          ring-color: #6b7280;
          box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.1);
        }
        
        .phone-input-field input::placeholder {
          color: #9ca3af;
        }
        
        .phone-input-wrapper.error .phone-input-field input {
          border-color: #ef4444;
        }
        
        .phone-input-wrapper.error .phone-input-field input:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
        
        /* Dark mode styles */
        .dark .phone-input-field .PhoneInputCountryIcon {
          background-color: #374151;
        }
        
        .dark .phone-input-field .PhoneInputCountryIcon--border {
          border-color: #4b5563;
        }
        
        .dark .phone-input-field .PhoneInputCountrySelectArrow {
          color: #9ca3af;
        }
        
        .dark .phone-input-field input {
          background-color: #374151;
          border-color: #4b5563;
          color: #f3f4f6;
        }
        
        .dark .phone-input-field input:focus {
          border-color: #9ca3af;
          box-shadow: 0 0 0 3px rgba(156, 163, 175, 0.1);
        }
        
        .dark .phone-input-field input::placeholder {
          color: #6b7280;
        }
        
        .dark .phone-input-wrapper.error .phone-input-field input {
          border-color: #dc2626;
        }
        
        .dark .phone-input-wrapper.error .phone-input-field input:focus {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }
      `}</style>
    </div>
  );
}

// Custom input component to match our design system
const CustomPhoneInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <input
      {...props}
      type="tel"
      autoComplete="tel"
    />
  );
};