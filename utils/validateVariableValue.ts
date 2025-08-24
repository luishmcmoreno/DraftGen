import { ExtractedVariable } from './extractVariablesTyped'
import { isValidPhoneNumber, parsePhoneNumberWithError } from 'libphonenumber-js'

export interface ValidationError {
  field: string
  message: string
  code: string
}

/**
 * Validates an email address using a comprehensive regex
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(email)
}

/**
 * Validates a phone number using libphonenumber-js
 */
function isValidPhone(phone: string, defaultCountry?: string): boolean {
  try {
    // If it starts with +, validate as international number
    if (phone.startsWith('+')) {
      return isValidPhoneNumber(phone)
    }
    
    // If defaultCountry is provided, validate with that country
    if (defaultCountry) {
      return isValidPhoneNumber(phone, defaultCountry as any)
    }
    
    // Otherwise, try to validate as international
    return isValidPhoneNumber(phone)
  } catch (error) {
    return false
  }
}

/**
 * Validates a date string
 */
function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr)
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Validates a number
 */
function isValidNumber(value: string, decimals?: number): boolean {
  const num = parseFloat(value)
  if (isNaN(num)) return false
  
  if (decimals !== undefined) {
    const parts = value.split('.')
    if (parts.length > 1 && parts[1].length > decimals) {
      return false
    }
  }
  
  return true
}

/**
 * Validates a single variable value based on its type and validation rules
 */
export function validateVariableValue(
  variable: ExtractedVariable,
  value: string | undefined | null
): ValidationError | null {
  // Check required field
  if (variable.required && (!value || value.trim() === '')) {
    return {
      field: variable.name,
      message: `${variable.label || variable.name} is required`,
      code: 'REQUIRED'
    }
  }
  
  // If not required and empty, it's valid
  if (!value || value.trim() === '') {
    return null
  }
  
  const trimmedValue = value.trim()
  const validation = variable.validation || {}
  
  switch (variable.type) {
    case 'TEXT':
      if (validation.minLength && trimmedValue.length < validation.minLength) {
        return {
          field: variable.name,
          message: `${variable.label || variable.name} must be at least ${validation.minLength} characters`,
          code: 'MIN_LENGTH'
        }
      }
      if (validation.maxLength && trimmedValue.length > validation.maxLength) {
        return {
          field: variable.name,
          message: `${variable.label || variable.name} must not exceed ${validation.maxLength} characters`,
          code: 'MAX_LENGTH'
        }
      }
      if (validation.pattern) {
        const regex = new RegExp(validation.pattern)
        if (!regex.test(trimmedValue)) {
          return {
            field: variable.name,
            message: `${variable.label || variable.name} format is invalid`,
            code: 'PATTERN'
          }
        }
      }
      break
      
    case 'EMAIL':
      if (!isValidEmail(trimmedValue)) {
        return {
          field: variable.name,
          message: `${variable.label || variable.name} must be a valid email address`,
          code: 'INVALID_EMAIL'
        }
      }
      if (validation.domains && validation.domains.length > 0) {
        const domain = trimmedValue.split('@')[1]
        if (!validation.domains.includes(domain)) {
          return {
            field: variable.name,
            message: `Email domain must be one of: ${validation.domains.join(', ')}`,
            code: 'INVALID_DOMAIN'
          }
        }
      }
      break
      
    case 'DATE':
      if (!isValidDate(trimmedValue)) {
        return {
          field: variable.name,
          message: `${variable.label || variable.name} must be a valid date`,
          code: 'INVALID_DATE'
        }
      }
      const date = new Date(trimmedValue)
      if (validation.minDate) {
        const minDate = new Date(validation.minDate)
        if (date < minDate) {
          return {
            field: variable.name,
            message: `${variable.label || variable.name} must be after ${validation.minDate}`,
            code: 'DATE_TOO_EARLY'
          }
        }
      }
      if (validation.maxDate) {
        const maxDate = new Date(validation.maxDate)
        if (date > maxDate) {
          return {
            field: variable.name,
            message: `${variable.label || variable.name} must be before ${validation.maxDate}`,
            code: 'DATE_TOO_LATE'
          }
        }
      }
      break
      
    case 'NUMBER':
      if (!isValidNumber(trimmedValue, validation.decimals)) {
        return {
          field: variable.name,
          message: `${variable.label || variable.name} must be a valid number${validation.decimals !== undefined ? ` with up to ${validation.decimals} decimal places` : ''}`,
          code: 'INVALID_NUMBER'
        }
      }
      const num = parseFloat(trimmedValue)
      if (validation.min !== undefined && num < validation.min) {
        return {
          field: variable.name,
          message: `${variable.label || variable.name} must be at least ${validation.min}`,
          code: 'NUMBER_TOO_SMALL'
        }
      }
      if (validation.max !== undefined && num > validation.max) {
        return {
          field: variable.name,
          message: `${variable.label || variable.name} must not exceed ${validation.max}`,
          code: 'NUMBER_TOO_LARGE'
        }
      }
      break
      
    case 'PHONE':
      const defaultCountry = validation.defaultCountry || undefined
      if (!isValidPhone(trimmedValue, defaultCountry)) {
        return {
          field: variable.name,
          message: `${variable.label || variable.name} must be a valid phone number`,
          code: 'INVALID_PHONE'
        }
      }
      break
  }
  
  return null
}

/**
 * Validates all variables in a form
 */
export function validateAllVariables(
  variables: ExtractedVariable[],
  values: Record<string, string>
): ValidationError[] {
  const errors: ValidationError[] = []
  
  for (const variable of variables) {
    const error = validateVariableValue(variable, values[variable.name])
    if (error) {
      errors.push(error)
    }
  }
  
  return errors
}

/**
 * Formats a value based on variable type
 */
export function formatVariableValue(
  variable: ExtractedVariable,
  value: string
): string {
  if (!value) return value
  
  switch (variable.type) {
    case 'PHONE':
      try {
        const phoneNumber = parsePhoneNumberWithError(value)
        if (phoneNumber) {
          // Use international format by default, or national if specified
          const format = variable.validation?.displayFormat || 'INTERNATIONAL'
          if (format === 'NATIONAL' && phoneNumber.country) {
            return phoneNumber.formatNational()
          }
          return phoneNumber.formatInternational()
        }
      } catch (error) {
        // If parsing fails, return the original value
      }
      break
      
    case 'DATE':
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        // Use browser's locale for date formatting
        // The format property can specify the style: 'short', 'medium', 'long', 'full'
        const format = variable.validation?.format || 'medium'
        
        // Map format values to Intl.DateTimeFormat options
        let options: Intl.DateTimeFormatOptions = {}
        
        switch (format) {
          case 'short':
            options = { dateStyle: 'short' }
            break
          case 'long':
            options = { dateStyle: 'long' }
            break
          case 'full':
            options = { dateStyle: 'full' }
            break
          case 'medium':
          default:
            options = { dateStyle: 'medium' }
            break
        }
        
        // Use browser's locale (undefined) to format the date
        return new Intl.DateTimeFormat(undefined, options).format(date)
      }
      break
      
    case 'NUMBER':
      const num = parseFloat(value)
      if (!isNaN(num) && variable.validation?.decimals !== undefined) {
        return num.toFixed(variable.validation.decimals)
      }
      break
  }
  
  return value
}