'use client';

import { useTranslations } from '@/lib/i18n';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { FileText } from 'lucide-react';
import { UserMenu, type UserProfile } from '@draft-gen/ui';

const ThemeToggle = dynamic(() => import('./ThemeToggle'), {
  ssr: false,
  loading: () => null,
});

export default function Topbar({ profile }: { profile?: UserProfile | null }) {
  const t = useTranslations('common');
  const pathname = usePathname();

  const isActive = (path: string) => pathname?.includes(path);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold text-card-foreground"
            >
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <FileText className="h-5 w-5 text-white" />
              </div>
              {t('appName')}
            </Link>
            <nav className="flex gap-6">
              <Link
                href="/generator"
                className={`transition-colors ${
                  isActive('/generator')
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('nav.generator')}
              </Link>
              <Link
                href="/templates"
                className={`transition-colors ${
                  isActive('/templates')
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('nav.templates')}
              </Link>
            </nav>
          </div>
          <UserMenu
            profile={profile}
            onLogout={handleLogout}
            logoutLabel={t('nav.logout')}
          >
            <ThemeToggle />
          </UserMenu>
        </div>
      </div>
    </header>
  );
}
