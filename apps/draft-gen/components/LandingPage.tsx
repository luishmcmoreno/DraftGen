'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { useTheme } from './ThemeProvider';
import {
  HeroSection,
  FeaturesGrid,
  NavigationHeader,
  Footer,
  Button,
  Card,
  GoogleSignInButton,
} from '@draft-gen/ui';
import { FileText, Zap, Users, Shield, Globe, Workflow, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  isAuthenticated: boolean;
  locale: string;
}

export default function LandingPage({ isAuthenticated, locale }: LandingPageProps) {
  const t = useTranslations('landing');
  const tCommon = useTranslations('common');
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [prompt, setPrompt] = useState('');

  // Load prompt from sessionStorage on mount
  useEffect(() => {
    const savedPrompt = sessionStorage.getItem('pendingPrompt');
    if (savedPrompt) {
      setPrompt(savedPrompt);
    }
  }, []);

  const handlePromptSubmit = (message: string) => {
    // Save prompt to sessionStorage
    sessionStorage.setItem('pendingPrompt', message);

    if (isAuthenticated) {
      // If authenticated, go directly to generator with prompt
      router.push(`/${locale}/generator?prompt=${encodeURIComponent(message)}`);
    } else {
      // If not authenticated, redirect to login with redirect parameter
      router.push(`/api/auth/login?redirect=generator`);
    }
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push(`/${locale}/templates`);
    } else {
      router.push(`/${locale}/login`);
    }
  };

  const features = [
    {
      icon: FileText,
      title: t('features.templates.title'),
      description: t('features.templates.description'),
    },
    {
      icon: Zap,
      title: t('features.automation.title'),
      description: t('features.automation.description'),
    },
    {
      icon: Workflow,
      title: t('features.workflow.title'),
      description: t('features.workflow.description'),
    },
    {
      icon: Globe,
      title: t('features.multilingual.title'),
      description: t('features.multilingual.description'),
    },
    {
      icon: Users,
      title: t('features.collaboration.title'),
      description: t('features.collaboration.description'),
    },
    {
      icon: Shield,
      title: t('features.security.title'),
      description: t('features.security.description'),
    },
  ];

  // No navigation links for non-authenticated users
  const navLinks: never[] = [];

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader
        appName={t('appName')}
        links={navLinks}
        customActions={
          <GoogleSignInButton
            onClick={() => router.push('/api/auth/login')}
            variant={resolvedTheme === 'dark' ? 'neutral' : 'light'}
            size="small"
            text={tCommon('loginGoogle')}
          />
        }
      />

      <HeroSection
        title={
          <>
            {t('hero.titlePrefix')}
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              {' '}
              {t('hero.titleHighlight')}{' '}
            </span>
            {t('hero.titleSuffix')}
          </>
        }
        subtitle={t('hero.subtitle')}
        badgeText={t('hero.badge')}
        placeholderText={t('hero.placeholder')}
        examplesText={t('hero.examples')}
        ctaText={t('hero.cta')}
        onSubmit={handlePromptSubmit}
        onGetStarted={handleGetStarted}
      />

      <FeaturesGrid
        title={t('features.title')}
        subtitle={t('features.subtitle')}
        features={features}
      />

      {/* Use Cases Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">{t('useCases.title')}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('useCases.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8">
                <h3 className="text-xl font-semibold mb-4">{t('useCases.business.title')}</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('useCases.business.item1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('useCases.business.item2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('useCases.business.item3')}</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-8">
                <h3 className="text-xl font-semibold mb-4">{t('useCases.personal.title')}</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('useCases.personal.item1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('useCases.personal.item2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('useCases.personal.item3')}</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{t('cta.title')}</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">{t('cta.subtitle')}</p>
          <Button
            size="lg"
            variant="secondary"
            onClick={handleGetStarted}
            className="px-8 py-4 text-base"
          >
            {t('cta.button')}
          </Button>
        </div>
      </section>

      <Footer
        appName={t('appName')}
        copyrightText={t('footer.copyright')}
        year={new Date().getFullYear()}
      />
    </div>
  );
}
