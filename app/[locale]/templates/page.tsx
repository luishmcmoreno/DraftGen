import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

export default async function TemplatesPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const t = await getTranslations({ locale, namespace: 'templates' });

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('list.title')}</h1>
          <Link
            href="/generator"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            {t('list.createCta')}
          </Link>
        </div>
        
        <div className="bg-gray-100 rounded-lg p-16 text-center">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {t('empty.title')}
          </h3>
          <p className="text-gray-600 mb-4">
            {t('empty.subtitle')}
          </p>
          <Link
            href="/generator"
            className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            {t('empty.cta')}
          </Link>
        </div>
      </div>
    </main>
  )
}