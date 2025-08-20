import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import Topbar from '@/components/Topbar';
import { requireAuth, getProfile } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';
import TemplatesClient from './TemplatesClient';

export default async function TemplatesPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  // Require authentication
  await requireAuth();
  const profile = await getProfile();
  
  const t = await getTranslations({ locale, namespace: 'templates' });

  // Fetch templates from database
  const supabase = await createClient();
  const { data: templates, error } = await supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    // Error fetching templates - templates will be empty
  }

  return (
    <>
      <Topbar profile={profile} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">{t('list.title')}</h1>
            <Link
              href="/generator"
              className="px-4 py-2 bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              {t('list.createCta')}
            </Link>
          </div>
          
          {templates && templates.length > 0 ? (
            <TemplatesClient templates={templates} />
          ) : (
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-16 text-center">
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('empty.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('empty.subtitle')}
              </p>
              <Link
                href="/generator"
                className="inline-block px-6 py-3 bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                {t('empty.cta')}
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  )
}