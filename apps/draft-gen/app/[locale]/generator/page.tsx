import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import Topbar from '@/components/Topbar';
import { requireAuth } from '@draft-gen/auth/server';
import { createClient } from '@/lib/supabase/server';
import { GeneratorPageClient } from '@/components/GeneratorPageClient';

export default async function GeneratorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Require authentication
  const supabase = await createClient();
  let user;
  try {
    user = await requireAuth(supabase);
  } catch {
    redirect('/login');
  }

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <>
      <Topbar profile={profile} />
      <GeneratorPageClient />
    </>
  );
}
