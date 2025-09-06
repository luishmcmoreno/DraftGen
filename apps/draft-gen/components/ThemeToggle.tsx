'use client';

import { useTranslations } from '@/lib/i18n';
import { ThemeToggle as BaseThemeToggle } from '@draft-gen/ui';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const t = useTranslations('common');
  const { theme, setTheme } = useTheme();

  return (
    <BaseThemeToggle
      theme={theme}
      onThemeChange={setTheme}
      label={t('nav.theme')}
      showLabel={true}
      showIcon={false}
    />
  );
}
