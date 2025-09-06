/**
 * @draft-gen/auth - Shared authentication package
 * 
 * Main entry point for the authentication package.
 * Re-exports all public APIs from submodules.
 */

// Export types
export * from './types';

// Export providers
export * from './providers';

// Export errors (excluding conflicting exports from types)
export {
  // From auth-error.ts
  AUTH_ERROR_CODES,
  AuthError,
  AuthenticationError,
  AuthorizationError,
  SessionError,
  ProviderError,
  ValidationError,
  ConfigurationError,
  createAuthError,
  isAuthError,
  hasErrorCode,
  type AuthErrorContext,
  // From handlers.ts
  handleAuthError,
  fromSupabaseError,
  createErrorResponse,
  handleComponentError,
  withRetry,
  CircuitBreaker,
  setupGlobalErrorHandlers,
  type ErrorResponse,
  type RetryConfig,
  type CircuitBreakerConfig,
} from './errors';

// Export utilities
export * from './utils';

// Note: Server, client, react, and middleware exports are available
// through their respective subpath exports:
// - @draft-gen/auth/server
// - @draft-gen/auth/client  
// - @draft-gen/auth/react
// - @draft-gen/auth/middleware

// Re-export commonly used types for convenience
export type { AuthConfig, AuthUser, AuthProfile, AuthSession } from './types';