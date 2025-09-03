import { createClient } from './client';
import type { Database } from './database.types';
import { logger } from '@draft-gen/logger';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export async function signInWithGoogle() {
  logger.log('=== signInWithGoogle called ===');

  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });

  logger.log('=== OAuth result ===', { data, error });

  if (error) {
    throw new Error(`Failed to sign in with Google: ${error.message}`);
  }

  return data;
}

export async function signOut() {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Failed to sign out: ${error.message}`);
  }
}

export async function getCurrentUser() {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Failed to get current user: ${error.message}`);
  }

  return user;
}

export async function getUserProfile(): Promise<Profile | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    throw new Error(`Failed to get user profile: ${error.message}`);
  }

  return data;
}

export async function upsertUserProfile(profileData: Partial<ProfileInsert>): Promise<Profile> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to upsert profile');
  }

  const profile: ProfileInsert = {
    id: user.id,
    display_name: user.user_metadata?.full_name || user.email || null,
    avatar_url: user.user_metadata?.avatar_url || null,
    role: 'GENERATOR',
    ...profileData,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('profiles').upsert(profile).select().single();

  if (error) {
    throw new Error(`Failed to upsert user profile: ${error.message}`);
  }

  return data;
}

export async function updateUserProfile(updates: ProfileUpdate): Promise<Profile> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to update profile');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }

  return data;
}

export async function onAuthStateChange(
  callback: (
    user: import('@supabase/supabase-js').User | null,
    event?: import('@supabase/supabase-js').AuthChangeEvent
  ) => void
) {
  const supabase = createClient();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      // Upsert profile when user signs in
      await upsertUserProfile({});
    }
    callback(session?.user || null, event);
  });

  return () => subscription.unsubscribe();
}
