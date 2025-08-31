import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithGoogle, 
  signOut, 
  getCurrentUser, 
  getUserProfile,
  onAuthStateChange 
} from '../lib/supabase/auth';
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
    // Load initial user
    getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          refreshProfile();
        }
      })
      .catch((error) => {
        console.error('Failed to get current user:', error);
      })
      .finally(() => {
        setLoading(false);
      });
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