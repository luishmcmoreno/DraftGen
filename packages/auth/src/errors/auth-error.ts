/**
 * Custom authentication error classes with strong typing
 */

import type { AuthUser } from '../types';

/**
 * Error codes for authentication errors
 */
export const AUTH_ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_INVALID: 'SESSION_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  
  // Authorization errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ROLE_NOT_ALLOWED: 'ROLE_NOT_ALLOWED',
  
  // Provider errors
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  PROVIDER_NOT_FOUND: 'PROVIDER_NOT_FOUND',
  PROVIDER_NOT_CONFIGURED: 'PROVIDER_NOT_CONFIGURED',
  OAUTH_ERROR: 'OAUTH_ERROR',
  OAUTH_CALLBACK_ERROR: 'OAUTH_CALLBACK_ERROR',
  
  // Profile errors
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  PROFILE_CREATION_FAILED: 'PROFILE_CREATION_FAILED',
  PROFILE_UPDATE_FAILED: 'PROFILE_UPDATE_FAILED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  PASSWORD_TOO_WEAK: 'PASSWORD_TOO_WEAK',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Configuration errors
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  MISSING_ENV_VARIABLES: 'MISSING_ENV_VARIABLES',
  
  // Generic errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type AuthErrorCode = typeof AUTH_ERROR_CODES[keyof typeof AUTH_ERROR_CODES];

/**
 * Error context with additional information
 */
export interface AuthErrorContext {
  /**
   * HTTP status code
   */
  statusCode?: number;
  
  /**
   * User associated with the error
   */
  user?: AuthUser;
  
  /**
   * Provider that caused the error
   */
  provider?: string;
  
  /**
   * Original error that was caught
   */
  originalError?: Error;
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;
  
  /**
   * Timestamp when error occurred
   */
  timestamp?: Date;
  
  /**
   * Request ID for tracing
   */
  requestId?: string;
}

/**
 * Base authentication error class
 */
export class AuthError extends Error {
  public readonly code: AuthErrorCode;
  public readonly context: AuthErrorContext;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: AuthErrorCode = AUTH_ERROR_CODES.UNKNOWN_ERROR,
    context: AuthErrorContext = {},
    isOperational = true
  ) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.context = {
      ...context,
      timestamp: context.timestamp || new Date(),
    };
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError);
    }
  }

  /**
   * Convert error to JSON representation
   */
  toJSON(): {
    name: string;
    message: string;
    code: AuthErrorCode;
    context: AuthErrorContext;
    stack?: string;
  } {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack,
    };
  }

  /**
   * Get HTTP status code for the error
   */
  getStatusCode(): number {
    if (this.context.statusCode) {
      return this.context.statusCode;
    }

    // Map error codes to HTTP status codes
    switch (this.code) {
      case AUTH_ERROR_CODES.INVALID_CREDENTIALS:
      case AUTH_ERROR_CODES.USER_NOT_FOUND:
        return 401;
      
      case AUTH_ERROR_CODES.UNAUTHORIZED:
      case AUTH_ERROR_CODES.SESSION_EXPIRED:
      case AUTH_ERROR_CODES.SESSION_INVALID:
      case AUTH_ERROR_CODES.TOKEN_EXPIRED:
      case AUTH_ERROR_CODES.TOKEN_INVALID:
        return 401;
      
      case AUTH_ERROR_CODES.FORBIDDEN:
      case AUTH_ERROR_CODES.INSUFFICIENT_PERMISSIONS:
      case AUTH_ERROR_CODES.ROLE_NOT_ALLOWED:
        return 403;
      
      case AUTH_ERROR_CODES.PROFILE_NOT_FOUND:
      case AUTH_ERROR_CODES.PROVIDER_NOT_FOUND:
        return 404;
      
      case AUTH_ERROR_CODES.VALIDATION_ERROR:
      case AUTH_ERROR_CODES.INVALID_EMAIL:
      case AUTH_ERROR_CODES.INVALID_PASSWORD:
      case AUTH_ERROR_CODES.PASSWORD_TOO_WEAK:
        return 400;
      
      case AUTH_ERROR_CODES.SERVICE_UNAVAILABLE:
        return 503;
      
      case AUTH_ERROR_CODES.TIMEOUT:
        return 504;
      
      case AUTH_ERROR_CODES.CONFIGURATION_ERROR:
      case AUTH_ERROR_CODES.MISSING_ENV_VARIABLES:
      case AUTH_ERROR_CODES.INTERNAL_ERROR:
      default:
        return 500;
    }
  }
}

/**
 * Authentication failed error
 */
export class AuthenticationError extends AuthError {
  constructor(
    message = 'Authentication failed',
    code: AuthErrorCode = AUTH_ERROR_CODES.INVALID_CREDENTIALS,
    context: AuthErrorContext = {}
  ) {
    super(message, code, context);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization failed error
 */
export class AuthorizationError extends AuthError {
  constructor(
    message = 'Authorization failed',
    code: AuthErrorCode = AUTH_ERROR_CODES.FORBIDDEN,
    context: AuthErrorContext = {}
  ) {
    super(message, code, context);
    this.name = 'AuthorizationError';
  }
}

/**
 * Session error
 */
export class SessionError extends AuthError {
  constructor(
    message = 'Session error',
    code: AuthErrorCode = AUTH_ERROR_CODES.SESSION_INVALID,
    context: AuthErrorContext = {}
  ) {
    super(message, code, context);
    this.name = 'SessionError';
  }
}

/**
 * Provider error
 */
export class ProviderError extends AuthError {
  constructor(
    message = 'Provider error',
    code: AuthErrorCode = AUTH_ERROR_CODES.PROVIDER_ERROR,
    context: AuthErrorContext = {}
  ) {
    super(message, code, context);
    this.name = 'ProviderError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends AuthError {
  constructor(
    message = 'Validation error',
    code: AuthErrorCode = AUTH_ERROR_CODES.VALIDATION_ERROR,
    context: AuthErrorContext = {}
  ) {
    super(message, code, context);
    this.name = 'ValidationError';
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends AuthError {
  constructor(
    message = 'Configuration error',
    code: AuthErrorCode = AUTH_ERROR_CODES.CONFIGURATION_ERROR,
    context: AuthErrorContext = {}
  ) {
    super(message, code, context, false); // Not operational - indicates programming error
    this.name = 'ConfigurationError';
  }
}

/**
 * Create an auth error from an unknown error
 */
export function createAuthError(
  error: unknown,
  defaultMessage = 'An error occurred',
  defaultCode: AuthErrorCode = AUTH_ERROR_CODES.UNKNOWN_ERROR
): AuthError {
  if (error instanceof AuthError) {
    return error;
  }

  if (error instanceof Error) {
    return new AuthError(
      error.message || defaultMessage,
      defaultCode,
      { originalError: error }
    );
  }

  if (typeof error === 'string') {
    return new AuthError(error, defaultCode);
  }

  return new AuthError(defaultMessage, defaultCode, {
    metadata: { error },
  });
}

/**
 * Type guard to check if error is an AuthError
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

/**
 * Type guard to check if error has a specific code
 */
export function hasErrorCode<T extends AuthErrorCode>(
  error: unknown,
  code: T
): error is AuthError & { code: T } {
  return isAuthError(error) && error.code === code;
}