import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'pt'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export default getRequestConfig(async ({ locale }) => {
  // Ensure locale is defined and valid
  if (!locale || !locales.includes(locale as Locale)) {
    notFound();
  }

  const validLocale = locale as Locale;

  return {
    locale: validLocale,
    messages: (await import(`./messages/${validLocale}.json`)).default,
    onError: (error) => {
      console.error('next-intl error:', error);
    },
    getMessageFallback: ({ namespace, key, error }) => {
      const path = [namespace, key].filter(Boolean).join('.');

      if (error.code === 'MISSING_MESSAGE') {
        console.warn(`⚠️ Missing translation: "${path}" for locale "${validLocale}"`);
        return `[${path}]`;
      }

      return `[Error: ${path}]`;
    },
  };
});
