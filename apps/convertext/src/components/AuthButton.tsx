import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

interface AuthButtonProps {
  onAuthClick?: () => void; // Custom handler for authenticated users
  showConvertButton?: boolean; // Show "Convert" button for authenticated users
}

export function AuthButton({ onAuthClick, showConvertButton = false }: AuthButtonProps = {}) {
  const { user, profile, loading, signIn, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin"></div>
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {profile?.avatar_url && (
            <img 
              src={profile.avatar_url} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-sm text-foreground">
            {profile?.display_name || user.email}
          </span>
        </div>
        
        {showConvertButton && pathname !== '/convert' && (
          <button
            onClick={() => {
              if (onAuthClick) {
                onAuthClick();
              } else {
                router.push('/convert');
              }
            }}
            className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            Convert
          </button>
        )}
        
        <button
          onClick={signOut}
          className="px-3 py-1 text-sm text-muted-foreground hover:text-foreground border border-border rounded hover:bg-muted/50 transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn()}
      className="px-4 py-2 text-sm text-primary-foreground bg-primary hover:bg-primary/90 rounded transition-colors"
    >
      Sign in with Google
    </button>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/20">
        <div className="max-w-md w-full bg-card rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-card-foreground mb-4">ConverText</h1>
          <p className="text-muted-foreground mb-6">
            Sign in to save your conversion routines and access your history.
          </p>
          <AuthButton />
          <p className="text-xs text-muted-foreground mt-4">
            You can still use ConverText without signing in, but your data won&apos;t be saved.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}