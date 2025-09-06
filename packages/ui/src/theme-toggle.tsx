'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';

export interface ThemeToggleProps {
  /** Current theme value */
  theme?: 'light' | 'dark' | 'system';
  /** Callback when theme changes */
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void;
  /** Custom label text */
  label?: string;
  /** Show theme icon */
  showIcon?: boolean;
  /** Show theme label */
  showLabel?: boolean;
  /** Custom class name */
  className?: string;
}

const themeIcons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const themeEmojis = {
  light: '☀️',
  dark: '🌙',
  system: '🌓',
};

export function ThemeToggle({
  theme = 'system',
  onThemeChange,
  label = 'Theme',
  showIcon = false,
  showLabel = true,
  className = '',
}: ThemeToggleProps) {
  const handleClick = () => {
    const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    onThemeChange?.(nextTheme);
  };

  const Icon = themeIcons[theme];

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between ${className}`}
      aria-label={`Switch theme (current: ${theme})`}
    >
      {showLabel && <span>{label}</span>}
      <span className="flex items-center gap-2">
        {showIcon && <Icon className="w-4 h-4" />}
        {!showIcon && (
          <span className="text-xs text-muted-foreground">
            {themeEmojis[theme]}
          </span>
        )}
      </span>
    </button>
  );
}

/**
 * Hook to integrate with next-themes or other theme providers
 * This is a helper for apps that use next-themes
 */
export function useThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const [theme, setTheme] = React.useState<'light' | 'dark' | 'system'>('system');

  React.useEffect(() => {
    setMounted(true);
    // Try to get theme from localStorage or next-themes
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  const handleThemeChange = React.useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme to document for immediate effect
    const root = document.documentElement;
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
    } else {
      root.classList.remove('light', 'dark');
      root.classList.add(newTheme);
    }
  }, []);

  return {
    mounted,
    theme,
    setTheme: handleThemeChange,
  };
}