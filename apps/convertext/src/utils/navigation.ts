'use client';

import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { defaultLocale, type Locale } from '@root/i18n';

export function useLocalizedRouter() {
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params?.locale as Locale) || defaultLocale;

  return {
    push: (href: string, options?: { scroll?: boolean }) => {
      const localizedHref = href.startsWith('/') ? `/${currentLocale}${href}` : href;
      router.push(localizedHref, options);
    },
    replace: (href: string, options?: { scroll?: boolean }) => {
      const localizedHref = href.startsWith('/') ? `/${currentLocale}${href}` : href;
      router.replace(localizedHref, options);
    },
    back: () => router.back(),
    forward: () => router.forward(),
    refresh: () => router.refresh(),
  };
}

export function useLocalizedHref() {
  const params = useParams();
  const currentLocale = (params?.locale as Locale) || defaultLocale;

  return (href: string): string => {
    if (!href.startsWith('/')) {
      return href;
    }
    return `/${currentLocale}${href}`;
  };
}

export function getCurrentLocale(): Locale {
  if (typeof window === 'undefined') {
    return defaultLocale;
  }

  const pathname = window.location.pathname;
  const locale = pathname.split('/')[1] as Locale;

  return locale && ['en', 'pt'].includes(locale) ? locale : defaultLocale;
}
