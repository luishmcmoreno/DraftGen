import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n';
import { updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

const publicPaths = [
  '/login',
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
      locales.some((locale) => pathname === `/${locale}${path}`)
  );

  // Check if the path is the login page
  const isLoginPage =
    pathname === '/login' || locales.some((locale) => pathname === `/${locale}/login`);

  // Update Supabase session
  const supabaseResponse = await updateSession(request);

  // Get user for authentication checks
  const response = NextResponse.next();
  const supabase = (await import('@/lib/supabase/middleware')).createServerMiddlewareClient(
    request,
    response
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect authenticated users away from login page
  if (isLoginPage && user) {
    const locale = locales.find((l) => pathname.startsWith(`/${l}`)) || defaultLocale;
    const templatesPath = locale === defaultLocale ? '/templates' : `/${locale}/templates`;
    return NextResponse.redirect(new URL(templatesPath, request.url));
  }

  // Check authentication for protected routes
  if (!isPublicPath && pathname !== '/') {
    if (!user) {
      // Get the current locale from the path
      const locale = locales.find((l) => pathname.startsWith(`/${l}`)) || defaultLocale;
      const loginPath = locale === defaultLocale ? '/login' : `/${locale}/login`;
      return NextResponse.redirect(new URL(loginPath, request.url));
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
