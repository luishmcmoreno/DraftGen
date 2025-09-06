'use client';

import * as React from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';

export interface UserProfile {
  display_name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
}

export interface UserMenuProps {
  profile?: UserProfile | null;
  onLogout?: () => void | Promise<void>;
  logoutLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return 'U';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserMenu({ 
  profile, 
  onLogout, 
  logoutLabel = 'Logout',
  className = '',
  children 
}: UserMenuProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="User menu"
        aria-expanded={dropdownOpen}
      >
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.display_name || 'User'}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
            {getInitials(profile?.display_name)}
          </div>
        )}
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>
      
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-popover rounded-lg shadow-lg border border-border py-1 z-50">
          <div className="px-4 py-2 text-sm text-muted-foreground border-b border-border">
            <div className="font-medium text-popover-foreground">
              {profile?.display_name || 'User'}
            </div>
            {profile?.email && (
              <div className="text-xs mt-0.5 text-muted-foreground">
                {profile.email}
              </div>
            )}
          </div>
          
          {children && (
            <div className="py-1">
              {children}
            </div>
          )}
          
          {onLogout && (
            <div className="border-t border-border pt-1">
              <button
                onClick={async () => {
                  await onLogout();
                  setDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {logoutLabel}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}