import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const cookieStore = await cookies();

  // Get the origin from the request URL
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;

  // Get the referer to check for locale and redirect parameter from request URL
  const referer = request.headers.get('referer');
  let callbackUrl = `${origin}/auth/callback`;
  let redirect = '';

  // Check if there's a redirect parameter in the request URL
  const redirectParam = requestUrl.searchParams.get('redirect');
  if (redirectParam) {
    redirect = redirectParam;
    // Store the redirect in a cookie so we can use it after OAuth callback
    cookieStore.set('auth_redirect', redirect, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300 // 5 minutes
    });
  }

  if (referer) {
    const refererUrl = new URL(referer);
    const pathSegments = refererUrl.pathname.split('/').filter(Boolean);
    const locale = pathSegments[0];

    // If the referer has a locale prefix, use it in the callback
    if (['en', 'pt'].includes(locale)) {
      callbackUrl =
        locale === 'en' ? `${origin}/auth/callback` : `${origin}/${locale}/auth/callback`;
    }
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    return NextResponse.redirect(`${origin}/?error=oauth_error`);
  }

  if (data?.url) {
    return NextResponse.redirect(data.url);
  }

  return NextResponse.redirect(`${origin}/?error=no_url`);
}
