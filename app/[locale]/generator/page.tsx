import { setRequestLocale } from 'next-intl/server';
import Topbar from '@/components/Topbar';
import { requireAuth, getProfile } from '@/lib/supabase/auth';
import { GeneratorContent } from '@/components/GeneratorContent';

export default async function GeneratorPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  // Require authentication
  await requireAuth();
  const profile = await getProfile();

  return (
    <>
      <Topbar profile={profile} />
      <GeneratorContent />
    </>
  )
}