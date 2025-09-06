/**
 * Provider-specific type definitions
 */

import type { AuthUser, AuthError, AuthResponse } from './auth';

/**
 * Base authentication provider interface
 */
export interface AuthProvider {
  name: string;
  type: 'oauth' | 'email' | 'phone' | 'magic-link';
  
  /**
   * Initialize the provider
   */
  initialize(config: ProviderConfig): Promise<void>;
  
  /**
   * Sign in with the provider
   */
  signIn(options?: ProviderSignInOptions): Promise<AuthResponse<ProviderSignInResult>>;
  
  /**
   * Sign out with the provider
   */
  signOut(options?: ProviderSignOutOptions): Promise<AuthResponse<void>>;
  
  /**
   * Get the current user from the provider
   */
  getUser(): Promise<AuthResponse<AuthUser | null>>;
  
  /**
   * Refresh the session
   */
  refreshSession(): Promise<AuthResponse<ProviderSession | null>>;
  
  /**
   * Check if provider is configured
   */
  isConfigured(): boolean;
}

/**
 * OAuth provider interface
 */
export interface OAuthProvider extends AuthProvider {
  type: 'oauth';
  
  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(options?: OAuthAuthorizationOptions): string;
  
  /**
   * Handle OAuth callback
   */
  handleCallback(params: OAuthCallbackParams): Promise<AuthResponse<ProviderSignInResult>>;
  
  /**
   * Exchange code for tokens
   */
  exchangeCodeForTokens(code: string): Promise<AuthResponse<OAuthTokens>>;
  
  /**
   * Refresh OAuth tokens
   */
  refreshTokens(refreshToken: string): Promise<AuthResponse<OAuthTokens>>;
}

/**
 * Email provider interface
 */
export interface EmailProvider extends AuthProvider {
  type: 'email';
  
  /**
   * Sign up with email
   */
  signUp(email: string, password: string, options?: EmailSignUpOptions): Promise<AuthResponse<ProviderSignInResult>>;
  
  /**
   * Verify email
   */
  verifyEmail(token: string): Promise<AuthResponse<void>>;
  
  /**
   * Request password reset
   */
  requestPasswordReset(email: string): Promise<AuthResponse<void>>;
  
  /**
   * Reset password
   */
  resetPassword(token: string, newPassword: string): Promise<AuthResponse<void>>;
  
  /**
   * Update password
   */
  updatePassword(currentPassword: string, newPassword: string): Promise<AuthResponse<void>>;
}

/**
 * Magic link provider interface
 */
export interface MagicLinkProvider extends AuthProvider {
  type: 'magic-link';
  
  /**
   * Send magic link
   */
  sendMagicLink(email: string, options?: MagicLinkOptions): Promise<AuthResponse<void>>;
  
  /**
   * Verify magic link
   */
  verifyMagicLink(token: string): Promise<AuthResponse<ProviderSignInResult>>;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  scope?: string[];
  autoRefreshToken?: boolean;
  persistSession?: boolean;
  detectSessionInUrl?: boolean;
  flowType?: 'implicit' | 'pkce';
  debug?: boolean;
}

/**
 * Provider sign in options
 */
export interface ProviderSignInOptions {
  redirectTo?: string;
  scopes?: string[];
  queryParams?: Record<string, string>;
  skipBrowserRedirect?: boolean;
  // For email/password providers
  email?: string;
  password?: string;
}

/**
 * Provider sign out options
 */
export interface ProviderSignOutOptions {
  redirectTo?: string;
  global?: boolean;
}

/**
 * Provider sign in result
 */
export interface ProviderSignInResult {
  user: AuthUser | null;
  session: ProviderSession | null;
  provider: string;
}

/**
 * Provider session
 */
export interface ProviderSession {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type: string;
  provider: string;
  provider_token?: string;
  provider_refresh_token?: string;
  user: AuthUser | null;
}

/**
 * OAuth authorization options
 */
export interface OAuthAuthorizationOptions {
  redirectTo?: string;
  scopes?: string[];
  queryParams?: Record<string, string>;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  state?: string;
}

/**
 * OAuth callback parameters
 */
export interface OAuthCallbackParams {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

/**
 * OAuth tokens
 */
export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
  token_type: string;
  scope?: string;
}

/**
 * Email sign up options
 */
export interface EmailSignUpOptions {
  emailRedirectTo?: string;
  metadata?: Record<string, unknown>;
  data?: Record<string, unknown>;
  captchaToken?: string;
}

/**
 * Magic link options
 */
export interface MagicLinkOptions {
  redirectTo?: string;
  data?: Record<string, unknown>;
  captchaToken?: string;
}

/**
 * Provider factory function
 */
export type ProviderFactory = (config: ProviderConfig) => AuthProvider;

/**
 * Provider registry interface
 */
export interface IProviderRegistry {
  register(name: string, factory: ProviderFactory): void;
  get(name: string): AuthProvider | undefined;
  list(): string[];
  has(name: string): boolean;
}