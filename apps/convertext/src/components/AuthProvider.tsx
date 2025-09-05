'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { logger } from '@draft-gen/logger';
import { signInWithGoogle, signOut, getUserProfile, onAuthStateChange } from '../lib/supabase/auth';
import { createClient } from '../lib/supabase/client';
import { migrateLocalStorageToSupabase } from '../utils/workflow-supabase';
import type { Database } from '../lib/supabase/database.types';
import { useLocalizedRouter } from '../utils/navigation';
import useConversionStore from '../stores/conversionStore';

type Profile = Database['public']['Tables']['profiles']['Row'];
import type { User } from '@supabase/supabase-js';

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
  const router = useLocalizedRouter();

  // Zustand store
  const { pendingConversion, postAuthRedirect, setPostAuthRedirect } = useConversionStore();

  const refreshProfile = async () => {
    if (user) {
      try {
        const userProfile = await getUserProfile();
        setProfile(userProfile);
      } catch (error) {
        logger.error('Failed to load user profile:', error);
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
            logger.error('Failed to get session:', error);
          }
          // Clear the hash from URL
          window.history.replaceState(null, '', window.location.pathname);
        } catch (error) {
          logger.error('Failed to handle auth session:', error);
        }
      }

      // Get initial session
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          // Load profile for the authenticated user
          try {
            const userProfile = await getUserProfile();
            setProfile(userProfile);
          } catch (error) {
            logger.error('Failed to load user profile:', error);
          }

          // Migrate localStorage data to Supabase on first sign-in
          try {
            await migrateLocalStorageToSupabase();
          } catch (error) {
            logger.warn('Failed to migrate localStorage data:', error);
          }

          // Check if we just came back from OAuth and have a redirect path
          // This handles the case where the user is already authenticated after OAuth callback
          if (postAuthRedirect) {
            logger.log('Found post-auth redirect on initial load:', postAuthRedirect);
            // Clear the redirect path from storage
            setPostAuthRedirect(null);
            // Navigate to the stored path
            router.push(postAuthRedirect);
          }
        }
      } catch (error) {
        logger.error('Failed to get initial session:', error);
      }

      // Set up auth state change listener
      unsubscribe = await onAuthStateChange(async (authUser, event) => {
        setUser(authUser);

        if (authUser) {
          // Load profile for the authenticated user
          try {
            const userProfile = await getUserProfile();
            setProfile(userProfile);
          } catch (error) {
            logger.error('Failed to load user profile:', error);
          }

          // Migrate localStorage data to Supabase on first sign-in
          try {
            await migrateLocalStorageToSupabase();
          } catch (error) {
            logger.warn('Failed to migrate localStorage data:', error);
          }

          // Only redirect on SIGNED_IN event, not on initial load or token refresh
          // Note: postAuthRedirect and pendingConversion are restored from sessionStorage
          if (event === 'SIGNED_IN' && postAuthRedirect) {
            logger.log('Redirecting after new sign-in to:', postAuthRedirect);
            // Clear the redirect path from storage
            setPostAuthRedirect(null);
            // Navigate to the stored path
            router.push(postAuthRedirect);
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
  }, [pendingConversion, postAuthRedirect, router, setPostAuthRedirect]);

  const handleSignIn = async () => {
    logger.log('=== handleSignIn called ===');
    try {
      // No need to pass pendingConversion - it's in Zustand store
      await signInWithGoogle();
    } catch (error) {
      logger.error('Sign in failed:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      logger.error('Sign out failed:', error);
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
