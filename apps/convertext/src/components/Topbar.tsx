'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FileText } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useTheme } from './ThemeProvider';
import { GoogleSignInButton } from '@draft-gen/ui';

const ThemeToggle = dynamic(() => import('./ThemeToggle'), {
  ssr: false,
  loading: () => null,
});

type UserProfile = {
  display_name: string | null;
  avatar_url: string | null;
};

export default function Topbar({ profile }: { profile?: UserProfile | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const { signIn, signOut } = useAuth();
  const { resolvedTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => pathname?.includes(path);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold text-card-foreground"
            >
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <FileText className="h-5 w-5 text-white" />
              </div>
              ConverText
            </Link>
            <nav className="flex gap-6">
              <Link
                href="/"
                className={`transition-colors ${
                  pathname === '/'
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Convert
              </Link>
              <Link
                href="/routines"
                className={`transition-colors ${
                  isActive('/routines')
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Routines
              </Link>
            </nav>
          </div>
          {profile ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
              >
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.display_name || 'User'}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                    {getInitials(profile.display_name || null)}
                  </div>
                )}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-popover rounded-lg shadow-lg border border-border py-1 z-50">
                  <div className="px-4 py-2 text-sm text-muted-foreground border-b border-border">
                    {profile.display_name || 'User'}
                  </div>
                  <div className="py-1">
                    <ThemeToggle />
                  </div>
                  <div className="border-t border-border pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <GoogleSignInButton
              onClick={() => signIn()}
              variant={resolvedTheme === 'dark' ? 'neutral' : 'light'}
              size="medium"
            />
          )}
        </div>
      </div>
    </header>
  );
}
