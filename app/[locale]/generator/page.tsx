import { getTranslations, setRequestLocale } from 'next-intl/server';
import Topbar from '@/components/Topbar';
import { requireAuth, getProfile } from '@/lib/supabase/auth';

export default async function GeneratorPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  // Require authentication
  await requireAuth();
  const profile = await getProfile();
  
  const t = await getTranslations({ locale, namespace: 'generator' });
  const tViewer = await getTranslations({ locale, namespace: 'viewer' });

  return (
    <>
      <Topbar profile={profile} />
      <div className="h-[calc(100vh-64px)] flex">
        {/* Chat Panel - Left Side */}
        <div className="w-[35%] border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{t('title')}</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              {t('chat.emptyState')}
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex gap-2">
              <textarea
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                placeholder={t('chat.placeholder')}
                rows={3}
              />
              <button className="px-4 py-2 bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors self-end">
                {t('chat.send')}
              </button>
            </div>
          </div>
        </div>
        
        {/* Viewer - Right Side */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-950 overflow-y-auto">
          <div className="p-8">
            <div className="page">
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {tViewer('emptyState')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}