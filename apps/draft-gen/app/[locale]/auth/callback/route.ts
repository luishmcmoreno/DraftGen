import { createClient } from '@/lib/supabase/server';
import { upsertProfile } from '@draft-gen/auth/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, context: { params: Promise<{ locale: string }> }) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;
  const cookieStore = await cookies();

  // Get the locale from params
  const { locale } = await context.params;
  const localePrefix = locale === 'en' ? '' : `/${locale}`;

  if (code) {
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      return NextResponse.redirect(`${origin}${localePrefix}?error=invalid_code`);
    }

    if (session?.user) {
      // Upsert profile with Google data
      const googleMetadata = session.user.user_metadata;
      
      // Ensure the session is established in the client
      await supabase.auth.getUser();
      
      // Now we can use the auth package's upsertProfile
      await upsertProfile({
        display_name: googleMetadata?.full_name || googleMetadata?.name || null,
        avatar_url: googleMetadata?.avatar_url || googleMetadata?.picture || null,
        metadata: { role: 'GENERATOR' } // Store role in metadata for now
      }, supabase);
    }

    // Check if there's a redirect stored in the cookie
    const authRedirect = cookieStore.get('auth_redirect');

    if (authRedirect?.value === 'generator') {
      // Delete the cookie after reading it
      cookieStore.delete('auth_redirect');

      // Check for a pending prompt in the browser's sessionStorage
      // This will be handled client-side in the generator page
      return NextResponse.redirect(`${origin}${localePrefix}/generator?fromAuth=true`);
    }

    // Default redirect to templates page after successful login with proper locale
    return NextResponse.redirect(`${origin}${localePrefix}/templates`);
  }

  // If no code, redirect to home with error
  return NextResponse.redirect(`${origin}${localePrefix}?error=no_code`);
}
