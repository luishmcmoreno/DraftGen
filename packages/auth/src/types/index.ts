/**
 * Type definitions for the auth package
 * 
 * This file re-exports all types from submodules for convenience
 */

// Core auth types
export type {
  AuthConfig,
  AuthProviderConfig,
  AuthProviderName,
  AuthUser,
  AuthProfile,
  AuthSession,
  AuthState,
  AuthError,
  AuthErrorCode,
  SignInCredentials,
  SignUpCredentials,
  OAuthSignInOptions,
  SignInOptions,
  SignUpOptions,
  PasswordResetOptions,
  UpdatePasswordOptions,
  AuthResponse,
  TokenResponse,
  AuthEventType,
  AuthChangeEvent,
  AuthListenerUnsubscribe,
} from './auth';

// Database types
export type {
  DatabaseTable,
  DatabaseProfile,
  DatabaseUserRole,
  DatabaseRole,
  DatabasePermission,
  DatabaseSession,
  DatabaseAuthAudit,
  DatabaseProviderAccount,
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from './database';

// Provider types
export type {
  AuthProvider,
  OAuthProvider,
  EmailProvider,
  MagicLinkProvider,
  ProviderConfig,
  ProviderSignInOptions,
  ProviderSignOutOptions,
  ProviderSignInResult,
  ProviderSession,
  OAuthAuthorizationOptions,
  OAuthCallbackParams,
  OAuthTokens,
  EmailSignUpOptions,
  MagicLinkOptions,
  ProviderFactory,
  IProviderRegistry,
} from './providers';

// Re-export Supabase types for convenience
export type { User, Session } from '@supabase/supabase-js';