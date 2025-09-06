/**
 * Authentication guard components
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth, useRole, usePermission } from './hooks';

/**
 * Props for AuthGuard component
 */
export interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requireProfile?: boolean;
  loadingComponent?: React.ReactNode;
}

/**
 * Component that protects its children with authentication
 */
export function AuthGuard({
  children,
  fallback = null,
  redirectTo,
  requireProfile = false,
  loadingComponent = null
}: AuthGuardProps) {
  const { user, profile, loading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    const hasAuth = !!user;
    const hasProfile = !requireProfile || !!profile;

    if (hasAuth && hasProfile) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
      
      if (redirectTo && typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    }
  }, [user, profile, loading, redirectTo, requireProfile]);

  if (loading) {
    return <>{loadingComponent}</>;
  }

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Props for RoleGuard component
 */
export interface RoleGuardProps {
  children: React.ReactNode;
  role?: string;
  roles?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
}

/**
 * Component that protects its children with role-based access
 */
export function RoleGuard({
  children,
  role,
  roles,
  requireAll = false,
  fallback = null,
  redirectTo,
  loadingComponent = null
}: RoleGuardProps) {
  const { loading } = useAuth();
  const { hasRole, hasAnyRole, hasAllRoles } = useRole();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    let authorized = false;

    if (role) {
      authorized = hasRole(role);
    } else if (roles && roles.length > 0) {
      authorized = requireAll ? hasAllRoles(roles) : hasAnyRole(roles);
    }

    setIsAuthorized(authorized);

    if (!authorized && redirectTo && typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
  }, [loading, role, roles, requireAll, hasRole, hasAnyRole, hasAllRoles, redirectTo]);

  if (loading) {
    return <>{loadingComponent}</>;
  }

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Props for PermissionGuard component
 */
export interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
}

/**
 * Component that protects its children with permission-based access
 */
export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  redirectTo,
  loadingComponent = null
}: PermissionGuardProps) {
  const { loading } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    let authorized = false;

    if (permission) {
      authorized = hasPermission(permission);
    } else if (permissions && permissions.length > 0) {
      authorized = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
    }

    setIsAuthorized(authorized);

    if (!authorized && redirectTo && typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
  }, [loading, permission, permissions, requireAll, hasPermission, hasAnyPermission, hasAllPermissions, redirectTo]);

  if (loading) {
    return <>{loadingComponent}</>;
  }

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Props for GuestGuard component
 */
export interface GuestGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
}

/**
 * Component that only renders for non-authenticated users
 */
export function GuestGuard({
  children,
  redirectTo = '/',
  loadingComponent = null
}: GuestGuardProps) {
  const { user, loading } = useAuth();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (user) {
      setShouldRender(false);
      
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    } else {
      setShouldRender(true);
    }
  }, [user, loading, redirectTo]);

  if (loading) {
    return <>{loadingComponent}</>;
  }

  if (!shouldRender) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Props for ConditionalRender component
 */
export interface ConditionalRenderProps {
  children: React.ReactNode;
  condition: 'authenticated' | 'unauthenticated' | 'loading';
}

/**
 * Component that conditionally renders based on auth state
 */
export function ConditionalRender({
  children,
  condition
}: ConditionalRenderProps) {
  const { user, loading } = useAuth();

  if (condition === 'loading' && loading) {
    return <>{children}</>;
  }

  if (condition === 'authenticated' && !loading && user) {
    return <>{children}</>;
  }

  if (condition === 'unauthenticated' && !loading && !user) {
    return <>{children}</>;
  }

  return null;
}

/**
 * Props for ProfileGuard component
 */
export interface ProfileGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
  requiredFields?: string[];
}

/**
 * Component that ensures user has a complete profile
 */
export function ProfileGuard({
  children,
  fallback = null,
  redirectTo,
  loadingComponent = null,
  requiredFields = []
}: ProfileGuardProps) {
  const { user, profile, loading } = useAuth();
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user || !profile) {
      setIsComplete(false);
      
      if (redirectTo && typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
      return;
    }

    // Check required fields
    const hasAllFields = requiredFields.every(field => {
      const value = profile[field as keyof typeof profile];
      return value !== null && value !== undefined && value !== '';
    });

    setIsComplete(hasAllFields);

    if (!hasAllFields && redirectTo && typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
  }, [user, profile, loading, redirectTo, requiredFields]);

  if (loading) {
    return <>{loadingComponent}</>;
  }

  if (!isComplete) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}