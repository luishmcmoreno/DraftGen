/**
 * Supabase client factories
 * 
 * Exports all client creation functions for different contexts
 */

// Browser client
export { 
  createBrowserClient, 
  getBrowserClient 
} from './browser';

// Server client (App Router)
export { 
  createServerClient, 
  createServiceRoleClient 
} from './server';

// Middleware client
export { 
  createMiddlewareClient, 
  updateSession,
  withAuth 
} from './middleware';

// Re-export types for convenience
export type { SupabaseClient } from '@supabase/supabase-js';