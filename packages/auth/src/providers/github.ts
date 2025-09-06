/**
 * GitHub OAuth provider implementation
 */

import { BaseProvider } from './base';
import type {
  OAuthProvider,
  ProviderSignInOptions,
  ProviderSignOutOptions,
  ProviderSignInResult,
  AuthResponse,
  AuthUser,
  ProviderSession,
  OAuthAuthorizationOptions,
  OAuthCallbackParams,
  OAuthTokens
} from '../types';

/**
 * GitHub OAuth authentication provider
 * 
 * Extends GoogleProvider as the OAuth flow is identical,
 * only the provider name changes
 */
export class GitHubProvider extends BaseProvider implements OAuthProvider {
  name = 'github';
  type = 'oauth' as const;

  /**
   * Validate provider configuration
   */
  protected async validateConfig(): Promise<void> {
    // GitHub OAuth uses Supabase's built-in configuration
    // No additional validation needed for basic setup
  }

  /**
   * Sign in with GitHub
   */
  async signIn(
    options?: ProviderSignInOptions
  ): Promise<AuthResponse<ProviderSignInResult>> {
    try {
      const client = this.getClient();
      
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: options?.redirectTo || this.config.redirectUri,
          scopes: options?.scopes?.join(' ') || this.config.scope?.join(' '),
          queryParams: options?.queryParams,
          skipBrowserRedirect: options?.skipBrowserRedirect ?? true
        }
      });

      if (error) {
        return {
          error: this.createError(
            'auth/provider-error',
            `Failed to sign in with GitHub: ${error.message}`,
            error
          )
        };
      }

      if (data.url) {
        return {
          data: {
            user: null,
            session: {
              access_token: '',
              token_type: 'bearer',
              provider: this.name,
              user: null,
              provider_token: data.url
            } as ProviderSession,
            provider: this.name
          }
        };
      }

      return {
        error: this.createError(
          'auth/internal-error',
          'Unexpected response from GitHub OAuth'
        )
      };
    } catch (error) {
      return {
        error: this.createError(
          'auth/internal-error',
          'An unexpected error occurred during GitHub sign in',
          error
        )
      };
    }
  }

  /**
   * Sign out
   */
  async signOut(
    options?: ProviderSignOutOptions
  ): Promise<AuthResponse<void>> {
    try {
      const client = this.getClient();
      
      const { error } = await client.auth.signOut({
        scope: options?.global ? 'global' : 'local'
      });

      if (error) {
        return {
          error: this.createError(
            'auth/internal-error',
            'Failed to sign out',
            error
          )
        };
      }

      return { data: undefined };
    } catch (error) {
      return {
        error: this.createError(
          'auth/internal-error',
          'An unexpected error occurred during sign out',
          error
        )
      };
    }
  }

  /**
   * Get the current user
   */
  async getUser(): Promise<AuthResponse<AuthUser | null>> {
    try {
      const client = this.getClient();
      
      const { data: { user }, error } = await client.auth.getUser();

      if (error) {
        return {
          data: null,
          error: this.createError(
            'auth/unauthorized',
            'Failed to get user',
            error
          )
        };
      }

      return { data: user as AuthUser | null };
    } catch (error) {
      return {
        data: null,
        error: this.createError(
          'auth/internal-error',
          'An unexpected error occurred while getting user',
          error
        )
      };
    }
  }

  /**
   * Refresh the session
   */
  async refreshSession(): Promise<AuthResponse<ProviderSession | null>> {
    try {
      const client = this.getClient();
      
      const { data, error } = await client.auth.refreshSession();

      if (error) {
        return {
          data: null,
          error: this.createError(
            'auth/session-expired',
            'Failed to refresh session',
            error
          )
        };
      }

      if (!data.session) {
        return {
          data: null,
          error: this.createError(
            'auth/session-expired',
            'No session to refresh'
          )
        };
      }

      return { data: this.toProviderSession(data.session) };
    } catch (error) {
      return {
        data: null,
        error: this.createError(
          'auth/internal-error',
          'An unexpected error occurred while refreshing session',
          error
        )
      };
    }
  }

  /**
   * Get OAuth authorization URL for GitHub
   */
  getAuthorizationUrl(options?: OAuthAuthorizationOptions): string {
    const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/authorize`;
    const params = new URLSearchParams({
      provider: 'github',
      redirect_to: options?.redirectTo || this.config.redirectUri || '',
      scopes: options?.scopes?.join(' ') || this.config.scope?.join(' ') || '',
      ...options?.queryParams
    });

    if (options?.codeChallenge) {
      params.set('code_challenge', options.codeChallenge);
      params.set('code_challenge_method', options.codeChallengeMethod || 'S256');
    }

    if (options?.state) {
      params.set('state', options.state);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback(
    params: OAuthCallbackParams
  ): Promise<AuthResponse<ProviderSignInResult>> {
    try {
      if (params.error) {
        return {
          error: this.createError(
            'auth/provider-error',
            params.error_description || params.error
          )
        };
      }

      if (!params.code) {
        return {
          error: this.createError(
            'auth/invalid-credentials',
            'No authorization code received'
          )
        };
      }

      const client = this.getClient();
      const { data, error } = await client.auth.exchangeCodeForSession(params.code);

      if (error) {
        return {
          error: this.createError(
            'auth/invalid-credentials',
            'Failed to exchange code for session',
            error
          )
        };
      }

      if (!data.user || !data.session) {
        return {
          error: this.createError(
            'auth/internal-error',
            'Invalid response from code exchange'
          )
        };
      }

      return {
        data: this.toSignInResult(data.user as AuthUser, data.session)
      };
    } catch (error) {
      return {
        error: this.createError(
          'auth/internal-error',
          'An unexpected error occurred during OAuth callback',
          error
        )
      };
    }
  }

  /**
   * Exchange code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<AuthResponse<OAuthTokens>> {
    try {
      const client = this.getClient();
      const { data, error } = await client.auth.exchangeCodeForSession(code);

      if (error) {
        return {
          error: this.createError(
            'auth/invalid-credentials',
            'Failed to exchange code for tokens',
            error
          )
        };
      }

      if (!data.session) {
        return {
          error: this.createError(
            'auth/internal-error',
            'No session returned from code exchange'
          )
        };
      }

      return {
        data: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token || '',
          expires_in: data.session.expires_in || 0,
          token_type: data.session.token_type || 'bearer'
        }
      };
    } catch (error) {
      return {
        error: this.createError(
          'auth/internal-error',
          'An unexpected error occurred while exchanging code',
          error
        )
      };
    }
  }

  /**
   * Refresh OAuth tokens
   */
  async refreshTokens(refreshToken: string): Promise<AuthResponse<OAuthTokens>> {
    try {
      const client = this.getClient();
      const { data, error } = await client.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error) {
        return {
          error: this.createError(
            'auth/invalid-credentials',
            'Failed to refresh tokens',
            error
          )
        };
      }

      if (!data.session) {
        return {
          error: this.createError(
            'auth/internal-error',
            'No session returned from token refresh'
          )
        };
      }

      return {
        data: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token || '',
          expires_in: data.session.expires_in || 0,
          token_type: data.session.token_type || 'bearer'
        }
      };
    } catch (error) {
      return {
        error: this.createError(
          'auth/internal-error',
          'An unexpected error occurred while refreshing tokens',
          error
        )
      };
    }
  }
}