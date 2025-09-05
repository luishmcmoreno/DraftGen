'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { logger } from '@draft-gen/logger';
import Topbar from '../../src/components/Topbar';
import { useAuth } from '../../src/components/AuthProvider';
import { useTheme } from '../../src/components/ThemeProvider';
import { GoogleSignInButton, HeroSection, HeroSectionRef } from '@draft-gen/ui';
import useConversionStore from '../../src/stores/conversionStore';
import {
  FileText,
  Zap,
  Users,
  Shield,
  Globe,
  Workflow,
  ArrowRight,
  Sparkles,
  Trash2,
  Type,
  Columns,
  Calculator,
  Code,
  Mail,
  AlignLeft,
  Phone,
} from 'lucide-react';

export default function Home() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const tAuth = useTranslations('auth');
  
  const { user, signIn } = useAuth();
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const heroRef = useRef<HeroSectionRef>(null);

  // Zustand store
  const { setPendingConversion, showLoginDialog, setShowLoginDialog, setPostAuthRedirect } =
    useConversionStore();

  const handleDualSubmit = (task: string, textContent: string) => {
    // Store conversion data in Zustand store
    setPendingConversion(task, textContent);

    // Check if user is authenticated
    if (!user) {
      // Show login dialog and set redirect path
      setShowLoginDialog(true);
      setPostAuthRedirect('/routines/create');
      return;
    }

    // User is authenticated, redirect to create page
    router.push('/routines/create');
  };

  const handleGetStarted = () => {
    if (user) {
      router.push('/routines');
    } else {
      signIn();
    }
  };

  const examples = [
    {
      title: t('examples.removeduplicates.title'),
      description: t('examples.removeduplicates.description'),
      task: t('examples.removeduplicates.task'),
      sampleInput:
        'name,email,age\nJohn,john@email.com,25\nJane,jane@email.com,30\nJohn,john@email.com,25',
      icon: Trash2,
      category: t('examples.categories.csv'),
    },
    {
      title: t('examples.capitalize.title'),
      description: t('examples.capitalize.description'),
      task: t('examples.capitalize.task'),
      sampleInput: 'the quick brown fox jumps over the lazy dog',
      icon: Type,
      category: t('examples.categories.text'),
    },
    {
      title: t('examples.removecolumns.title'),
      description: t('examples.removecolumns.description'),
      task: t('examples.removecolumns.task'),
      sampleInput: 'name,email,age,city\nJohn,john@email.com,25,NYC\nJane,jane@email.com,30,LA',
      icon: Columns,
      category: t('examples.categories.csv'),
    },
    {
      title: t('examples.europeanNumbers.title'),
      description: t('examples.europeanNumbers.description'),
      task: t('examples.europeanNumbers.task'),
      sampleInput: 'Price: 1.234,56 €\nQuantity: 2.500,00\nDiscount: 15,5%',
      icon: Calculator,
      category: t('examples.categories.format'),
    },
    {
      title: t('examples.csvToJson.title'),
      description: t('examples.csvToJson.description'),
      task: t('examples.csvToJson.task'),
      sampleInput: 'name,age,city\nAlice,28,Boston\nBob,35,Seattle',
      icon: Code,
      category: t('examples.categories.data'),
    },
    {
      title: t('examples.extractEmails.title'),
      description: t('examples.extractEmails.description'),
      task: t('examples.extractEmails.task'),
      sampleInput:
        'Contact us at support@example.com or sales@company.org. For urgent matters, reach admin@site.net.',
      icon: Mail,
      category: t('examples.categories.text'),
    },
    {
      title: t('examples.splitText.title'),
      description: t('examples.splitText.description'),
      task: t('examples.splitText.task'),
      sampleInput: "This is the first sentence. This is the second sentence. Here's a third one!",
      icon: AlignLeft,
      category: t('examples.categories.text'),
    },
    {
      title: t('examples.formatPhones.title'),
      description: t('examples.formatPhones.description'),
      task: t('examples.formatPhones.task'),
      sampleInput: '1234567890\n555.123.4567\n(555) 987-6543\n+1-800-555-0199',
      icon: Phone,
      category: t('examples.categories.format'),
    },
  ];

  const getCategoryColor = (category: string) => {
    const csvCategory = t('examples.categories.csv');
    const textCategory = t('examples.categories.text');
    const formatCategory = t('examples.categories.format');
    const dataCategory = t('examples.categories.data');
    
    switch (category) {
      case csvCategory:
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800';
      case textCategory:
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800';
      case formatCategory:
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-800';
      case dataCategory:
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-300 dark:border-orange-800';
      default:
        return 'bg-muted/50 text-muted-foreground border-border';
    }
  };

  const handleLoginAndContinue = async () => {
    try {
      setLoading(true);

      // The pending conversion is already stored in Zustand store
      // Just trigger the sign in
      await signIn();

      // After successful sign in, the auth callback will redirect
      setShowLoginDialog(false);
    } catch (error) {
      logger.error('Login failed:', error);
      setLoading(false);
    }
  };

  // No useEffect needed anymore - auth redirect handled by AuthProvider with Zustand

  // Return landing page
  return (
    <div className="min-h-screen bg-background">
      <Topbar
        profile={
          user
            ? {
                display_name: user?.user_metadata?.full_name || null,
                avatar_url: user?.user_metadata?.avatar_url || null,
              }
            : null
        }
      />

      <HeroSection
        ref={heroRef}
        title={
          <>
            {t('hero.title')}{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              {t('hero.titleHighlight')}
            </span>
          </>
        }
        subtitle={t('hero.subtitle')}
        badgeText={t('hero.badge')}
        ctaText={tCommon('convert')}
        showDualInput={true}
        taskPlaceholder={t('hero.inputPlaceholder')}
        textPlaceholder={t('hero.textareaPlaceholder')}
        onDualSubmit={handleDualSubmit}
        onGetStarted={handleGetStarted}
      />

      {/* Examples Section - Outside gradient background */}
      <section className="py-16 px-6 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              {t('examples.title')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {examples.map((example, index) => (
                <div
                  key={index}
                  onClick={() => {
                    heroRef.current?.setInputs(example.task, example.sampleInput);
                  }}
                  className="group cursor-pointer bg-card border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10">
                      <example.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(example.category)}`}
                    >
                      {example.category}
                    </span>
                  </div>
                  <h5 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {example.title}
                  </h5>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {example.description}
                  </p>
                  <div className="mt-3 flex items-center text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {t('examples.tryExample')}
                    <svg
                      className="w-3 h-3 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {t('features.title')}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('features.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('features.instant.title')}</h3>
                <p className="text-muted-foreground">
                  {t('features.instant.description')}
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Workflow className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('features.workflow.title')}</h3>
                <p className="text-muted-foreground">
                  {t('features.workflow.description')}
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('features.smarttools.title')}</h3>
                <p className="text-muted-foreground">
                  {t('features.smarttools.description')}
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('features.saveshare.title')}</h3>
                <p className="text-muted-foreground">
                  {t('features.saveshare.description')}
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('features.multiproviders.title')}</h3>
                <p className="text-muted-foreground">
                  {t('features.multiproviders.description')}
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('features.privacy.title')}</h3>
                <p className="text-muted-foreground">
                  {t('features.privacy.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {t('usecases.title')}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('usecases.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card border border-border rounded-lg p-8">
                <h3 className="text-xl font-semibold mb-4">{t('usecases.business.title')}</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('usecases.business.item1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('usecases.business.item2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('usecases.business.item3')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('usecases.business.item4')}</span>
                  </li>
                </ul>
              </div>

              <div className="bg-card border border-border rounded-lg p-8">
                <h3 className="text-xl font-semibold mb-4">{t('usecases.personal.title')}</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('usecases.personal.item1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('usecases.personal.item2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('usecases.personal.item3')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('usecases.personal.item4')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{t('cta.title')}</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            {t('cta.subtitle')}
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-white text-slate-900 px-8 py-4 rounded-lg font-semibold text-base hover:bg-gray-100 transition-colors"
          >
            {tCommon('getStartedNow')}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold">{tCommon('appName')}</span>
            </div>
            <p className="text-muted-foreground">
              {t('footer.copyright', { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </footer>

      {/* Login Dialog */}
      {showLoginDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground mb-4">{tAuth('signIn')}</h2>
              <p className="text-muted-foreground mb-6">
                {tAuth('signInDescription')}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowLoginDialog(false);
                    // Dialog will remain closed, pending conversion stays in store
                  }}
                  className="flex-1 px-4 py-2 text-sm text-muted-foreground border border-input rounded hover:bg-muted/50 transition-colors"
                  disabled={loading}
                >
                  {tCommon('cancel')}
                </button>
                <GoogleSignInButton
                  onClick={handleLoginAndContinue}
                  variant={resolvedTheme === 'dark' ? 'neutral' : 'light'}
                  size="medium"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
