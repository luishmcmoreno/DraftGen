'use client';

import { useTranslations } from '@/lib/i18n';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Topbar() {
  const t = useTranslations('common');
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname?.includes(path);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              {t('appName')}
            </Link>
            <nav className="flex gap-6">
              <Link
                href="/generator"
                className={`transition-colors ${
                  isActive('/generator')
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('nav.generator')}
              </Link>
              <Link
                href="/templates"
                className={`transition-colors ${
                  isActive('/templates')
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('nav.templates')}
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-600 hover:text-gray-900 transition-colors">
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}