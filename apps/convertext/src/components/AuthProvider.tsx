import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithGoogle, 
  signOut, 
  getCurrentUser, 
  getUserProfile,
  onAuthStateChange 
} from '../lib/supabase/auth';
import { createClient } from '../lib/supabase/client';
import { migrateLocalStorageToSupabase } from '../utils/workflow-supabase';
import type { Database } from '../lib/supabase/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type User = any; // Supabase User type

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (user) {
      try {
        const userProfile = await getUserProfile();
        setProfile(userProfile);
      } catch (error) {
        console.error('Failed to load user profile:', error);
      }
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    // Set up auth state listener
    const setupAuth = async () => {
      unsubscribe = await onAuthStateChange(async (authUser) => {
        setUser(authUser);
        setLoading(false);

        if (authUser) {
          await refreshProfile();
          
          // Migrate localStorage data to Supabase on first sign-in
          try {
            await migrateLocalStorageToSupabase();
          } catch (error) {
            console.warn('Failed to migrate localStorage data:', error);
          }
        } else {
          setProfile(null);
        }
      });
    };

    setupAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    // Handle auth session from URL (for OAuth callback)
    const handleAuthSession = async () => {
      const supabase = createClient();
      
      // Check if there's a session in the URL hash (for implicit flow)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      if (hashParams.get('access_token')) {
        try {
          const { error } = await supabase.auth.getSession();
          if (error) {
            console.error('Failed to get session:', error);
          }
          // Clear the hash from URL
          window.history.replaceState(null, '', window.location.pathname);
        } catch (error) {
          console.error('Failed to handle auth session:', error);
        }
      }
    };
    
    // Load initial user
    const loadUser = async () => {
      try {
        await handleAuthSession();
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
          await refreshProfile();
        }
      } catch (error) {
        console.error('Failed to get current user:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}