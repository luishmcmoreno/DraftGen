'use client';

import { useContext } from 'react';
import { useTranslations } from '@/lib/i18n';
import { ThemeContext } from './ThemeProvider';

export default function ThemeToggle() {
  const t = useTranslations('common');
  const themeContext = useContext(ThemeContext);

  if (!themeContext) {
    // If no theme context, just return null or a placeholder
    return null;
  }

  const { theme, setTheme } = themeContext;

  return (
    <button
      onClick={() => setTheme(theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system')}
      className="w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between"
    >
      <span>{t('nav.theme')}</span>
      <span className="text-xs text-muted-foreground">
        {theme === 'system' ? '🌓' : theme === 'light' ? '☀️' : '🌙'}
      </span>
    </button>
  );
}
