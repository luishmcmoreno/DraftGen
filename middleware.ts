import createMiddleware from 'next-intl/middleware';
import { type NextRequest } from 'next/server';
import { locales, defaultLocale } from './i18n';
import { updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
});

export async function middleware(request: NextRequest) {
  // Update Supabase session
  const supabaseResponse = await updateSession(request);
  
  // Apply intl middleware
  const intlResponse = intlMiddleware(request);
  
  // Combine responses (prefer intl response if it redirects/rewrites)
  if (intlResponse.status !== 200 || intlResponse.headers.get('x-middleware-rewrite')) {
    return intlResponse;
  }
  
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/',
    '/(en|pt)/:path*',
    '/((?!api/health|api|_next|_vercel|.*\\..*).*)'
  ]
};