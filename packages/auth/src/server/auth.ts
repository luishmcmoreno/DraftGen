/**
 * Core authentication functions for server-side usage
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '../clients/server';
import type { 
  AuthUser, 
  AuthError, 
  AuthResponse,
  SignInCredentials,
  SignUpCredentials,
  OAuthSignInOptions,
  PasswordResetOptions,
  UpdatePasswordOptions,
  AuthErrorCode
} from '../types';

/**
 * Create an auth error with proper structure
 */
function createAuthError(
  code: AuthErrorCode,
  message: string,
  originalError?: unknown
): AuthError {
  return {
    code,
    message,
    statusCode: getStatusCodeForError(code),
    originalError: originalError instanceof Error ? originalError : undefined,
    details: originalError
  };
}

/**
 * Get HTTP status code for auth error
 */
function getStatusCodeForError(code: AuthErrorCode): number {
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
 * Get the current authenticated user
 * 
 * @param client - Optional Supabase client (will create one if not provided)
 * @returns The authenticated user or null
 */
export async function getUser(
  client?: SupabaseClient
): Promise<AuthResponse<AuthUser | null>> {
  try {
    const supabase = client || await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      return {
        data: null,
        error: createAuthError(
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
      error: createAuthError(
        'auth/internal-error',
        'An unexpected error occurred while getting user',
        error
      )
    };
  }
}

/**
 * Get the current session
 * 
 * @param client - Optional Supabase client
 * @returns The current session or null
 */
export async function getSession(
  client?: SupabaseClient
): Promise<AuthResponse<any>> {
  try {
    const supabase = client || await createServerClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      return {
        data: null,
        error: createAuthError(
          'auth/unauthorized',
          'Failed to get session',
          error
        )
      };
    }

    return { data: session };
  } catch (error) {
    return {
      data: null,
      error: createAuthError(
        'auth/internal-error',
        'An unexpected error occurred while getting session',
        error
      )
    };
  }
}

/**
 * Sign in with email and password
 * 
 * @param credentials - Email and password
 * @param client - Optional Supabase client
 * @returns User and session on success
 */
export async function signInWithPassword(
  credentials: SignInCredentials,
  client?: SupabaseClient
): Promise<AuthResponse<any>> {
  try {
    const supabase = client || await createServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
      options: credentials.options
    });

    if (error) {
      return {
        data: null,
        error: createAuthError(
          'auth/invalid-credentials',
          error.message || 'Invalid email or password',
          error
        )
      };
    }

    return { data };
  } catch (error) {
    return {
      data: null,
      error: createAuthError(
        'auth/internal-error',
        'An unexpected error occurred during sign in',
        error
      )
    };
  }
}

/**
 * Sign up with email and password
 * 
 * @param credentials - Email, password, and optional profile data
 * @param client - Optional Supabase client
 * @returns User and session on success
 */
export async function signUpWithPassword(
  credentials: SignUpCredentials,
  client?: SupabaseClient
): Promise<AuthResponse<any>> {
  try {
    const supabase = client || await createServerClient();
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        ...credentials.options,
        data: {
          ...credentials.options?.data,
          ...credentials.profile
        }
      }
    });

    if (error) {
      const code = error.message?.includes('already registered')
        ? 'auth/email-already-exists'
        : 'auth/internal-error';
      
      return {
        data: null,
        error: createAuthError(code, error.message || 'Sign up failed', error)
      };
    }

    return { data };
  } catch (error) {
    return {
      data: null,
      error: createAuthError(
        'auth/internal-error',
        'An unexpected error occurred during sign up',
        error
      )
    };
  }
}

/**
 * Sign in with OAuth provider
 * 
 * Note: This typically initiates a redirect flow in browser context.
 * For server-side OAuth, you'll need to handle the callback separately.
 * 
 * @param options - OAuth provider and options
 * @param client - Optional Supabase client
 * @returns OAuth URL or error
 */
export async function signInWithOAuth(
  options: OAuthSignInOptions,
  client?: SupabaseClient
): Promise<AuthResponse<any>> {
  try {
    const supabase = client || await createServerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: options.provider as any,
      options: {
        redirectTo: options.redirectTo,
        scopes: options.scopes,
        queryParams: options.queryParams,
        skipBrowserRedirect: options.skipBrowserRedirect ?? true // Default to true for server
      }
    });

    if (error) {
      return {
        data: null,
        error: createAuthError(
          'auth/provider-error',
          `OAuth sign in failed: ${error.message}`,
          error
        )
      };
    }

    return { data };
  } catch (error) {
    return {
      data: null,
      error: createAuthError(
        'auth/internal-error',
        'An unexpected error occurred during OAuth sign in',
        error
      )
    };
  }
}

/**
 * Sign out the current user
 * 
 * @param client - Optional Supabase client
 * @returns Success or error
 */
export async function signOut(
  client?: SupabaseClient
): Promise<AuthResponse<void>> {
  try {
    const supabase = client || await createServerClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        error: createAuthError(
          'auth/internal-error',
          'Failed to sign out',
          error
        )
      };
    }

    return { data: undefined };
  } catch (error) {
    return {
      error: createAuthError(
        'auth/internal-error',
        'An unexpected error occurred during sign out',
        error
      )
    };
  }
}

/**
 * Request a password reset email
 * 
 * @param options - Email and redirect options
 * @param client - Optional Supabase client
 * @returns Success or error
 */
export async function resetPasswordForEmail(
  options: PasswordResetOptions,
  client?: SupabaseClient
): Promise<AuthResponse<void>> {
  try {
    const supabase = client || await createServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      options.email,
      {
        redirectTo: options.redirectTo,
        captchaToken: options.captchaToken
      }
    );

    if (error) {
      return {
        error: createAuthError(
          'auth/internal-error',
          'Failed to send password reset email',
          error
        )
      };
    }

    return { data: undefined };
  } catch (error) {
    return {
      error: createAuthError(
        'auth/internal-error',
        'An unexpected error occurred while sending password reset email',
        error
      )
    };
  }
}

/**
 * Update user password
 * 
 * @param options - New password and optional current password
 * @param client - Optional Supabase client
 * @returns Success or error
 */
export async function updatePassword(
  options: UpdatePasswordOptions,
  client?: SupabaseClient
): Promise<AuthResponse<void>> {
  try {
    const supabase = client || await createServerClient();
    const { error } = await supabase.auth.updateUser({
      password: options.newPassword
    });

    if (error) {
      return {
        error: createAuthError(
          'auth/internal-error',
          'Failed to update password',
          error
        )
      };
    }

    return { data: undefined };
  } catch (error) {
    return {
      error: createAuthError(
        'auth/internal-error',
        'An unexpected error occurred while updating password',
        error
      )
    };
  }
}

/**
 * Refresh the current session
 * 
 * @param client - Optional Supabase client
 * @returns New session or error
 */
export async function refreshSession(
  client?: SupabaseClient
): Promise<AuthResponse<any>> {
  try {
    const supabase = client || await createServerClient();
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      return {
        data: null,
        error: createAuthError(
          'auth/session-expired',
          'Failed to refresh session',
          error
        )
      };
    }

    return { data };
  } catch (error) {
    return {
      data: null,
      error: createAuthError(
        'auth/internal-error',
        'An unexpected error occurred while refreshing session',
        error
      )
    };
  }
}

/**
 * Verify and exchange an OAuth code for a session
 * 
 * @param code - OAuth authorization code
 * @param client - Optional Supabase client
 * @returns Session or error
 */
export async function exchangeCodeForSession(
  code: string,
  client?: SupabaseClient
): Promise<AuthResponse<any>> {
  try {
    const supabase = client || await createServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return {
        data: null,
        error: createAuthError(
          'auth/invalid-credentials',
          'Invalid or expired authorization code',
          error
        )
      };
    }

    return { data };
  } catch (error) {
    return {
      data: null,
      error: createAuthError(
        'auth/internal-error',
        'An unexpected error occurred while exchanging code',
        error
      )
    };
  }
}

/**
 * Check if a user is authenticated (convenience function)
 * 
 * @param client - Optional Supabase client
 * @returns Boolean indicating authentication status
 */
export async function isAuthenticated(
  client?: SupabaseClient
): Promise<boolean> {
  const { data } = await getUser(client);
  return !!data;
}

/**
 * Require authentication or throw error
 * 
 * @param client - Optional Supabase client
 * @returns The authenticated user
 * @throws AuthError if not authenticated
 */
export async function requireAuth(
  client?: SupabaseClient
): Promise<AuthUser> {
  const { data: user, error } = await getUser(client);

  if (error || !user) {
    throw createAuthError(
      'auth/unauthorized',
      'Authentication required'
    );
  }

  return user;
}