import { ExtractedVariable } from './extractVariablesTyped'

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
 * Validates a US phone number
 */
function isValidUSPhone(phone: string): boolean {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  // US phone numbers should have 10 digits (or 11 with country code)
  return digits.length === 10 || (digits.length === 11 && digits[0] === '1')
}

/**
 * Validates an international phone number (basic validation)
 */
function isValidInternationalPhone(phone: string): boolean {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '')
  // Should start with + and have 7-15 digits
  const phoneRegex = /^\+[1-9]\d{6,14}$/
  return phoneRegex.test(cleaned)
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
      const phoneFormat = validation.format || 'INTERNATIONAL'
      if (phoneFormat === 'US') {
        if (!isValidUSPhone(trimmedValue)) {
          return {
            field: variable.name,
            message: `${variable.label || variable.name} must be a valid US phone number`,
            code: 'INVALID_PHONE'
          }
        }
      } else {
        if (!isValidInternationalPhone(trimmedValue)) {
          return {
            field: variable.name,
            message: `${variable.label || variable.name} must be a valid international phone number (e.g., +1234567890)`,
            code: 'INVALID_PHONE'
          }
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
      const phoneFormat = variable.validation?.format || 'INTERNATIONAL'
      if (phoneFormat === 'US') {
        // Format US phone number as (XXX) XXX-XXXX
        const digits = value.replace(/\D/g, '')
        if (digits.length === 10) {
          return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
        } else if (digits.length === 11 && digits[0] === '1') {
          return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
        }
      }
      break
      
    case 'DATE':
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        const format = variable.validation?.format || 'YYYY-MM-DD'
        // Simple date formatting
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        
        if (format === 'MM/DD/YYYY') {
          return `${month}/${day}/${year}`
        } else if (format === 'DD/MM/YYYY') {
          return `${day}/${month}/${year}`
        } else {
          return `${year}-${month}-${day}`
        }
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