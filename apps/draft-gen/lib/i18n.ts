import { useTranslations as useNextIntlTranslations } from 'next-intl';
import {
  getTranslations as getNextIntlTranslations,
  getLocale as getNextIntlLocale,
} from 'next-intl/server';

export { useLocale, useFormatter } from 'next-intl';

export const useTranslations = useNextIntlTranslations;

// Wrapper that automatically includes the current locale
export const getTranslations = async (namespace?: string) => {
  const locale = await getNextIntlLocale();
  return getNextIntlTranslations({ locale, namespace });
};

export type TranslationNamespaces = 'common' | 'auth' | 'templates' | 'generator' | 'viewer';

export const useTypedTranslations = <T extends TranslationNamespaces>(namespace: T) => {
  return useNextIntlTranslations(namespace);
};

export const getTypedTranslations = async <T extends TranslationNamespaces>(namespace: T) => {
  return getNextIntlTranslations(namespace);
};
