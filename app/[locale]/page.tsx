import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

export default async function Home({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const t = await getTranslations({ locale, namespace: 'common' });

  return (
    <main className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">
          {t('appName')}
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          {t('tagline')}
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            {t('getStarted')}
          </Link>
          <Link
            href="/templates"
            className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t('viewTemplates')}
          </Link>
        </div>
      </div>
    </main>
  )
}