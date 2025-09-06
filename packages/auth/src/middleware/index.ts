/**
 * Middleware utilities for authentication
 * 
 * Main entry point for middleware utilities
 */

// Re-export middleware client functions
export { 
  createMiddlewareClient, 
  updateSession,
  withAuth 
} from '../clients/middleware';

// Export auth middleware
export {
  createAuthMiddleware,
  protectRoute,
  chainMiddleware,
  type AuthMiddlewareConfig
} from './auth';

// Export session middleware
export {
  createSessionMiddleware,
  refreshSession,
  validateSession,
  getSessionFromRequest,
  getUserFromRequest,
  SessionCookieManager,
  type SessionMiddlewareConfig
} from './session';

// Export route protection
export {
  createRouteProtection,
  createPresetProtection,
  RoutePresets,
  type RouteProtectionConfig,
  type RouteConfig
} from './protection';

// Re-export Next.js types
export type { NextRequest, NextResponse } from 'next/server';