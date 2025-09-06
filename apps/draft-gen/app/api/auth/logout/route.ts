import { createClient } from '@/lib/supabase/server';
import { signOut } from '@draft-gen/auth/server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST() {
  const supabase = await createClient();
  const origin = (await headers()).get('origin');

  const { error } = await signOut(supabase);

  if (error) {
    // Still redirect to home even if there's an error
  }

  return NextResponse.redirect(`${origin}/`);
}
