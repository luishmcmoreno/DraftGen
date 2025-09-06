/**
 * Email/Password authentication provider implementation
 */

import { BaseProvider } from './base';
import type {
  EmailProvider,
  ProviderSignInOptions,
  ProviderSignOutOptions,
  ProviderSignInResult,
  AuthResponse,
  AuthUser,
  ProviderSession,
  EmailSignUpOptions
} from '../types';

/**
 * Email/Password authentication provider
 */
export class EmailPasswordProvider extends BaseProvider implements EmailProvider {
  name = 'email';
  type = 'email' as const;

  /**
   * Validate provider configuration
   */
  protected async validateConfig(): Promise<void> {
    // Email auth uses Supabase's built-in configuration
    // No additional validation needed
  }

  /**
   * Sign in with email and password
   */
  async signIn(
    options?: ProviderSignInOptions
  ): Promise<AuthResponse<ProviderSignInResult>> {
    try {
      const client = this.getClient();
      
      if (!options?.email || !options?.password) {
        return {
          error: this.createError(
            'auth/invalid-credentials',
            'Email and password are required'
          )
        };
      }

      const { data, error } = await client.auth.signInWithPassword({
        email: options.email,
        password: options.password
      });

      if (error) {
        return {
          error: this.createError(
            'auth/invalid-credentials',
            `Failed to sign in: ${error.message}`,
            error
          )
        };
      }

      if (!data.user || !data.session) {
        return {
          error: this.createError(
            'auth/internal-error',
            'Invalid response from sign in'
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
          'An unexpected error occurred during sign in',
          error
        )
      };
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(
    email: string,
    password: string,
    options?: EmailSignUpOptions
  ): Promise<AuthResponse<ProviderSignInResult>> {
    try {
      const client = this.getClient();
      
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: options?.metadata,
          emailRedirectTo: options?.emailRedirectTo
        }
      });

      if (error) {
        return {
          error: this.createError(
            'auth/email-already-exists',
            `Failed to sign up: ${error.message}`,
            error
          )
        };
      }

      if (!data.user) {
        return {
          error: this.createError(
            'auth/internal-error',
            'Invalid response from sign up'
          )
        };
      }

      // Note: session might be null if email confirmation is required
      if (data.session) {
        return {
          data: this.toSignInResult(data.user as AuthUser, data.session)
        };
      }

      // Email confirmation required
      return {
        data: {
          user: data.user as AuthUser,
          session: null,
          provider: this.name
        }
      };
    } catch (error) {
      return {
        error: this.createError(
          'auth/internal-error',
          'An unexpected error occurred during sign up',
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
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<AuthResponse<void>> {
    try {
      const client = this.getClient();
      
      const { error } = await client.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      });

      if (error) {
        return {
          error: this.createError(
            'auth/invalid-token',
            'Failed to verify email',
            error
          )
        };
      }

      return { data: undefined };
    } catch (error) {
      return {
        error: this.createError(
          'auth/internal-error',
          'An unexpected error occurred during email verification',
          error
        )
      };
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<AuthResponse<void>> {
    try {
      const client = this.getClient();
      
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: this.config.redirectUri
      });

      if (error) {
        return {
          error: this.createError(
            'auth/user-not-found',
            'Failed to request password reset',
            error
          )
        };
      }

      return { data: undefined };
    } catch (error) {
      return {
        error: this.createError(
          'auth/internal-error',
          'An unexpected error occurred during password reset request',
          error
        )
      };
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<AuthResponse<void>> {
    try {
      const client = this.getClient();
      
      // First verify the token
      const { error: verifyError } = await client.auth.verifyOtp({
        token_hash: token,
        type: 'recovery'
      });

      if (verifyError) {
        return {
          error: this.createError(
            'auth/invalid-token',
            'Invalid or expired reset token',
            verifyError
          )
        };
      }

      // Then update the password
      const { error: updateError } = await client.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        return {
          error: this.createError(
            'auth/weak-password',
            'Failed to update password',
            updateError
          )
        };
      }

      return { data: undefined };
    } catch (error) {
      return {
        error: this.createError(
          'auth/internal-error',
          'An unexpected error occurred during password reset',
          error
        )
      };
    }
  }

  /**
   * Update password for authenticated user
   */
  async updatePassword(newPassword: string): Promise<AuthResponse<void>> {
    try {
      const client = this.getClient();
      
      const { error } = await client.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return {
          error: this.createError(
            'auth/weak-password',
            'Failed to update password',
            error
          )
        };
      }

      return { data: undefined };
    } catch (error) {
      return {
        error: this.createError(
          'auth/internal-error',
          'An unexpected error occurred while updating password',
          error
        )
      };
    }
  }

  /**
   * Update email for authenticated user
   */
  async updateEmail(newEmail: string): Promise<AuthResponse<void>> {
    try {
      const client = this.getClient();
      
      const { error } = await client.auth.updateUser({
        email: newEmail
      });

      if (error) {
        return {
          error: this.createError(
            'auth/email-already-exists',
            'Failed to update email',
            error
          )
        };
      }

      return { data: undefined };
    } catch (error) {
      return {
        error: this.createError(
          'auth/internal-error',
          'An unexpected error occurred while updating email',
          error
        )
      };
    }
  }
}