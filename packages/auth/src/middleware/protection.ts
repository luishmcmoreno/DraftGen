/**
 * Route protection utilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '../clients/middleware';
import type { AuthUser, Database } from '../types';
import { authLogger } from '../utils/logger';

/**
 * Route protection configuration
 */
export interface RouteProtectionConfig {
  /**
   * Protected route patterns
   */
  routes: RouteConfig[];
  
  /**
   * Default redirect for unauthenticated users
   */
  defaultRedirect?: string;
  
  /**
   * Default redirect for unauthorized users
   */
  unauthorizedRedirect?: string;
  
  /**
   * Enable debug logging
   */
  debug?: boolean;
}

/**
 * Individual route configuration
 */
export interface RouteConfig {
  /**
   * Path pattern (supports wildcards)
   */
  path: string | RegExp;
  
  /**
   * Required authentication
   */
  requireAuth?: boolean;
  
  /**
   * Required roles
   */
  roles?: string[];
  
  /**
   * Required permissions
   */
  permissions?: string[];
  
  /**
   * Require all roles/permissions (default: false - requires any)
   */
  requireAll?: boolean;
  
  /**
   * Custom authorization function
   */
  authorize?: (user: AuthUser, request: NextRequest) => boolean | Promise<boolean>;
  
  /**
   * Custom redirect path
   */
  redirectTo?: string;
  
  /**
   * Allow guest access
   */
  guestOnly?: boolean;
}

/**
 * Create route protection middleware
 */
export function createRouteProtection<T extends Database = Database>(
  config: RouteProtectionConfig
) {
  const {
    routes,
    defaultRedirect = '/login',
    unauthorizedRedirect = '/403',
    debug = false
  } = config;

  return async function routeProtectionMiddleware(
    request: NextRequest
  ): Promise<NextResponse> {
    const pathname = request.nextUrl.pathname;
    
    if (debug) {
      authLogger.debug('[Route Protection] Checking path:', { pathname });
    }

    // Find matching route config
    const routeConfig = findMatchingRoute(pathname, routes);
    
    if (!routeConfig) {
      if (debug) {
        authLogger.debug('[Route Protection] No matching route config, allowing access');
      }
      return NextResponse.next();
    }

    if (debug) {
      authLogger.debug('[Route Protection] Found route config:', routeConfig);
    }

    // Check route requirements
    const protectionResult = await checkRouteProtection(
      request,
      routeConfig,
      { defaultRedirect, unauthorizedRedirect, debug }
    );

    return protectionResult;
  };
}

/**
 * Find matching route configuration
 */
function findMatchingRoute(
  pathname: string,
  routes: RouteConfig[]
): RouteConfig | null {
  for (const route of routes) {
    if (typeof route.path === 'string') {
      // String pattern matching
      if (matchStringPattern(pathname, route.path)) {
        return route;
      }
    } else if (route.path instanceof RegExp) {
      // RegExp pattern matching
      if (route.path.test(pathname)) {
        return route;
      }
    }
  }
  
  return null;
}

/**
 * Match string pattern with wildcards
 */
function matchStringPattern(pathname: string, pattern: string): boolean {
  // Exact match
  if (pattern === pathname) return true;
  
  // Wildcard at end (e.g., /admin/*)
  if (pattern.endsWith('*')) {
    const base = pattern.slice(0, -1);
    return pathname.startsWith(base);
  }
  
  // Wildcard in middle (e.g., /api/*/admin)
  if (pattern.includes('*')) {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\//g, '\\/') + '$'
    );
    return regex.test(pathname);
  }
  
  return false;
}

/**
 * Check route protection requirements
 */
async function checkRouteProtection<T extends Database = Database>(
  request: NextRequest,
  routeConfig: RouteConfig,
  options: {
    defaultRedirect: string;
    unauthorizedRedirect: string;
    debug: boolean;
  }
): Promise<NextResponse> {
  const response = NextResponse.next();
  const { defaultRedirect, unauthorizedRedirect, debug } = options;

  // Create Supabase client
  const { supabase } = createMiddlewareClient<T>(request, response);
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  const authUser = user as AuthUser | null;

  // Check guest-only routes
  if (routeConfig.guestOnly) {
    if (authUser) {
      if (debug) {
        authLogger.debug('[Route Protection] Authenticated user accessing guest-only route');
      }
      
      const redirectTo = routeConfig.redirectTo || '/';
      const url = request.nextUrl.clone();
      url.pathname = redirectTo;
      return NextResponse.redirect(url);
    }
    
    return response;
  }

  // Check authentication requirement
  if (routeConfig.requireAuth && !authUser) {
    if (debug) {
      authLogger.debug('[Route Protection] Authentication required but user not authenticated');
    }
    
    const redirectTo = routeConfig.redirectTo || defaultRedirect;
    const url = request.nextUrl.clone();
    url.pathname = redirectTo;
    url.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // If no user and no auth required, allow access
  if (!authUser) {
    return response;
  }

  // Check roles
  if (routeConfig.roles && routeConfig.roles.length > 0) {
    const hasRequiredRole = checkUserRoles(
      authUser,
      routeConfig.roles,
      routeConfig.requireAll || false
    );
    
    if (!hasRequiredRole) {
      if (debug) {
        authLogger.debug('[Route Protection] User lacks required roles');
      }
      
      const redirectTo = routeConfig.redirectTo || unauthorizedRedirect;
      const url = request.nextUrl.clone();
      url.pathname = redirectTo;
      return NextResponse.redirect(url);
    }
  }

  // Check permissions
  if (routeConfig.permissions && routeConfig.permissions.length > 0) {
    const hasRequiredPermission = checkUserPermissions(
      authUser,
      routeConfig.permissions,
      routeConfig.requireAll || false
    );
    
    if (!hasRequiredPermission) {
      if (debug) {
        authLogger.debug('[Route Protection] User lacks required permissions');
      }
      
      const redirectTo = routeConfig.redirectTo || unauthorizedRedirect;
      const url = request.nextUrl.clone();
      url.pathname = redirectTo;
      return NextResponse.redirect(url);
    }
  }

  // Check custom authorization
  if (routeConfig.authorize) {
    const isAuthorized = await routeConfig.authorize(authUser, request);
    
    if (!isAuthorized) {
      if (debug) {
        authLogger.debug('[Route Protection] Custom authorization failed');
      }
      
      const redirectTo = routeConfig.redirectTo || unauthorizedRedirect;
      const url = request.nextUrl.clone();
      url.pathname = redirectTo;
      return NextResponse.redirect(url);
    }
  }

  // All checks passed
  if (debug) {
    authLogger.debug('[Route Protection] Access granted');
  }
  
  return response;
}

/**
 * Check if user has required roles
 */
function checkUserRoles(
  user: AuthUser,
  requiredRoles: string[],
  requireAll: boolean
): boolean {
  const userRoles = extractUserRoles(user);
  
  if (requireAll) {
    return requiredRoles.every(role => userRoles.includes(role));
  } else {
    return requiredRoles.some(role => userRoles.includes(role));
  }
}

/**
 * Check if user has required permissions
 */
function checkUserPermissions(
  user: AuthUser,
  requiredPermissions: string[],
  requireAll: boolean
): boolean {
  const userPermissions = extractUserPermissions(user);
  
  if (requireAll) {
    return requiredPermissions.every(perm => userPermissions.includes(perm));
  } else {
    return requiredPermissions.some(perm => userPermissions.includes(perm));
  }
}

/**
 * Extract user roles from metadata
 */
function extractUserRoles(user: AuthUser): string[] {
  const roles: string[] = [];
  
  // Check user metadata
  const userRole = user.user_metadata?.role;
  if (userRole && typeof userRole === 'string') {
    roles.push(userRole);
  }
  
  const userRoles = user.user_metadata?.roles;
  if (Array.isArray(userRoles)) {
    roles.push(...userRoles);
  }
  
  // Check app metadata
  const appRole = user.app_metadata?.role;
  if (appRole && typeof appRole === 'string') {
    roles.push(appRole);
  }
  
  const appRoles = user.app_metadata?.roles;
  if (Array.isArray(appRoles)) {
    roles.push(...appRoles);
  }
  
  return [...new Set(roles)]; // Remove duplicates
}

/**
 * Extract user permissions from metadata
 */
function extractUserPermissions(user: AuthUser): string[] {
  const permissions: string[] = [];
  
  // Check user metadata
  const userPerms = user.user_metadata?.permissions;
  if (Array.isArray(userPerms)) {
    permissions.push(...userPerms);
  }
  
  // Check app metadata
  const appPerms = user.app_metadata?.permissions;
  if (Array.isArray(appPerms)) {
    permissions.push(...appPerms);
  }
  
  return [...new Set(permissions)]; // Remove duplicates
}

/**
 * Preset route configurations
 */
export const RoutePresets = {
  /**
   * Admin routes configuration
   */
  admin: (): RouteConfig => ({
    path: '/admin/*',
    requireAuth: true,
    roles: ['admin', 'super-admin'],
    redirectTo: '/login'
  }),

  /**
   * User dashboard configuration
   */
  dashboard: (): RouteConfig => ({
    path: '/dashboard/*',
    requireAuth: true,
    redirectTo: '/login'
  }),

  /**
   * API routes configuration
   */
  api: (): RouteConfig => ({
    path: '/api/*',
    requireAuth: true
  }),

  /**
   * Auth routes (login, signup) configuration
   */
  auth: (): RouteConfig => ({
    path: '/auth/*',
    guestOnly: true,
    redirectTo: '/dashboard'
  }),

  /**
   * Profile routes configuration
   */
  profile: (): RouteConfig => ({
    path: '/profile/*',
    requireAuth: true,
    redirectTo: '/login'
  })
};

/**
 * Create preset route protection
 */
export function createPresetProtection(
  presets: Array<keyof typeof RoutePresets | RouteConfig>,
  customConfig?: Partial<RouteProtectionConfig>
): ReturnType<typeof createRouteProtection> {
  const routes: RouteConfig[] = presets.map(preset => {
    if (typeof preset === 'string' && preset in RoutePresets) {
      return RoutePresets[preset]();
    }
    return preset as RouteConfig;
  });

  return createRouteProtection({
    routes,
    ...customConfig
  });
}