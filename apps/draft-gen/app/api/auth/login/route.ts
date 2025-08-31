import { createClient } from '@/lib/supabase/server';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Get the origin from the request URL
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;

  // Get the referer to check for locale
  const referer = request.headers.get('referer');
  let callbackUrl = `${origin}/auth/callback`;

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
    return NextResponse.redirect(`${origin}/login?error=oauth_error`);
  }

  if (data?.url) {
    return NextResponse.redirect(data.url);
  }

  return NextResponse.redirect(`${origin}/login?error=no_url`);
}
