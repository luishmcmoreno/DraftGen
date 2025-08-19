import { createClient } from './server';
import { redirect } from 'next/navigation';

export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

export async function getProfile() {
  const supabase = await createClient();
  const user = await getUser();
  
  if (!user) {
    return null;
  }
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return profile;
}

export async function requireAuth() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }
  
  return user;
}

export async function upsertProfile(userId: string, data: {
  display_name?: string | null;
  avatar_url?: string | null;
  role?: 'GENERATOR' | 'CONSUMER';
}) {
  const supabase = await createClient();
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      ...data,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error upserting profile:', error);
    return null;
  }
  
  return profile;
}