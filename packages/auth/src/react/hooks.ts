/**
 * React hooks for authentication
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthContext } from './context';
import type { AuthUser, AuthProfile, AuthSession } from '../types';

/**
 * Hook to access authentication state and methods
 */
export function useAuth() {
  const context = useAuthContext();
  
  return {
    user: context.user,
    profile: context.profile,
    session: context.session,
    loading: context.loading,
    error: context.error,
    isAuthenticated: !!context.user,
    signIn: context.signIn,
    signUp: context.signUp,
    signInWithOAuth: context.signInWithOAuth,
    signOut: context.signOut,
    updateProfile: context.updateProfile,
    refreshProfile: context.refreshProfile,
    refreshSession: context.refreshSession
  };
}

/**
 * Hook to access current user
 */
export function useUser() {
  const { user, loading, error } = useAuthContext();
  
  return {
    user,
    loading,
    error,
    isAuthenticated: !!user
  };
}

/**
 * Hook to access user profile
 */
export function useProfile() {
  const { profile, loading, error, refreshProfile, updateProfile } = useAuthContext();
  
  return {
    profile,
    loading,
    error,
    refreshProfile,
    updateProfile
  };
}

/**
 * Hook to access session
 */
export function useSession() {
  const { session, loading, error, refreshSession } = useAuthContext();
  
  return {
    session,
    loading,
    error,
    isValid: !!session,
    refreshSession
  };
}

/**
 * Hook to require authentication
 */
export function useRequireAuth(redirectTo?: string) {
  const { user, loading } = useAuthContext();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !user && redirectTo && !isRedirecting) {
      setIsRedirecting(true);
      
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    }
  }, [user, loading, redirectTo, isRedirecting]);

  return {
    user,
    loading: loading || isRedirecting,
    isAuthenticated: !!user
  };
}

/**
 * Hook for authentication guard
 */
export function useAuthGuard(
  options: {
    redirectTo?: string;
    fallback?: React.ReactNode;
    requireProfile?: boolean;
  } = {}
) {
  const { user, profile, loading } = useAuthContext();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (loading) {
      setShouldRender(false);
      return;
    }

    const isAuthenticated = !!user;
    const hasProfile = !options.requireProfile || !!profile;

    if (isAuthenticated && hasProfile) {
      setShouldRender(true);
    } else if (options.redirectTo && typeof window !== 'undefined') {
      window.location.href = options.redirectTo;
    } else {
      setShouldRender(false);
    }
  }, [user, profile, loading, options.redirectTo, options.requireProfile]);

  return {
    shouldRender,
    loading,
    fallback: options.fallback
  };
}

/**
 * Type guard to check if profile has a role field
 */
function profileHasRole(profile: AuthProfile): profile is AuthProfile & { role: string } {
  return 'role' in profile && typeof profile.role === 'string';
}

/**
 * Type guard to check if profile has roles array
 */
function profileHasRoles(profile: AuthProfile): profile is AuthProfile & { roles: string[] } {
  return 'roles' in profile && Array.isArray(profile.roles);
}

/**
 * Hook for role-based access control
 */
export function useRole() {
  const { user, profile } = useAuthContext();
  
  const hasRole = useCallback((role: string): boolean => {
    if (!user || !profile) return false;
    
    // Check user metadata
    const userRole = user.user_metadata?.role || user.app_metadata?.role;
    if (userRole === role) return true;
    
    // Check profile role with type guard
    if (profileHasRole(profile) && profile.role === role) return true;
    
    // Check roles array with type guard
    if (profileHasRoles(profile)) {
      return profile.roles.includes(role);
    }
    
    return false;
  }, [user, profile]);

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  }, [hasRole]);

  const hasAllRoles = useCallback((roles: string[]): boolean => {
    return roles.every(role => hasRole(role));
  }, [hasRole]);

  // Get current role with proper type checking
  const getCurrentRole = useCallback((): string | null => {
    const userRole = user?.user_metadata?.role || user?.app_metadata?.role;
    if (userRole && typeof userRole === 'string') return userRole;
    
    if (profile && profileHasRole(profile)) return profile.role;
    
    return null;
  }, [user, profile]);

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    currentRole: getCurrentRole()
  };
}

/**
 * Type guard to check if profile has permissions array
 */
function profileHasPermissions(profile: AuthProfile): profile is AuthProfile & { permissions: string[] } {
  return 'permissions' in profile && Array.isArray(profile.permissions);
}

/**
 * Hook for permission-based access control
 */
export function usePermission() {
  const { user, profile } = useAuthContext();
  
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user || !profile) return false;
    
    // Check user metadata
    const userPermissions = user.user_metadata?.permissions || user.app_metadata?.permissions;
    if (Array.isArray(userPermissions) && userPermissions.includes(permission)) {
      return true;
    }
    
    // Check profile permissions with type guard
    if (profileHasPermissions(profile)) {
      return profile.permissions.includes(permission);
    }
    
    return false;
  }, [user, profile]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  // Get permissions with proper type checking
  const getPermissions = useCallback((): string[] => {
    if (profile && profileHasPermissions(profile)) {
      return profile.permissions;
    }
    return [];
  }, [profile]);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissions: getPermissions()
  };
}

/**
 * Hook for session management
 */
export function useSessionManager() {
  const { session, refreshSession, supabase } = useAuthContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Auto refresh session before expiry
  useEffect(() => {
    if (!session || !autoRefreshEnabled || !supabase) return;

    const expiresAt = session.expires_at;
    if (!expiresAt) return;

    // Refresh 5 minutes before expiry
    const refreshTime = expiresAt * 1000 - 5 * 60 * 1000;
    const now = Date.now();
    
    if (refreshTime <= now) {
      // Session needs immediate refresh
      setIsRefreshing(true);
      refreshSession().finally(() => setIsRefreshing(false));
      return;
    }

    // Schedule refresh
    const timeout = setTimeout(() => {
      setIsRefreshing(true);
      refreshSession().finally(() => setIsRefreshing(false));
    }, refreshTime - now);

    return () => clearTimeout(timeout);
  }, [session, refreshSession, autoRefreshEnabled, supabase]);

  return {
    session,
    isRefreshing,
    autoRefreshEnabled,
    setAutoRefreshEnabled,
    refreshSession: async () => {
      setIsRefreshing(true);
      try {
        return await refreshSession();
      } finally {
        setIsRefreshing(false);
      }
    }
  };
}