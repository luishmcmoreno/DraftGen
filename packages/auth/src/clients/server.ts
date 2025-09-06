/**
 * Server Supabase client factory for App Router
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import type { AuthConfig } from '../types/auth';

/**
 * Create a Supabase client for server-side usage in App Router
 * 
 * This client handles cookie-based authentication for SSR.
 * Must be called in Server Components, Route Handlers, or Server Actions.
 * 
 * @param config - Optional configuration overrides
 * @returns Configured Supabase client for server
 */
export async function createServerClient<T extends Database = Database>(
  config?: Partial<AuthConfig>
): Promise<SupabaseClient<T>> {
  const cookieStore = await cookies();
  const supabaseUrl = config?.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = config?.supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase configuration. Please provide supabaseUrl and supabaseAnonKey or set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    );
  }

  return createSupabaseServerClient<T>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
          if (config?.debug) {
            console.warn('Unable to set cookies in Server Component:', error);
          }
        }
      },
    },
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
    },
    global: {
      headers: {
        'x-application-name': '@draft-gen/auth',
      },
    },
    db: {
      schema: 'public',
    },
  });
}

/**
 * Create a Supabase client with service role key for admin operations
 * 
 * WARNING: This client bypasses Row Level Security (RLS).
 * Only use in secure server-side contexts where you need admin access.
 * 
 * @param config - Optional configuration overrides
 * @returns Configured Supabase client with service role
 */
export async function createServiceRoleClient<T extends Database = Database>(
  config?: Partial<AuthConfig>
): Promise<SupabaseClient<T>> {
  const supabaseUrl = config?.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRole = config?.supabaseServiceRole || process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !supabaseServiceRole) {
    throw new Error(
      'Missing Supabase service role configuration. Please provide supabaseUrl and supabaseServiceRole or set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE environment variables.'
    );
  }

  const cookieStore = await cookies();

  return createSupabaseServerClient<T>(supabaseUrl, supabaseServiceRole, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          // Ignore cookie setting errors in Server Components
          if (config?.debug) {
            console.warn('Unable to set cookies in Server Component:', error);
          }
        }
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'x-application-name': '@draft-gen/auth',
        'x-client-type': 'service-role',
      },
    },
    db: {
      schema: 'public',
    },
  });
}