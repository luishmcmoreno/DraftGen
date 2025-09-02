import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@draft-gen/logger';

export async function GET(request: NextRequest) {
  logger.log('=== AUTH CALLBACK HANDLER ===');
  logger.log('Method:', request.method);

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    logger.log('No code provided, redirecting home');
    return NextResponse.redirect(new URL('/', request.url));
  }

  logger.log('Processing auth code:', code.substring(0, 10) + '...');

  try {
    const response = NextResponse.redirect(new URL('/', request.url));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, {
                ...options,
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                maxAge: 3600,
              });
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      logger.error('Auth exchange error:', error);
      return NextResponse.redirect(
        new URL(`/auth/error?message=${encodeURIComponent(error.message)}`, request.url)
      );
    }

    logger.log('Auth exchange successful');

    // Check for pending conversion in the URL state parameter
    const state = searchParams.get('state');
    if (state) {
      try {
        const pendingData = JSON.parse(decodeURIComponent(state));
        if (pendingData.taskDescription && pendingData.text) {
          // Redirect to home page with pending data
          const redirectUrl = new URL('/', request.url);
          redirectUrl.searchParams.set('task', pendingData.taskDescription);
          redirectUrl.searchParams.set('text', pendingData.text);
          if (pendingData.exampleOutput) {
            redirectUrl.searchParams.set('example', pendingData.exampleOutput);
          }
          return NextResponse.redirect(redirectUrl);
        }
      } catch (err) {
        logger.log('Failed to parse state parameter:', err);
      }
    }

    // Default redirect to home
    return response;
  } catch (error) {
    logger.error('Callback handler error:', error);
    return NextResponse.redirect(new URL('/auth/error?message=Server%20error', request.url));
  }
}
