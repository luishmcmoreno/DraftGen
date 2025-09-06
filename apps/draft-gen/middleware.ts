import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n';
import { updateSession, createServerMiddlewareClient } from '@/lib/supabase/middleware';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

const publicPaths = [
  '/', // Add root path as public for landing page
  '/auth/callback',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/health',
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if the path is public (including locale variations)
  const isPublicPath = publicPaths.some(
    (path) =>
      pathname === path ||
      pathname.endsWith(path) ||
      pathname.includes('/auth/callback') ||
      locales.some((locale) => pathname === `/${locale}${path}`) ||
      locales.some((locale) => pathname === `/${locale}` && path === '/') // Handle locale root paths
  );

  // Update Supabase session
  const supabaseResponse = await updateSession(request);

  // Get user for authentication checks from the supabase response
  const response = NextResponse.next();
  const supabase = createServerMiddlewareClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check authentication for protected routes
  if (!isPublicPath && pathname !== '/') {
    if (!user) {
      // Redirect to home page instead of login page
      const locale = locales.find((l) => pathname.startsWith(`/${l}`)) || defaultLocale;
      const homePath = locale === defaultLocale ? '/' : `/${locale}`;
      return NextResponse.redirect(new URL(homePath, request.url));
    }
  }

  // Apply intl middleware
  const intlResponse = intlMiddleware(request);

  // Combine responses (prefer intl response if it redirects/rewrites)
  if (intlResponse.status !== 200 || intlResponse.headers.get('x-middleware-rewrite')) {
    return intlResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/', '/(en|pt)/:path*', '/((?!api/health|api|_next|_vercel|.*\\..*).*)'],
};
