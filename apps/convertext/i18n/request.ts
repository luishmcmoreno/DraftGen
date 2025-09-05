import { getRequestConfig } from 'next-intl/server';
import { locales } from '../i18n';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as any)) {
    locale = 'en';
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    onError: (error) => {
      console.error('next-intl error:', error);
    },
    getMessageFallback: ({ namespace, key, error }) => {
      const path = [namespace, key].filter(Boolean).join('.');

      if (error.code === 'MISSING_MESSAGE') {
        console.warn(`⚠️ Missing translation: "${path}" for locale "${locale}"`);
        return `[${path}]`;
      }

      return `[Error: ${path}]`;
    },
  };
});