/**
 * Input validation utilities with strong typing
 */

import { ValidationError, AUTH_ERROR_CODES } from '../errors/auth-error';
import type { AuthUser, AuthProfile } from '../types';

/**
 * Email validation regex pattern
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Password strength requirements
 */
export interface PasswordRequirements {
  minLength?: number;
  maxLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  specialChars?: string;
}

/**
 * Default password requirements
 */
export const DEFAULT_PASSWORD_REQUIREMENTS: Required<PasswordRequirements> = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length === 0) {
    errors.push('Email cannot be empty');
  }

  if (trimmedEmail.length > 254) {
    errors.push('Email is too long (max 254 characters)');
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    errors.push('Invalid email format');
  }

  // Check for common typos
  const commonTypos = [
    'gmial.com',
    'gmai.com',
    'yahooo.com',
    'yaho.com',
    'outlok.com',
    'hotmial.com',
  ];

  const domain = trimmedEmail.split('@')[1]?.toLowerCase();
  if (domain && commonTypos.includes(domain)) {
    errors.push(`Possible typo in email domain: ${domain}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate password strength
 */
export function validatePassword(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): ValidationResult {
  const errors: string[] = [];
  const req = { ...DEFAULT_PASSWORD_REQUIREMENTS, ...requirements };

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < req.minLength) {
    errors.push(`Password must be at least ${req.minLength} characters`);
  }

  if (password.length > req.maxLength) {
    errors.push(`Password must be no more than ${req.maxLength} characters`);
  }

  if (req.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (req.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (req.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (req.requireSpecialChars) {
    const specialCharsRegex = new RegExp(`[${req.specialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`);
    if (!specialCharsRegex.test(password)) {
      errors.push('Password must contain at least one special character');
    }
  }

  // Check for common weak passwords
  const weakPasswords = [
    'password',
    '12345678',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
  ];

  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common, please choose a stronger password');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate username
 */
export function validateUsername(username: string): ValidationResult {
  const errors: string[] = [];

  if (!username || typeof username !== 'string') {
    errors.push('Username is required');
    return { isValid: false, errors };
  }

  const trimmedUsername = username.trim();

  if (trimmedUsername.length < 3) {
    errors.push('Username must be at least 3 characters');
  }

  if (trimmedUsername.length > 30) {
    errors.push('Username must be no more than 30 characters');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }

  if (/^[_-]/.test(trimmedUsername) || /[_-]$/.test(trimmedUsername)) {
    errors.push('Username cannot start or end with underscore or hyphen');
  }

  // Check for reserved usernames
  const reservedUsernames = [
    'admin',
    'root',
    'system',
    'api',
    'auth',
    'public',
    'private',
    'anonymous',
    'null',
    'undefined',
  ];

  if (reservedUsernames.includes(trimmedUsername.toLowerCase())) {
    errors.push('This username is reserved');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate phone number (basic international format)
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  const errors: string[] = [];

  if (!phone || typeof phone !== 'string') {
    errors.push('Phone number is required');
    return { isValid: false, errors };
  }

  // Remove common formatting characters
  const cleanPhone = phone.replace(/[\s()-]/g, '');

  if (cleanPhone.length < 10) {
    errors.push('Phone number is too short');
  }

  if (cleanPhone.length > 15) {
    errors.push('Phone number is too long');
  }

  if (!/^\+?\d+$/.test(cleanPhone)) {
    errors.push('Phone number can only contain numbers and optional + prefix');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate URL
 */
export function validateUrl(url: string): ValidationResult {
  const errors: string[] = [];

  if (!url || typeof url !== 'string') {
    errors.push('URL is required');
    return { isValid: false, errors };
  }

  try {
    const urlObj = new URL(url);
    
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      errors.push('URL must use HTTP or HTTPS protocol');
    }

    if (!urlObj.hostname) {
      errors.push('URL must have a valid hostname');
    }
  } catch {
    errors.push('Invalid URL format');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate OAuth callback URL
 */
export function validateCallbackUrl(url: string, allowedDomains?: string[]): ValidationResult {
  const urlResult = validateUrl(url);
  
  if (!urlResult.isValid) {
    return urlResult;
  }

  const errors: string[] = [];

  try {
    const urlObj = new URL(url);

    // Check if domain is allowed
    if (allowedDomains && allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(domain => {
        if (domain.startsWith('*.')) {
          // Wildcard subdomain
          const baseDomain = domain.slice(2);
          return urlObj.hostname === baseDomain || urlObj.hostname.endsWith(`.${baseDomain}`);
        }
        return urlObj.hostname === domain;
      });

      if (!isAllowed) {
        errors.push(`Domain ${urlObj.hostname} is not in the allowed list`);
      }
    }

    // Ensure HTTPS in production
    if (process.env.NODE_ENV === 'production' && urlObj.protocol !== 'https:') {
      errors.push('Callback URL must use HTTPS in production');
    }
  } catch {
    errors.push('Invalid callback URL');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate auth user object
 */
export function validateAuthUser(user: unknown): user is AuthUser {
  if (!user || typeof user !== 'object') {
    return false;
  }

  const u = user as Record<string, unknown>;

  return (
    typeof u.id === 'string' &&
    u.id.length > 0 &&
    typeof u.email === 'string' &&
    validateEmail(u.email).isValid &&
    (u.role === undefined || typeof u.role === 'string')
  );
}

/**
 * Validate auth profile object
 */
export function validateAuthProfile(profile: unknown): profile is AuthProfile {
  if (!profile || typeof profile !== 'object') {
    return false;
  }

  const p = profile as Record<string, unknown>;

  return (
    typeof p.id === 'string' &&
    p.id.length > 0 &&
    typeof p.user_id === 'string' &&
    p.user_id.length > 0 &&
    (p.username === undefined || typeof p.username === 'string') &&
    (p.full_name === undefined || typeof p.full_name === 'string') &&
    (p.avatar_url === undefined || typeof p.avatar_url === 'string')
  );
}

/**
 * Sanitize input string (remove potentially dangerous characters)
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove control characters and trim
  return input
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}

/**
 * Validate and sanitize display name
 */
export function validateDisplayName(name: string): ValidationResult {
  const errors: string[] = [];

  if (!name || typeof name !== 'string') {
    errors.push('Display name is required');
    return { isValid: false, errors };
  }

  const sanitized = sanitizeInput(name);

  if (sanitized.length < 1) {
    errors.push('Display name cannot be empty');
  }

  if (sanitized.length > 100) {
    errors.push('Display name is too long (max 100 characters)');
  }

  // Check for inappropriate content (basic check)
  const inappropriate = /<script|javascript:|on\w+=/i.test(sanitized);
  if (inappropriate) {
    errors.push('Display name contains invalid content');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate role name
 */
export function validateRole(role: string, allowedRoles: string[]): ValidationResult {
  const errors: string[] = [];

  if (!role || typeof role !== 'string') {
    errors.push('Role is required');
    return { isValid: false, errors };
  }

  if (!allowedRoles.includes(role)) {
    errors.push(`Invalid role. Allowed roles: ${allowedRoles.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate permission string
 */
export function validatePermission(permission: string): ValidationResult {
  const errors: string[] = [];

  if (!permission || typeof permission !== 'string') {
    errors.push('Permission is required');
    return { isValid: false, errors };
  }

  // Permission format: resource:action (e.g., user:read, post:write)
  const permissionRegex = /^[a-z]+:[a-z]+$/;
  
  if (!permissionRegex.test(permission)) {
    errors.push('Permission must be in format "resource:action"');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Assert validation or throw error
 */
export function assertValid(
  result: ValidationResult,
  fieldName: string
): asserts result is { isValid: true; errors: [] } {
  if (!result.isValid) {
    throw new ValidationError(
      `Validation failed for ${fieldName}: ${result.errors.join(', ')}`,
      AUTH_ERROR_CODES.VALIDATION_ERROR,
      { metadata: { field: fieldName, errors: result.errors } }
    );
  }
}

/**
 * Batch validation helper
 */
export function validateAll(
  validations: Array<{
    field: string;
    value: unknown;
    validator: (value: any) => ValidationResult;
  }>
): ValidationResult {
  const allErrors: string[] = [];

  for (const { field, value, validator } of validations) {
    const result = validator(value);
    if (!result.isValid) {
      allErrors.push(...result.errors.map(error => `${field}: ${error}`));
    }
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Create custom validator
 */
export function createValidator<T>(
  validateFn: (value: T) => boolean,
  errorMessage: string
): (value: T) => ValidationResult {
  return (value: T): ValidationResult => {
    const isValid = validateFn(value);
    return {
      isValid,
      errors: isValid ? [] : [errorMessage],
    };
  };
}