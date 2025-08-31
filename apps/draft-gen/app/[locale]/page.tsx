import { setRequestLocale } from 'next-intl/server';
import { getUser } from '@/lib/supabase/auth';
import LandingPage from '@/components/LandingPage';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getUser();

  // Show landing page for all users - both authenticated and non-authenticated can use the prompt
  return <LandingPage isAuthenticated={!!user} locale={locale} />;
}
