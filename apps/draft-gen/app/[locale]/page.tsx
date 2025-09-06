import { setRequestLocale } from 'next-intl/server';
import { getUser } from '@draft-gen/auth/server';
import { createClient } from '@/lib/supabase/server';
import LandingPage from '@/components/LandingPage';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: user, error } = await getUser(supabase);

  // Get profile if authenticated
  let profile = null;
  if (user && !error) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    profile = data;
  }

  // Show landing page for all users - both authenticated and non-authenticated can use the prompt
  // Only consider authenticated if we have a user AND no error
  return <LandingPage isAuthenticated={!!user && !error} profile={profile} locale={locale} />;
}
