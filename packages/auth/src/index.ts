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

// Note: Server, client, react, and middleware exports are available
// through their respective subpath exports:
// - @draft-gen/auth/server
// - @draft-gen/auth/client  
// - @draft-gen/auth/react
// - @draft-gen/auth/middleware

// Re-export commonly used types for convenience
export type { AuthConfig, AuthUser, AuthProfile, AuthSession } from './types';