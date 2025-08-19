import { createClient } from '@/lib/supabase/server';
import { upsertProfile } from '@/lib/supabase/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ locale: string }> }
) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;
  
  // Get the locale from params
  const { locale } = await context.params;
  const localePrefix = locale === 'en' ? '' : `/${locale}`;

  if (code) {
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (sessionError) {
      console.error('Session exchange error:', sessionError);
      return NextResponse.redirect(`${origin}${localePrefix}/login?error=invalid_code`);
    }

    if (session?.user) {
      // Upsert profile with Google data
      const googleMetadata = session.user.user_metadata;
      await upsertProfile(session.user.id, {
        display_name: googleMetadata?.full_name || googleMetadata?.name || null,
        avatar_url: googleMetadata?.avatar_url || googleMetadata?.picture || null,
        role: 'GENERATOR', // Default role for new users
      });
    }

    // Redirect to templates page after successful login with proper locale
    return NextResponse.redirect(`${origin}${localePrefix}/templates`);
  }

  // If no code, redirect to login with error
  return NextResponse.redirect(`${origin}${localePrefix}/login?error=no_code`);
}