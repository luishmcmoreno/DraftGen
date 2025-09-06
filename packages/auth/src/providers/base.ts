/**
 * Base provider implementation
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AuthProvider,
  ProviderConfig,
  ProviderSignInOptions,
  ProviderSignOutOptions,
  ProviderSignInResult,
  AuthResponse,
  AuthUser,
  AuthError,
  ProviderSession
} from '../types';

/**
 * Base authentication provider abstract class
 */
export abstract class BaseProvider implements AuthProvider {
  protected config: ProviderConfig;
  protected client?: SupabaseClient;
  
  abstract name: string;
  abstract type: 'oauth' | 'email' | 'phone' | 'magic-link';

  constructor(config: ProviderConfig = {}) {
    this.config = config;
  }

  /**
   * Initialize the provider
   */
  async initialize(config: ProviderConfig): Promise<void> {
    this.config = { ...this.config, ...config };
    
    // Validate required configuration
    await this.validateConfig();
  }

  /**
   * Validate provider configuration
   */
  protected abstract validateConfig(): Promise<void>;

  /**
   * Sign in with the provider
   */
  abstract signIn(
    options?: ProviderSignInOptions
  ): Promise<AuthResponse<ProviderSignInResult>>;

  /**
   * Sign out with the provider
   */
  abstract signOut(
    options?: ProviderSignOutOptions
  ): Promise<AuthResponse<void>>;

  /**
   * Get the current user from the provider
   */
  abstract getUser(): Promise<AuthResponse<AuthUser | null>>;

  /**
   * Refresh the session
   */
  abstract refreshSession(): Promise<AuthResponse<ProviderSession | null>>;

  /**
   * Check if provider is configured
   */
  isConfigured(): boolean {
    // Base implementation - can be overridden
    return !!(this.config.clientId || this.config.clientSecret);
  }

  /**
   * Set the Supabase client
   */
  setClient(client: SupabaseClient): void {
    this.client = client;
  }

  /**
   * Get the Supabase client
   */
  protected getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error(`${this.name} provider: Supabase client not set`);
    }
    return this.client;
  }

  /**
   * Create a provider error
   */
  protected createError(
    code: string,
    message: string,
    originalError?: unknown
  ): AuthError {
    return {
      code: code as any,
      message: `${this.name} provider: ${message}`,
      statusCode: this.getStatusCodeForError(code),
      originalError: originalError instanceof Error ? originalError : undefined,
      details: originalError
    };
  }

  /**
   * Get HTTP status code for error
   */
  protected getStatusCodeForError(code: string): number {
    switch (code) {
      case 'auth/invalid-credentials':
      case 'auth/user-not-found':
        return 401;
      case 'auth/email-already-exists':
        return 409;
      case 'auth/forbidden':
        return 403;
      case 'auth/rate-limit':
        return 429;
      case 'auth/internal-error':
        return 500;
      default:
        return 400;
    }
  }

  /**
   * Convert Supabase session to provider session
   */
  protected toProviderSession(session: any): ProviderSession {
    return {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      expires_at: session.expires_at,
      token_type: session.token_type || 'bearer',
      provider: this.name,
      provider_token: session.provider_token,
      provider_refresh_token: session.provider_refresh_token,
      user: session.user
    };
  }

  /**
   * Convert to provider sign in result
   */
  protected toSignInResult(user: AuthUser, session: any): ProviderSignInResult {
    return {
      user,
      session: this.toProviderSession(session),
      provider: this.name
    };
  }
}