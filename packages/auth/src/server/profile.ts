/**
 * Profile management functions
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerClient, createServiceRoleClient } from '../clients/server';
import { getUser } from './auth';
import type { 
  AuthProfile, 
  AuthUser,
  AuthResponse,
  AuthError,
  TablesInsert,
  TablesUpdate
} from '../types';

/**
 * Create an auth error for profile operations
 */
function createProfileError(message: string, originalError?: unknown): AuthError {
  return {
    code: 'auth/internal-error',
    message,
    statusCode: 500,
    originalError: originalError instanceof Error ? originalError : undefined,
    details: originalError
  };
}

/**
 * Get the current user's profile
 * 
 * @param client - Optional Supabase client
 * @returns User profile or null
 */
export async function getProfile(
  client?: SupabaseClient
): Promise<AuthResponse<AuthProfile | null>> {
  try {
    const supabase = client || await createServerClient();
    
    // Get current user
    const { data: user, error: userError } = await getUser(supabase);
    if (userError || !user) {
      return { 
        data: null,
        error: userError || createProfileError('User not authenticated')
      };
    }

    // Fetch profile from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // Profile might not exist yet, which is ok
      if (error.code === 'PGRST116') {
        return { data: null };
      }
      
      return {
        data: null,
        error: createProfileError('Failed to fetch profile', error)
      };
    }

    return { data: profile as AuthProfile };
  } catch (error) {
    return {
      data: null,
      error: createProfileError('An unexpected error occurred while fetching profile', error)
    };
  }
}

/**
 * Get a profile by user ID (requires service role or RLS permissions)
 * 
 * @param userId - The user ID
 * @param client - Optional Supabase client
 * @returns User profile or null
 */
export async function getProfileById(
  userId: string,
  client?: SupabaseClient
): Promise<AuthResponse<AuthProfile | null>> {
  try {
    const supabase = client || await createServerClient();
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null };
      }
      
      return {
        data: null,
        error: createProfileError('Failed to fetch profile by ID', error)
      };
    }

    return { data: profile as AuthProfile };
  } catch (error) {
    return {
      data: null,
      error: createProfileError('An unexpected error occurred while fetching profile', error)
    };
  }
}

/**
 * Create or update user profile
 * 
 * @param profileData - Profile data to upsert
 * @param client - Optional Supabase client
 * @returns Updated profile
 */
export async function upsertProfile(
  profileData: Partial<AuthProfile>,
  client?: SupabaseClient
): Promise<AuthResponse<AuthProfile | null>> {
  try {
    const supabase = client || await createServerClient();
    
    // Get current user
    const { data: user, error: userError } = await getUser(supabase);
    if (userError || !user) {
      return {
        data: null,
        error: userError || createProfileError('User not authenticated')
      };
    }

    // Prepare profile data
    const profileToUpsert: TablesInsert<'profiles'> = {
      user_id: user.id,
      email: profileData.email || user.email,
      full_name: profileData.full_name,
      display_name: profileData.display_name,
      avatar_url: profileData.avatar_url,
      bio: profileData.bio,
      metadata: profileData.metadata,
      updated_at: new Date().toISOString()
    };

    // Upsert profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert(profileToUpsert, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: createProfileError('Failed to upsert profile', error)
      };
    }

    return { data: profile as AuthProfile };
  } catch (error) {
    return {
      data: null,
      error: createProfileError('An unexpected error occurred while upserting profile', error)
    };
  }
}

/**
 * Update user profile
 * 
 * @param updates - Profile fields to update
 * @param client - Optional Supabase client
 * @returns Updated profile
 */
export async function updateProfile(
  updates: Partial<AuthProfile>,
  client?: SupabaseClient
): Promise<AuthResponse<AuthProfile | null>> {
  try {
    const supabase = client || await createServerClient();
    
    // Get current user
    const { data: user, error: userError } = await getUser(supabase);
    if (userError || !user) {
      return {
        data: null,
        error: userError || createProfileError('User not authenticated')
      };
    }

    // Prepare update data
    const profileUpdate: TablesUpdate<'profiles'> = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Remove fields that shouldn't be updated
    delete (profileUpdate as any).id;
    delete (profileUpdate as any).user_id;
    delete (profileUpdate as any).created_at;

    // Update profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: createProfileError('Failed to update profile', error)
      };
    }

    return { data: profile as AuthProfile };
  } catch (error) {
    return {
      data: null,
      error: createProfileError('An unexpected error occurred while updating profile', error)
    };
  }
}

/**
 * Delete user profile (requires service role)
 * 
 * @param userId - The user ID
 * @param client - Optional Supabase client (should be service role)
 * @returns Success or error
 */
export async function deleteProfile(
  userId: string,
  client?: SupabaseClient
): Promise<AuthResponse<void>> {
  try {
    const supabase = client || await createServiceRoleClient();
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    if (error) {
      return {
        error: createProfileError('Failed to delete profile', error)
      };
    }

    return { data: undefined };
  } catch (error) {
    return {
      error: createProfileError('An unexpected error occurred while deleting profile', error)
    };
  }
}

/**
 * Get user with profile data
 * 
 * @param client - Optional Supabase client
 * @returns User with profile attached
 */
export async function getUserWithProfile(
  client?: SupabaseClient
): Promise<AuthResponse<AuthUser | null>> {
  try {
    const supabase = client || await createServerClient();
    
    // Get user
    const { data: user, error: userError } = await getUser(supabase);
    if (userError || !user) {
      return { 
        data: null,
        error: userError
      };
    }

    // Get profile
    const { data: profile } = await getProfile(supabase);
    
    // Attach profile to user
    const userWithProfile: AuthUser = {
      ...user,
      profile: profile || undefined
    };

    return { data: userWithProfile };
  } catch (error) {
    return {
      data: null,
      error: createProfileError('An unexpected error occurred while fetching user with profile', error)
    };
  }
}

/**
 * Ensure profile exists for user
 * Creates a basic profile if it doesn't exist
 * 
 * @param client - Optional Supabase client
 * @returns Profile
 */
export async function ensureProfile(
  client?: SupabaseClient
): Promise<AuthResponse<AuthProfile | null>> {
  try {
    const supabase = client || await createServerClient();
    
    // Check if profile exists
    const { data: existingProfile } = await getProfile(supabase);
    if (existingProfile) {
      return { data: existingProfile };
    }

    // Get user data
    const { data: user, error: userError } = await getUser(supabase);
    if (userError || !user) {
      return {
        data: null,
        error: userError || createProfileError('User not authenticated')
      };
    }

    // Create basic profile
    return await upsertProfile({
      email: user.email,
      full_name: user.user_metadata?.full_name,
      avatar_url: user.user_metadata?.avatar_url
    }, supabase);
  } catch (error) {
    return {
      data: null,
      error: createProfileError('An unexpected error occurred while ensuring profile exists', error)
    };
  }
}