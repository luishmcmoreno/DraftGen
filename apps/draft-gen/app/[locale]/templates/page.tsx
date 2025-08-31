import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import Topbar from '@/components/Topbar';
import { requireAuth, getProfile } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@draft-gen/ui';
import TemplatesClient from './TemplatesClient';

export default async function TemplatesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Require authentication
  await requireAuth();
  const profile = await getProfile();

  const t = await getTranslations({ locale, namespace: 'templates' });

  // Fetch templates from database
  const supabase = await createClient();
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
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              {t('list.title')}
            </h1>
            <Button asChild>
              <Link href="/generator">
                {t('list.createCta')}
              </Link>
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
                <Link href="/generator">
                  {t('empty.cta')}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
