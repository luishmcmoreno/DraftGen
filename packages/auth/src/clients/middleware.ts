/**
 * Middleware Supabase client factory
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import type { AuthConfig } from '../types/auth';

/**
 * Create a Supabase client for middleware usage
 * 
 * This client handles cookie-based authentication in Next.js middleware.
 * Updates both request and response cookies to maintain session.
 * 
 * @param request - Next.js request object
 * @param response - Next.js response object (optional, will create new if not provided)
 * @param config - Optional configuration overrides
 * @returns Object containing configured Supabase client and response
 */
export function createMiddlewareClient<T extends Database = Database>(
  request: NextRequest,
  response?: NextResponse,
  config?: Partial<AuthConfig>
): {
  supabase: SupabaseClient<T>;
  response: NextResponse;
} {
  const supabaseUrl = config?.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = config?.supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase configuration. Please provide supabaseUrl and supabaseAnonKey or set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    );
  }

  // Create response if not provided
  let supabaseResponse = response || NextResponse.next({
    request,
  });

  const supabase = createSupabaseServerClient<T>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Update request cookies
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        
        // Create new response with updated request
        supabaseResponse = NextResponse.next({
          request,
        });
        
        // Update response cookies
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
    global: {
      headers: {
        'x-application-name': '@draft-gen/auth',
        'x-client-type': 'middleware',
      },
    },
    db: {
      schema: 'public',
    },
  });

  return { supabase, response: supabaseResponse };
}

/**
 * Update session in middleware
 * 
 * This helper function refreshes the user session if needed and returns
 * an updated response with new session cookies.
 * 
 * @param request - Next.js request object
 * @param config - Optional configuration overrides
 * @returns Updated NextResponse with refreshed session
 */
export async function updateSession(
  request: NextRequest,
  config?: Partial<AuthConfig>
): Promise<NextResponse> {
  const { supabase, response } = createMiddlewareClient(request, undefined, config);

  // This will refresh session if expired - required for Server Components
  const { data: { user }, error } = await supabase.auth.getUser();

  if (config?.debug) {
    console.log('Middleware session update:', { 
      hasUser: !!user, 
      error: error?.message,
      path: request.nextUrl.pathname 
    });
  }

  return response;
}

/**
 * Create middleware auth helper
 * 
 * Higher-order function that creates a middleware with built-in auth handling.
 * 
 * @param handler - Middleware handler function
 * @param config - Optional configuration overrides
 * @returns Middleware function
 */
export function withAuth<T extends Database = Database>(
  handler: (
    request: NextRequest,
    context: {
      supabase: SupabaseClient<T>;
      user: any;
    }
  ) => Promise<NextResponse> | NextResponse,
  config?: Partial<AuthConfig>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { supabase, response } = createMiddlewareClient<T>(request, undefined, config);
    
    // Get user session
    const { data: { user } } = await supabase.auth.getUser();
    
    // Call handler with auth context
    const handlerResponse = await handler(request, { supabase, user });
    
    // Preserve cookies from auth client
    if (handlerResponse !== response) {
      response.cookies.getAll().forEach(cookie => {
        handlerResponse.cookies.set(cookie);
      });
    }
    
    return handlerResponse;
  };
}