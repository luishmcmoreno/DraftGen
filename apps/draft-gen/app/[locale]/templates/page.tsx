import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Topbar from '@/components/Topbar';
import { requireAuth } from '@draft-gen/auth/server';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@draft-gen/ui';
import TemplatesClient from './TemplatesClient';

export default async function TemplatesPage({ params }: { params: Promise<{ locale: string }> }) {
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

  const t = await getTranslations({ locale, namespace: 'templates' });

  // Fetch templates from database
  const { data: templates, error } = await supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    // Error fetching templates - templates will be empty
  }

  return (
    <>
      <Topbar profile={profile} />
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">{t('list.title')}</h1>
            <Button asChild>
              <Link href="/generator">{t('list.createCta')}</Link>
            </Button>
          </div>

          {templates && templates.length > 0 ? (
            <TemplatesClient templates={templates} />
          ) : (
            <div className="bg-muted rounded-lg p-16 text-center">
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                {t('empty.title')}
              </h3>
              <p className="text-muted-foreground mb-4">{t('empty.subtitle')}</p>
              <Button size="lg" asChild>
                <Link href="/generator">{t('empty.cta')}</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
