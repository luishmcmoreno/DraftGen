/**
 * Error handling utilities with strong typing
 */

import { NextResponse } from 'next/server';
import { Logger } from '@draft-gen/logger';
import type { AuthError as SupabaseAuthError } from '@supabase/supabase-js';
import {
  AuthError,
  AUTH_ERROR_CODES,
  AuthErrorCode,
  createAuthError,
  isAuthError,
  AuthenticationError,
  SessionError,
  ProviderError,
  ValidationError,
  type AuthErrorContext,
} from './auth-error';

// Create auth-specific logger
const authLogger = new Logger({ prefix: '[@draft-gen/auth]' });

/**
 * Error response format
 */
export interface ErrorResponse {
  error: {
    message: string;
    code: AuthErrorCode;
    details?: Record<string, unknown>;
  };
  timestamp: string;
  requestId?: string;
}

/**
 * Handle and log authentication errors
 */
export function handleAuthError(
  error: unknown,
  context?: {
    operation?: string;
    userId?: string;
    provider?: string;
    metadata?: Record<string, unknown>;
  }
): AuthError {
  const authError = createAuthError(error);

  // Log the error with context
  const logContext = {
    code: authError.code,
    operation: context?.operation,
    userId: context?.userId,
    provider: context?.provider,
    ...context?.metadata,
  };

  if (authError.isOperational) {
    authLogger.warn('Authentication error:', authError.message, logContext);
  } else {
    authLogger.error('Unexpected authentication error:', authError.message, logContext);
  }

  return authError;
}

/**
 * Convert Supabase auth error to our AuthError
 */
export function fromSupabaseError(error: SupabaseAuthError): AuthError {
  const errorMessage = error.message || 'Supabase authentication error';
  
  // Map Supabase error codes to our error codes
  let code: AuthErrorCode = AUTH_ERROR_CODES.UNKNOWN_ERROR;
  let context: AuthErrorContext = {
    originalError: error as Error,
    metadata: {
      supabaseCode: error.code,
      supabaseStatus: error.status,
    },
  };

  // Handle specific Supabase error patterns
  if (error.message.includes('Invalid login credentials')) {
    code = AUTH_ERROR_CODES.INVALID_CREDENTIALS;
  } else if (error.message.includes('User not found')) {
    code = AUTH_ERROR_CODES.USER_NOT_FOUND;
  } else if (error.message.includes('Email not confirmed')) {
    return new ValidationError('Email not confirmed', AUTH_ERROR_CODES.VALIDATION_ERROR, context);
  } else if (error.message.includes('session')) {
    code = AUTH_ERROR_CODES.SESSION_INVALID;
    return new SessionError(errorMessage, code, context);
  } else if (error.message.includes('OAuth')) {
    code = AUTH_ERROR_CODES.OAUTH_ERROR;
    return new ProviderError(errorMessage, code, context);
  } else if (error.message.includes('Network')) {
    code = AUTH_ERROR_CODES.NETWORK_ERROR;
  } else if (error.status === 401) {
    code = AUTH_ERROR_CODES.UNAUTHORIZED;
    return new AuthenticationError(errorMessage, code, context);
  } else if (error.status === 403) {
    code = AUTH_ERROR_CODES.FORBIDDEN;
  } else if (error.status === 400) {
    code = AUTH_ERROR_CODES.VALIDATION_ERROR;
    return new ValidationError(errorMessage, code, context);
  }

  return new AuthError(errorMessage, code, context);
}

/**
 * Create error response for API routes
 */
export function createErrorResponse(
  error: unknown,
  requestId?: string
): NextResponse<ErrorResponse> {
  const authError = isAuthError(error) ? error : createAuthError(error);
  
  const response: ErrorResponse = {
    error: {
      message: authError.message,
      code: authError.code,
      details: authError.context.metadata,
    },
    timestamp: new Date().toISOString(),
    requestId,
  };

  return NextResponse.json(response, {
    status: authError.getStatusCode(),
    headers: {
      'X-Error-Code': authError.code,
      ...(requestId && { 'X-Request-Id': requestId }),
    },
  });
}

/**
 * Error boundary handler for React components
 */
export function handleComponentError(
  error: Error,
  errorInfo: { componentStack: string }
): void {
  const authError = createAuthError(error, 'Component error', AUTH_ERROR_CODES.INTERNAL_ERROR);
  
  authLogger.error('React component error:', {
    message: authError.message,
    code: authError.code,
    componentStack: errorInfo.componentStack,
  });
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: AuthErrorCode[];
}

/**
 * Retry wrapper for async operations with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryableErrors = [
      AUTH_ERROR_CODES.NETWORK_ERROR,
      AUTH_ERROR_CODES.TIMEOUT,
      AUTH_ERROR_CODES.SERVICE_UNAVAILABLE,
    ],
  } = config;

  let lastError: AuthError | undefined;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = createAuthError(error);
      
      // Check if error is retryable
      if (!retryableErrors.includes(lastError.code)) {
        throw lastError;
      }

      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        authLogger.error(`Operation failed after ${maxAttempts} attempts`, {
          error: lastError.message,
          code: lastError.code,
        });
        throw lastError;
      }

      // Log retry attempt
      authLogger.info(`Retrying operation (attempt ${attempt}/${maxAttempts})`, {
        delay,
        error: lastError.message,
      });

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next attempt
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError || new AuthError('Operation failed', AUTH_ERROR_CODES.UNKNOWN_ERROR);
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  threshold?: number;
  timeout?: number;
  resetTimeout?: number;
}

/**
 * Circuit breaker state
 */
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Circuit breaker for protecting against cascading failures
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private lastFailureTime?: Date;
  private readonly config: Required<CircuitBreakerConfig>;

  constructor(config: CircuitBreakerConfig = {}) {
    this.config = {
      threshold: config.threshold ?? 5,
      timeout: config.timeout ?? 60000, // 1 minute
      resetTimeout: config.resetTimeout ?? 30000, // 30 seconds
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new AuthError(
          'Circuit breaker is open - service temporarily unavailable',
          AUTH_ERROR_CODES.SERVICE_UNAVAILABLE
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    
    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.config.resetTimeout;
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      authLogger.info('Circuit breaker reset to closed');
    }
    this.failures = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      authLogger.warn('Circuit breaker opened after failure in half-open state');
    } else if (this.failures >= this.config.threshold) {
      this.state = CircuitState.OPEN;
      authLogger.warn(`Circuit breaker opened after ${this.failures} failures`);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.lastFailureTime = undefined;
    authLogger.info('Circuit breaker manually reset');
  }
}

/**
 * Global error handler for unhandled promise rejections
 */
export function setupGlobalErrorHandlers(): void {
  if (typeof window !== 'undefined') {
    // Browser environment
    window.addEventListener('unhandledrejection', (event) => {
      const error = createAuthError(event.reason);
      authLogger.error('Unhandled promise rejection:', {
        message: error.message,
        code: error.code,
      });
    });
  } else {
    // Node.js environment
    process.on('unhandledRejection', (reason) => {
      const error = createAuthError(reason);
      authLogger.error('Unhandled promise rejection:', {
        message: error.message,
        code: error.code,
      });
    });

    process.on('uncaughtException', (error) => {
      const authError = createAuthError(error);
      authLogger.error('Uncaught exception:', {
        message: authError.message,
        code: authError.code,
      });
      
      // Exit process after logging
      process.exit(1);
    });
  }
}