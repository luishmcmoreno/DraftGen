/**
 * Authentication context and provider for React
 */

'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { 
  AuthUser, 
  AuthProfile, 
  AuthSession,
  AuthResponse,
  SignInCredentials,
  SignUpCredentials,
  OAuthSignInOptions
} from '../types';

/**
 * Authentication context value
 */
export interface AuthContextValue {
  // State
  user: AuthUser | null;
  profile: AuthProfile | null;
  session: AuthSession | null;
  loading: boolean;
  error: Error | null;
  
  // Auth methods
  signIn: (credentials: SignInCredentials) => Promise<AuthResponse<AuthSession>>;
  signUp: (credentials: SignUpCredentials) => Promise<AuthResponse<AuthUser>>;
  signInWithOAuth: (options: OAuthSignInOptions) => Promise<AuthResponse<void>>;
  signOut: () => Promise<AuthResponse<void>>;
  
  // Profile methods
  updateProfile: (updates: Partial<AuthProfile>) => Promise<AuthResponse<AuthProfile>>;
  refreshProfile: () => Promise<AuthResponse<AuthProfile | null>>;
  
  // Session methods
  refreshSession: () => Promise<AuthResponse<AuthSession | null>>;
  
  // Client access
  supabase: SupabaseClient | null;
}

/**
 * Authentication context
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Authentication provider props
 */
export interface AuthProviderProps {
  children: React.ReactNode;
  supabase: SupabaseClient;
  initialSession?: Session | null;
  initialUser?: User | null;
  profileTable?: string;
  onAuthStateChange?: (event: string, session: Session | null) => void;
  storageKey?: string;
}

/**
 * Authentication provider component
 */
export function AuthProvider({
  children,
  supabase,
  initialSession = null,
  initialUser = null,
  profileTable = 'profiles',
  onAuthStateChange,
  storageKey = 'auth-session'
}: AuthProviderProps) {
  // State
  const [user, setUser] = useState<AuthUser | null>(initialUser as AuthUser | null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(initialSession as AuthSession | null);
  const [loading, setLoading] = useState(!initialSession);
  const [error, setError] = useState<Error | null>(null);

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string): Promise<AuthProfile | null> => {
    try {
      const { data, error } = await supabase
        .from(profileTable)
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as AuthProfile;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  }, [supabase, profileTable]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        setLoading(true);
        
        // Get current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!mounted) return;

        if (currentSession) {
          setSession(currentSession as AuthSession);
          setUser(currentSession.user as AuthUser);
          
          // Fetch profile
          const userProfile = await fetchProfile(currentSession.user.id);
          if (mounted) {
            setProfile(userProfile);
          }
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize auth'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      // Call user's callback if provided
      onAuthStateChange?.(event, newSession);

      if (newSession) {
        setSession(newSession as AuthSession);
        setUser(newSession.user as AuthUser);
        
        // Fetch profile on sign in
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          const userProfile = await fetchProfile(newSession.user.id);
          setProfile(userProfile);
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile, onAuthStateChange]);

  // Auth methods
  const signIn = useCallback(async (credentials: SignInCredentials): Promise<AuthResponse<AuthSession>> => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      
      if (error) {
        setError(error);
        return { error: { code: 'auth/invalid-credentials', message: error.message } };
      }

      if (!data.session) {
        return { error: { code: 'auth/invalid-credentials', message: 'No session returned' } };
      }

      return { data: data.session as AuthSession };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign in failed');
      setError(error);
      return { error: { code: 'auth/internal-error', message: error.message } };
    }
  }, [supabase]);

  const signUp = useCallback(async (credentials: SignUpCredentials): Promise<AuthResponse<AuthUser>> => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signUp(credentials);
      
      if (error) {
        setError(error);
        return { error: { code: 'auth/email-already-exists', message: error.message } };
      }

      if (!data.user) {
        return { error: { code: 'auth/internal-error', message: 'No user returned' } };
      }

      return { data: data.user as AuthUser };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign up failed');
      setError(error);
      return { error: { code: 'auth/internal-error', message: error.message } };
    }
  }, [supabase]);

  const signInWithOAuth = useCallback(async (options: OAuthSignInOptions): Promise<AuthResponse<void>> => {
    try {
      setError(null);
      // Map our OAuthSignInOptions to Supabase's SignInWithOAuthCredentials
      const { error } = await supabase.auth.signInWithOAuth({
        provider: options.provider as 'google' | 'github' | 'facebook' | 'twitter' | 'discord' | 'azure' | 'spotify',
        options: {
          redirectTo: options.redirectTo,
          scopes: options.scopes,
          queryParams: options.queryParams,
          skipBrowserRedirect: options.skipBrowserRedirect
        }
      });
      
      if (error) {
        setError(error);
        return { error: { code: 'auth/provider-error', message: error.message } };
      }

      return { data: undefined };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('OAuth sign in failed');
      setError(error);
      return { error: { code: 'auth/internal-error', message: error.message } };
    }
  }, [supabase]);

  const signOut = useCallback(async (): Promise<AuthResponse<void>> => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setError(error);
        return { error: { code: 'auth/internal-error', message: error.message } };
      }

      setUser(null);
      setProfile(null);
      setSession(null);
      
      return { data: undefined };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign out failed');
      setError(error);
      return { error: { code: 'auth/internal-error', message: error.message } };
    }
  }, [supabase]);

  const updateProfile = useCallback(async (updates: Partial<AuthProfile>): Promise<AuthResponse<AuthProfile>> => {
    try {
      setError(null);
      
      if (!user) {
        return { error: { code: 'auth/unauthorized', message: 'No user signed in' } };
      }

      const { data, error } = await supabase
        .from(profileTable)
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        setError(error);
        return { error: { code: 'auth/internal-error', message: error.message } };
      }

      const updatedProfile = data as AuthProfile;
      setProfile(updatedProfile);
      
      return { data: updatedProfile };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Profile update failed');
      setError(error);
      return { error: { code: 'auth/internal-error', message: error.message } };
    }
  }, [supabase, user, profileTable]);

  const refreshProfile = useCallback(async (): Promise<AuthResponse<AuthProfile | null>> => {
    try {
      setError(null);
      
      if (!user) {
        return { data: null };
      }

      const userProfile = await fetchProfile(user.id);
      setProfile(userProfile);
      
      return { data: userProfile };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Profile refresh failed');
      setError(error);
      return { error: { code: 'auth/internal-error', message: error.message } };
    }
  }, [user, fetchProfile]);

  const refreshSession = useCallback(async (): Promise<AuthResponse<AuthSession | null>> => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        setError(error);
        return { error: { code: 'auth/session-expired', message: error.message } };
      }

      if (!data.session) {
        return { data: null };
      }

      setSession(data.session as AuthSession);
      return { data: data.session as AuthSession };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Session refresh failed');
      setError(error);
      return { error: { code: 'auth/internal-error', message: error.message } };
    }
  }, [supabase]);

  // Memoize context value
  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    session,
    loading,
    error,
    signIn,
    signUp,
    signInWithOAuth,
    signOut,
    updateProfile,
    refreshProfile,
    refreshSession,
    supabase
  }), [
    user,
    profile,
    session,
    loading,
    error,
    signIn,
    signUp,
    signInWithOAuth,
    signOut,
    updateProfile,
    refreshProfile,
    refreshSession,
    supabase
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 */
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
}