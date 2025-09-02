import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('=== AUTH CALLBACK HANDLER ===');
  console.log('Method:', request.method);

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    console.log('No code provided, redirecting home');
    return NextResponse.redirect(new URL('/', request.url));
  }

  console.log('Processing auth code:', code.substring(0, 10) + '...');

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

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth exchange error:', error);
      return NextResponse.redirect(
        new URL(`/auth/error?message=${encodeURIComponent(error.message)}`, request.url)
      );
    }

    console.log('Auth exchange successful');

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
        console.log('Failed to parse state parameter:', err);
      }
    }

    // Default redirect to home
    return response;
  } catch (error) {
    console.error('Callback handler error:', error);
    return NextResponse.redirect(new URL('/auth/error?message=Server%20error', request.url));
  }
}
