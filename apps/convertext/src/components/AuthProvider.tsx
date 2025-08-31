'use client';

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

interface PendingConversion {
  taskDescription: string;
  text: string;
  exampleOutput?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (pendingConversion?: PendingConversion) => Promise<void>;
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

    // Set up auth state listener and handle initial session
    const setupAuth = async () => {
      // Handle auth session from URL (for OAuth callback)
      const supabase = createClient();
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

      // Get initial session
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          // Load profile for the authenticated user
          try {
            const userProfile = await getUserProfile();
            setProfile(userProfile);
          } catch (error) {
            console.error('Failed to load user profile:', error);
          }
          
          // Migrate localStorage data to Supabase on first sign-in
          try {
            await migrateLocalStorageToSupabase();
          } catch (error) {
            console.warn('Failed to migrate localStorage data:', error);
          }
        }
      } catch (error) {
        console.error('Failed to get initial session:', error);
      }

      // Set up auth state change listener
      unsubscribe = await onAuthStateChange(async (authUser) => {
        setUser(authUser);

        if (authUser) {
          // Load profile for the authenticated user
          try {
            const userProfile = await getUserProfile();
            setProfile(userProfile);
          } catch (error) {
            console.error('Failed to load user profile:', error);
          }
          
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

      // Set loading to false after everything is set up
      setLoading(false);
    };

    setupAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleSignIn = async (pendingConversion?: PendingConversion) => {
    console.log('=== handleSignIn called ===', { pendingConversion });
    try {
      await signInWithGoogle(pendingConversion);
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