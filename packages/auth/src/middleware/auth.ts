/**
 * Authentication middleware utilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '../clients/middleware';
import type { AuthUser, Database } from '../types';

/**
 * Middleware configuration options
 */
export interface AuthMiddlewareConfig {
  /**
   * Paths that require authentication
   */
  protectedPaths?: string[];
  
  /**
   * Paths that should be accessible only to guests
   */
  guestPaths?: string[];
  
  /**
   * Paths that should be publicly accessible
   */
  publicPaths?: string[];
  
  /**
   * Redirect path for unauthenticated users
   */
  loginPath?: string;
  
  /**
   * Redirect path for authenticated users accessing guest paths
   */
  dashboardPath?: string;
  
  /**
   * Enable session refresh
   */
  enableSessionRefresh?: boolean;
  
  /**
   * Callback for custom authorization logic
   */
  authorize?: (user: AuthUser, request: NextRequest) => boolean | Promise<boolean>;
  
  /**
   * Callback when authentication fails
   */
  onAuthFailure?: (request: NextRequest) => NextResponse | Promise<NextResponse>;
  
  /**
   * Callback when authentication succeeds
   */
  onAuthSuccess?: (user: AuthUser, request: NextRequest) => void | Promise<void>;
  
  /**
   * Enable debug logging
   */
  debug?: boolean;
}

/**
 * Create authentication middleware
 */
export function createAuthMiddleware<T extends Database = Database>(
  config: AuthMiddlewareConfig = {}
) {
  const {
    protectedPaths = [],
    guestPaths = [],
    publicPaths = [],
    loginPath = '/login',
    dashboardPath = '/dashboard',
    enableSessionRefresh = true,
    authorize,
    onAuthFailure,
    onAuthSuccess,
    debug = false
  } = config;

  return async function authMiddleware(
    request: NextRequest
  ): Promise<NextResponse> {
    const response = NextResponse.next();
    const pathname = request.nextUrl.pathname;

    if (debug) {
      console.log('[Auth Middleware] Processing:', pathname);
    }

    // Check if path is public
    if (isPathMatch(pathname, publicPaths)) {
      if (debug) {
        console.log('[Auth Middleware] Public path, allowing access');
      }
      return response;
    }

    // Create Supabase client
    const { supabase } = createMiddlewareClient<T>(request, response);

    // Get session and user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const user = session?.user as AuthUser | undefined;

    if (debug) {
      console.log('[Auth Middleware] Session:', session ? 'Valid' : 'Invalid');
      if (sessionError) {
        console.error('[Auth Middleware] Session error:', sessionError);
      }
    }

    // Refresh session if enabled and session exists
    if (enableSessionRefresh && session) {
      const { data: { session: refreshedSession }, error: refreshError } = 
        await supabase.auth.refreshSession();
      
      if (debug && refreshError) {
        console.error('[Auth Middleware] Refresh error:', refreshError);
      }

      if (refreshedSession) {
        response.headers.set('x-session-refreshed', 'true');
      }
    }

    // Check if path requires authentication
    const isProtected = isPathMatch(pathname, protectedPaths);
    const isGuestOnly = isPathMatch(pathname, guestPaths);

    // Handle protected paths
    if (isProtected) {
      if (!user) {
        if (debug) {
          console.log('[Auth Middleware] Unauthenticated access to protected path');
        }

        if (onAuthFailure) {
          return await onAuthFailure(request);
        }

        // Redirect to login
        const url = request.nextUrl.clone();
        url.pathname = loginPath;
        url.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(url);
      }

      // Run custom authorization if provided
      if (authorize) {
        const isAuthorized = await authorize(user, request);
        
        if (!isAuthorized) {
          if (debug) {
            console.log('[Auth Middleware] Custom authorization failed');
          }

          if (onAuthFailure) {
            return await onAuthFailure(request);
          }

          // Return 403 Forbidden
          return new NextResponse('Forbidden', { status: 403 });
        }
      }

      // Authentication successful
      if (onAuthSuccess) {
        await onAuthSuccess(user, request);
      }

      return response;
    }

    // Handle guest-only paths
    if (isGuestOnly && user) {
      if (debug) {
        console.log('[Auth Middleware] Authenticated user accessing guest path');
      }

      // Redirect to dashboard
      const url = request.nextUrl.clone();
      url.pathname = dashboardPath;
      return NextResponse.redirect(url);
    }

    return response;
  };
}

/**
 * Check if a path matches any pattern in the list
 */
function isPathMatch(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    // Exact match
    if (pattern === pathname) return true;
    
    // Wildcard match (e.g., /admin/*)
    if (pattern.endsWith('/*')) {
      const base = pattern.slice(0, -2);
      return pathname.startsWith(base + '/') || pathname === base;
    }
    
    // Glob pattern (e.g., /api/*/admin)
    if (pattern.includes('*')) {
      const regex = new RegExp(
        '^' + pattern.replace(/\*/g, '.*').replace(/\//g, '\\/') + '$'
      );
      return regex.test(pathname);
    }
    
    return false;
  });
}

/**
 * Middleware to protect routes
 */
export async function protectRoute(
  request: NextRequest,
  options: {
    redirectTo?: string;
    allowedRoles?: string[];
    allowedPermissions?: string[];
    requireAll?: boolean;
  } = {}
): Promise<NextResponse | null> {
  const response = NextResponse.next();
  const { supabase } = createMiddlewareClient(request, response);
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = options.redirectTo || '/login';
    url.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Check roles if specified
  if (options.allowedRoles && options.allowedRoles.length > 0) {
    const userRoles = getUserRoles(user as AuthUser);
    const hasRole = options.requireAll
      ? options.allowedRoles.every(role => userRoles.includes(role))
      : options.allowedRoles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // Check permissions if specified
  if (options.allowedPermissions && options.allowedPermissions.length > 0) {
    const userPermissions = getUserPermissions(user as AuthUser);
    const hasPermission = options.requireAll
      ? options.allowedPermissions.every(perm => userPermissions.includes(perm))
      : options.allowedPermissions.some(perm => userPermissions.includes(perm));
    
    if (!hasPermission) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return null; // Allow access
}

/**
 * Get user roles from metadata
 */
function getUserRoles(user: AuthUser): string[] {
  const roles: string[] = [];
  
  // Check user metadata
  const metadataRole = user.user_metadata?.role || user.app_metadata?.role;
  if (metadataRole && typeof metadataRole === 'string') {
    roles.push(metadataRole);
  }
  
  // Check roles array
  const metadataRoles = user.user_metadata?.roles || user.app_metadata?.roles;
  if (Array.isArray(metadataRoles)) {
    roles.push(...metadataRoles);
  }
  
  return roles;
}

/**
 * Get user permissions from metadata
 */
function getUserPermissions(user: AuthUser): string[] {
  const permissions: string[] = [];
  
  // Check user metadata
  const metadataPermissions = user.user_metadata?.permissions || user.app_metadata?.permissions;
  if (Array.isArray(metadataPermissions)) {
    permissions.push(...metadataPermissions);
  }
  
  return permissions;
}

/**
 * Chain multiple middleware functions
 */
export function chainMiddleware(
  ...middlewares: Array<(req: NextRequest) => Promise<NextResponse>>
) {
  return async function(request: NextRequest): Promise<NextResponse> {
    for (const middleware of middlewares) {
      const response = await middleware(request);
      
      // If middleware returns a redirect or error, stop chain
      if (response.status !== 200 || response.headers.get('location')) {
        return response;
      }
    }
    
    return NextResponse.next();
  };
}