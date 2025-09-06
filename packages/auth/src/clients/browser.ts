/**
 * Browser Supabase client factory
 */

import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import type { AuthConfig } from '../types/auth';

/**
 * Create a Supabase client for browser/client-side usage
 * 
 * @param config - Optional configuration overrides
 * @returns Configured Supabase client for browser
 */
export function createBrowserClient<T extends Database = Database>(
  config?: Partial<AuthConfig>
): SupabaseClient<T> {
  const supabaseUrl = config?.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = config?.supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase configuration. Please provide supabaseUrl and supabaseAnonKey or set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    );
  }

  return createSupabaseBrowserClient<T>(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
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
 * Singleton instance for browser client
 */
let browserClient: SupabaseClient<Database> | undefined;

/**
 * Get or create a singleton browser client
 * 
 * @param config - Optional configuration overrides
 * @returns Singleton Supabase client for browser
 */
export function getBrowserClient<T extends Database = Database>(
  config?: Partial<AuthConfig>
): SupabaseClient<T> {
  if (typeof window === 'undefined') {
    throw new Error('getBrowserClient() can only be called in browser environment');
  }

  if (!browserClient) {
    browserClient = createBrowserClient(config);
  }

  return browserClient as SupabaseClient<T>;
}