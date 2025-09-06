/**
 * Session management middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '../clients/middleware';
import type { Database } from '../types';

/**
 * Session middleware configuration
 */
export interface SessionMiddlewareConfig {
  /**
   * Enable automatic session refresh
   */
  autoRefresh?: boolean;

  /**
   * Session refresh interval in seconds (default: 3600 - 1 hour)
   */
  refreshInterval?: number;

  /**
   * Session timeout in seconds (default: 86400 - 24 hours)
   */
  sessionTimeout?: number;

  /**
   * Cookie configuration
   */
  cookieOptions?: {
    name?: string;
    domain?: string;
    path?: string;
    sameSite?: 'strict' | 'lax' | 'none';
    secure?: boolean;
    httpOnly?: boolean;
  };

  /**
   * Callback when session is refreshed
   */
  onRefresh?: (session: any) => void | Promise<void>;

  /**
   * Callback when session expires
   */
  onExpire?: (request: NextRequest) => void | Promise<void>;

  /**
   * Enable debug logging
   */
  debug?: boolean;
}

/**
 * Create session management middleware
 */
export function createSessionMiddleware<T extends Database = Database>(
  config: SessionMiddlewareConfig = {}
) {
  const {
    autoRefresh = true,
    refreshInterval = 3600, // 1 hour
    sessionTimeout = 86400, // 24 hours
    cookieOptions = {},
    onRefresh,
    onExpire,
    debug = false,
  } = config;

  return async function sessionMiddleware(request: NextRequest): Promise<NextResponse> {
    const response = NextResponse.next();

    if (debug) {
      console.log('[Session Middleware] Processing request');
    }

    // Create Supabase client
    const { supabase } = createMiddlewareClient<T>(request, response);

    // Get current session
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      if (debug) {
        console.error('[Session Middleware] Error getting session:', error);
      }
      return response;
    }

    if (!session) {
      if (debug) {
        console.log('[Session Middleware] No session found');
      }
      return response;
    }

    // Check session expiry
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;

    if (expiresAt && expiresAt <= now) {
      if (debug) {
        console.log('[Session Middleware] Session expired');
      }

      // Session has expired
      if (onExpire) {
        await onExpire(request);
      }

      // Clear session
      await supabase.auth.signOut();

      // Set session expired header
      response.headers.set('x-session-expired', 'true');

      return response;
    }

    // Check if session needs refresh
    if (autoRefresh && expiresAt) {
      const timeUntilExpiry = expiresAt - now;

      // Refresh if less than refreshInterval seconds until expiry
      if (timeUntilExpiry < refreshInterval) {
        if (debug) {
          console.log('[Session Middleware] Refreshing session');
        }

        const {
          data: { session: newSession },
          error: refreshError,
        } = await supabase.auth.refreshSession();

        if (refreshError) {
          if (debug) {
            console.error('[Session Middleware] Error refreshing session:', refreshError);
          }

          // Set refresh error header
          response.headers.set('x-session-refresh-error', 'true');
        } else if (newSession) {
          if (debug) {
            console.log('[Session Middleware] Session refreshed successfully');
          }

          // Session refreshed successfully
          if (onRefresh) {
            await onRefresh(newSession);
          }

          // Set session refreshed header
          response.headers.set('x-session-refreshed', 'true');
          response.headers.set('x-session-expires-at', String(newSession.expires_at));
        }
      }
    }

    // Set session info headers
    response.headers.set('x-session-valid', 'true');
    response.headers.set('x-session-user-id', session.user.id);

    if (expiresAt) {
      response.headers.set('x-session-expires-at', String(expiresAt));
      response.headers.set('x-session-expires-in', String(expiresAt - now));
    }

    // Apply cookie options if specified
    if (cookieOptions.name) {
      const cookieValue = request.cookies.get(cookieOptions.name);

      if (cookieValue) {
        response.cookies.set({
          name: cookieOptions.name,
          value: cookieValue.value,
          domain: cookieOptions.domain,
          path: cookieOptions.path || '/',
          sameSite: cookieOptions.sameSite || 'lax',
          secure: cookieOptions.secure ?? true,
          httpOnly: cookieOptions.httpOnly ?? true,
          maxAge: sessionTimeout,
        });
      }
    }

    return response;
  };
}

/**
 * Refresh session helper
 */
export async function refreshSession(
  request: NextRequest,
  response: NextResponse
): Promise<{ success: boolean; session?: any; error?: any }> {
  const { supabase } = createMiddlewareClient(request, response);

  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    return { success: false, error };
  }

  return { success: true, session: data.session };
}

/**
 * Validate session helper
 */
export async function validateSession(
  request: NextRequest,
  response: NextResponse
): Promise<{ valid: boolean; session?: any; user?: any }> {
  const { supabase } = createMiddlewareClient(request, response);

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return { valid: false };
  }

  // Check if session is expired
  const now = Math.floor(Date.now() / 1000);
  if (session.expires_at && session.expires_at <= now) {
    return { valid: false, session };
  }

  return { valid: true, session, user: session.user };
}

/**
 * Get session from request
 */
export async function getSessionFromRequest(request: NextRequest): Promise<any | null> {
  const response = NextResponse.next();
  const { supabase } = createMiddlewareClient(request, response);

  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Get user from request
 */
export async function getUserFromRequest(request: NextRequest): Promise<any | null> {
  const session = await getSessionFromRequest(request);
  return session?.user || null;
}

/**
 * Session cookie manager
 */
export class SessionCookieManager {
  private cookieName: string;
  private cookieOptions: any;

  constructor(cookieName = 'auth-session', cookieOptions: any = {}) {
    this.cookieName = cookieName;
    this.cookieOptions = {
      path: '/',
      sameSite: 'lax',
      secure: true,
      httpOnly: true,
      ...cookieOptions,
    };
  }

  /**
   * Set session cookie
   */
  setSessionCookie(response: NextResponse, sessionToken: string, expiresIn?: number): void {
    response.cookies.set({
      name: this.cookieName,
      value: sessionToken,
      ...this.cookieOptions,
      maxAge: expiresIn || 86400, // Default 24 hours
    });
  }

  /**
   * Get session cookie
   */
  getSessionCookie(request: NextRequest): string | undefined {
    return request.cookies.get(this.cookieName)?.value;
  }

  /**
   * Clear session cookie
   */
  clearSessionCookie(response: NextResponse): void {
    response.cookies.delete(this.cookieName);
  }

  /**
   * Refresh session cookie
   */
  refreshSessionCookie(request: NextRequest, response: NextResponse, expiresIn?: number): boolean {
    const sessionToken = this.getSessionCookie(request);

    if (!sessionToken) {
      return false;
    }

    this.setSessionCookie(response, sessionToken, expiresIn);
    return true;
  }
}
