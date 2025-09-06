/**
 * Authentication provider exports
 */

// Export base provider
export { BaseProvider } from './base';

// Export OAuth providers
export { GoogleProvider } from './google';
export { GitHubProvider } from './github';

// Export email provider
export { EmailPasswordProvider } from './email';

// Re-export provider types
export type {
  AuthProvider,
  OAuthProvider,
  EmailProvider,
  ProviderConfig,
  ProviderSignInOptions,
  ProviderSignOutOptions,
  ProviderSignInResult,
  ProviderSession,
  OAuthAuthorizationOptions,
  OAuthCallbackParams,
  OAuthTokens,
  EmailSignUpOptions,
  MagicLinkOptions
} from '../types/providers';

// Provider factory helper
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthProvider, ProviderConfig } from '../types/providers';
import { GoogleProvider } from './google';
import { GitHubProvider } from './github';
import { EmailPasswordProvider } from './email';

/**
 * Available provider types
 */
export type ProviderType = 'google' | 'github' | 'email';

/**
 * Create an authentication provider instance
 */
export function createProvider(
  type: ProviderType,
  config?: ProviderConfig
): AuthProvider {
  let provider: AuthProvider;

  switch (type) {
    case 'google':
      provider = new GoogleProvider(config);
      break;
    case 'github':
      provider = new GitHubProvider(config);
      break;
    case 'email':
      provider = new EmailPasswordProvider(config);
      break;
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }

  return provider;
}

/**
 * Initialize a provider with Supabase client
 */
export async function initializeProvider(
  provider: AuthProvider,
  client: SupabaseClient,
  config?: ProviderConfig
): Promise<AuthProvider> {
  // Set the Supabase client
  if ('setClient' in provider && typeof provider.setClient === 'function') {
    provider.setClient(client);
  }

  // Initialize with config
  if (config) {
    await provider.initialize(config);
  }

  return provider;
}

/**
 * Provider registry for managing multiple providers
 */
export class ProviderRegistry {
  private providers = new Map<string, AuthProvider>();
  private client?: SupabaseClient;

  /**
   * Set the Supabase client for all providers
   */
  setClient(client: SupabaseClient): void {
    this.client = client;
    
    // Update existing providers
    for (const provider of this.providers.values()) {
      if ('setClient' in provider && typeof provider.setClient === 'function') {
        provider.setClient(client);
      }
    }
  }

  /**
   * Register a provider
   */
  async register(
    name: string,
    provider: AuthProvider,
    config?: ProviderConfig
  ): Promise<void> {
    // Set client if available
    if (this.client && 'setClient' in provider && typeof provider.setClient === 'function') {
      provider.setClient(this.client);
    }

    // Initialize provider
    if (config) {
      await provider.initialize(config);
    }

    this.providers.set(name, provider);
  }

  /**
   * Get a provider by name
   */
  get(name: string): AuthProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Check if a provider is registered
   */
  has(name: string): boolean {
    return this.providers.has(name);
  }

  /**
   * Remove a provider
   */
  remove(name: string): boolean {
    return this.providers.delete(name);
  }

  /**
   * Get all registered providers
   */
  getAll(): Map<string, AuthProvider> {
    return new Map(this.providers);
  }

  /**
   * Clear all providers
   */
  clear(): void {
    this.providers.clear();
  }
}