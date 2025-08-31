import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST() {
  const supabase = await createClient();
  const origin = (await headers()).get('origin');

  const { error } = await supabase.auth.signOut();

  if (error) {
    // Still redirect to login even if there's an error
  }

  return NextResponse.redirect(`${origin}/login`);
}
