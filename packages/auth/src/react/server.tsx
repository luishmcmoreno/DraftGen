/**
 * Server-side authentication components for SSR
 */

import { cookies } from 'next/headers';
import { createServerClient } from '../clients/server';
import type { AuthUser, AuthProfile, Database } from '../types';

/**
 * Props for server auth wrapper
 */
export interface ServerAuthWrapperProps {
  children: React.ReactNode;
  profileTable?: string;
}

/**
 * Server-side auth wrapper for SSR
 * This component fetches auth state on the server
 */
export async function ServerAuthWrapper({
  children,
  profileTable = 'profiles'
}: ServerAuthWrapperProps) {
  const supabase = await createServerClient<Database>();
  
  // Get user and session on server
  const { data: { user } } = await supabase.auth.getUser();
  const { data: { session } } = await supabase.auth.getSession();
  
  // Fetch profile if user exists
  let profile: AuthProfile | null = null;
  if (user) {
    const { data } = await supabase
      .from(profileTable)
      .select('*')
      .eq('id', user.id)
      .single();
    
    profile = data as AuthProfile | null;
  }

  // Pass initial state to client components via context or props
  return (
    <>
      {children}
    </>
  );
}

/**
 * Server component to get current user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createServerClient<Database>();
  const { data: { user } } = await supabase.auth.getUser();
  return user as AuthUser | null;
}

/**
 * Server component to get user profile
 */
export async function getUserProfile(
  userId?: string,
  profileTable = 'profiles'
): Promise<AuthProfile | null> {
  const supabase = await createServerClient<Database>();
  
  // If no userId provided, get current user
  let targetUserId = userId;
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    targetUserId = user.id;
  }
  
  const { data } = await supabase
    .from(profileTable)
    .select('*')
    .eq('id', targetUserId)
    .single();
  
  return data as AuthProfile | null;
}

/**
 * Server component to check authentication
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

/**
 * Server component to require authentication
 * Throws an error if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

/**
 * Server component to check role
 */
export async function hasRole(
  role: string,
  userId?: string,
  profileTable = 'profiles'
): Promise<boolean> {
  const supabase = await createServerClient<Database>();
  
  // Get user
  let targetUserId = userId;
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    targetUserId = user.id;
  }
  
  // Check user metadata first
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const userRole = user.user_metadata?.role || user.app_metadata?.role;
    if (userRole === role) return true;
  }
  
  // Check profile
  const profile = await getUserProfile(targetUserId, profileTable);
  if (!profile) return false;
  
  // Check profile role
  if ('role' in profile && profile.role === role) return true;
  
  // Check roles array
  if ('roles' in profile && Array.isArray(profile.roles)) {
    return profile.roles.includes(role);
  }
  
  return false;
}

/**
 * Server component to check permission
 */
export async function hasPermission(
  permission: string,
  userId?: string,
  profileTable = 'profiles'
): Promise<boolean> {
  const supabase = await createServerClient<Database>();
  
  // Get user
  let targetUserId = userId;
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    targetUserId = user.id;
  }
  
  // Check user metadata first
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const userPermissions = user.user_metadata?.permissions || user.app_metadata?.permissions;
    if (Array.isArray(userPermissions) && userPermissions.includes(permission)) {
      return true;
    }
  }
  
  // Check profile
  const profile = await getUserProfile(targetUserId, profileTable);
  if (!profile) return false;
  
  // Check profile permissions
  if ('permissions' in profile && Array.isArray(profile.permissions)) {
    return profile.permissions.includes(permission);
  }
  
  return false;
}