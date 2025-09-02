'use client';

import { useEffect } from 'react';

export default function ThemeScript() {
  useEffect(() => {
    // Apply theme immediately on mount to prevent flash
    const savedTheme = localStorage.getItem('convertext-theme') || 'system';
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    const resolvedTheme = savedTheme === 'system' ? systemTheme : savedTheme;

    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolvedTheme);
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, []);

  return null;
}
