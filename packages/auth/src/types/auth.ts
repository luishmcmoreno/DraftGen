/**
 * Core authentication types
 */

import type { User, Session } from '@supabase/supabase-js';

/**
 * Authentication configuration
 */
export interface AuthConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRole?: string;
  redirectTo?: string;
  debug?: boolean;
  sessionRefreshInterval?: number; // in milliseconds
  providers?: AuthProviderConfig[];
}

/**
 * Provider-specific configuration
 */
export interface AuthProviderConfig {
  name: AuthProviderName;
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  scopes?: string[];
  options?: Record<string, unknown>;
}

/**
 * Supported authentication providers
 */
export type AuthProviderName = 
  | 'google'
  | 'github'
  | 'gitlab'
  | 'bitbucket'
  | 'azure'
  | 'facebook'
  | 'twitter'
  | 'discord'
  | 'linkedin'
  | 'email'
  | 'magic-link';

/**
 * Extended user type with profile
 */
export type AuthUser = User & {
  profile?: AuthProfile;
  roles?: string[];
  permissions?: string[];
};

/**
 * User profile information
 */
export interface AuthProfile {
  id: string;
  user_id: string;
  email?: string;
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Extended session type
 */
export type AuthSession = Session & {
  user: AuthUser;
};

/**
 * Authentication state
 */
export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  error: AuthError | null;
  initialized: boolean;
}

/**
 * Authentication error
 */
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  statusCode?: number;
  details?: unknown;
  originalError?: Error;
}

/**
 * Standard auth error codes
 */
export type AuthErrorCode =
  | 'auth/invalid-credentials'
  | 'auth/user-not-found'
  | 'auth/email-already-exists'
  | 'auth/weak-password'
  | 'auth/invalid-email'
  | 'auth/operation-not-allowed'
  | 'auth/account-disabled'
  | 'auth/session-expired'
  | 'auth/network-error'
  | 'auth/internal-error'
  | 'auth/unauthorized'
  | 'auth/forbidden'
  | 'auth/rate-limit'
  | 'auth/provider-error'
  | 'auth/configuration-error';

/**
 * Sign in credentials
 */
export interface SignInCredentials {
  email: string;
  password: string;
  options?: SignInOptions;
}

/**
 * Sign up credentials
 */
export interface SignUpCredentials {
  email: string;
  password: string;
  profile?: Partial<AuthProfile>;
  options?: SignUpOptions;
}

/**
 * OAuth sign in options
 */
export interface OAuthSignInOptions {
  provider: AuthProviderName;
  redirectTo?: string;
  scopes?: string;
  queryParams?: Record<string, string>;
  skipBrowserRedirect?: boolean;
}

/**
 * Sign in options
 */
export interface SignInOptions {
  redirectTo?: string;
  captchaToken?: string;
}

/**
 * Sign up options
 */
export interface SignUpOptions {
  redirectTo?: string;
  captchaToken?: string;
  emailRedirectTo?: string;
  data?: Record<string, unknown>;
}

/**
 * Password reset options
 */
export interface PasswordResetOptions {
  email: string;
  redirectTo?: string;
  captchaToken?: string;
}

/**
 * Update password options
 */
export interface UpdatePasswordOptions {
  newPassword: string;
  currentPassword?: string;
}

/**
 * Auth response type
 */
export interface AuthResponse<T = unknown> {
  data?: T;
  error?: AuthError;
}

/**
 * Token response
 */
export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  user?: AuthUser;
}

/**
 * Auth event types
 */
export type AuthEventType =
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'
  | 'MFA_CHALLENGE_VERIFIED';

/**
 * Auth change event
 */
export interface AuthChangeEvent {
  event: AuthEventType;
  session: AuthSession | null;
}

/**
 * Auth listener unsubscribe function
 */
export type AuthListenerUnsubscribe = () => void;