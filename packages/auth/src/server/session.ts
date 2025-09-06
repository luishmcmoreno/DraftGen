/**
 * Session management functions
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '../clients/server';
import type { 
  AuthSession,
  AuthResponse,
  AuthError,
  AuthChangeEvent,
  AuthEventType,
  AuthListenerUnsubscribe
} from '../types';

/**
 * Create an auth error for session operations
 */
function createSessionError(message: string, originalError?: unknown): AuthError {
  return {
    code: 'auth/session-expired',
    message,
    statusCode: 401,
    originalError: originalError instanceof Error ? originalError : undefined,
    details: originalError
  };
}

/**
 * Get the current session
 * 
 * @param client - Optional Supabase client
 * @returns Current session or null
 */
export async function getSession(
  client?: SupabaseClient
): Promise<AuthResponse<AuthSession | null>> {
  try {
    const supabase = client || await createServerClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      return {
        data: null,
        error: createSessionError('Failed to get session', error)
      };
    }

    return { data: session as AuthSession | null };
  } catch (error) {
    return {
      data: null,
      error: createSessionError('An unexpected error occurred while getting session', error)
    };
  }
}

/**
 * Refresh the current session
 * 
 * @param refreshToken - Optional refresh token (uses current session if not provided)
 * @param client - Optional Supabase client
 * @returns New session or error
 */
export async function refreshSession(
  refreshToken?: string,
  client?: SupabaseClient
): Promise<AuthResponse<AuthSession | null>> {
  try {
    const supabase = client || await createServerClient();
    
    // If refresh token provided, use it
    if (refreshToken) {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error) {
        return {
          data: null,
          error: createSessionError('Failed to refresh session with token', error)
        };
      }

      return { data: data.session as AuthSession };
    }

    // Otherwise refresh current session
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      return {
        data: null,
        error: createSessionError('Failed to refresh current session', error)
      };
    }

    return { data: data.session as AuthSession };
  } catch (error) {
    return {
      data: null,
      error: createSessionError('An unexpected error occurred while refreshing session', error)
    };
  }
}

/**
 * Set a new session
 * 
 * @param accessToken - Access token
 * @param refreshToken - Refresh token
 * @param client - Optional Supabase client
 * @returns Session or error
 */
export async function setSession(
  accessToken: string,
  refreshToken: string,
  client?: SupabaseClient
): Promise<AuthResponse<AuthSession | null>> {
  try {
    const supabase = client || await createServerClient();
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    if (error) {
      return {
        data: null,
        error: createSessionError('Failed to set session', error)
      };
    }

    return { data: data.session as AuthSession };
  } catch (error) {
    return {
      data: null,
      error: createSessionError('An unexpected error occurred while setting session', error)
    };
  }
}


/**
 * Verify a session token
 * 
 * @param token - Session token to verify
 * @param client - Optional Supabase client
 * @returns User data or error
 */
export async function verifySession(
  token: string,
  client?: SupabaseClient
): Promise<AuthResponse<any>> {
  try {
    const supabase = client || await createServerClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      return {
        data: null,
        error: createSessionError('Invalid or expired session token', error)
      };
    }

    return { data };
  } catch (error) {
    return {
      data: null,
      error: createSessionError('An unexpected error occurred while verifying session', error)
    };
  }
}

/**
 * Listen to auth state changes
 * 
 * Note: This is primarily for browser context as it requires a persistent connection.
 * In server context, you typically check auth state on each request.
 * 
 * @param callback - Function to call on auth state changes
 * @param client - Optional Supabase client
 * @returns Unsubscribe function
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent) => void,
  client?: SupabaseClient
): AuthListenerUnsubscribe {
  // This function is async but we need to return immediately
  let unsubscribe: AuthListenerUnsubscribe = () => {};

  (async () => {
    try {
      const supabase = client || await createServerClient();
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        callback({
          event: event as AuthEventType,
          session: session as AuthSession | null
        });
      });

      if (data?.subscription) {
        unsubscribe = () => data.subscription.unsubscribe();
      }
    } catch (error) {
      console.error('Failed to set up auth state listener:', error);
    }
  })();

  return () => unsubscribe();
}

/**
 * Check if a session is valid (not expired)
 * 
 * @param session - Session to check
 * @returns Boolean indicating if session is valid
 */
export function isSessionValid(session: AuthSession | null): boolean {
  if (!session) return false;
  
  // Check if session has required fields
  if (!session.access_token || !session.expires_at) return false;
  
  // Check if session is expired
  const expiresAt = new Date(session.expires_at * 1000);
  const now = new Date();
  
  // Add 60 second buffer to account for clock skew
  const bufferMs = 60 * 1000;
  return expiresAt.getTime() > now.getTime() + bufferMs;
}

/**
 * Get time until session expires
 * 
 * @param session - Session to check
 * @returns Milliseconds until expiration, or 0 if expired/invalid
 */
export function getSessionExpiresIn(session: AuthSession | null): number {
  if (!session || !session.expires_at) return 0;
  
  const expiresAt = new Date(session.expires_at * 1000);
  const now = new Date();
  const msUntilExpiry = expiresAt.getTime() - now.getTime();
  
  return Math.max(0, msUntilExpiry);
}

/**
 * Create a session refresh timer
 * 
 * @param callback - Function to call when session should be refreshed
 * @param session - Current session
 * @param bufferMinutes - Minutes before expiry to refresh (default: 5)
 * @returns Clear timer function
 */
export function createSessionRefreshTimer(
  callback: () => void,
  session: AuthSession | null,
  bufferMinutes: number = 5
): () => void {
  const msUntilExpiry = getSessionExpiresIn(session);
  
  if (msUntilExpiry <= 0) {
    // Session already expired, call immediately
    callback();
    return () => {};
  }
  
  // Calculate when to refresh (with buffer)
  const bufferMs = bufferMinutes * 60 * 1000;
  const refreshIn = Math.max(0, msUntilExpiry - bufferMs);
  
  // Set timer
  const timer = setTimeout(callback, refreshIn);
  
  // Return cleanup function
  return () => clearTimeout(timer);
}