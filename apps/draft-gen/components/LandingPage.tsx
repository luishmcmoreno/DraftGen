'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { useTheme } from './ThemeProvider';
import {
  HeroSection,
  HeroSectionRef,
  FeaturesGrid,
  NavigationHeader,
  Footer,
  Button,
  Card,
  GoogleSignInButton,
} from '@draft-gen/ui';
import { 
  FileText, 
  Zap, 
  Users, 
  Shield, 
  Globe, 
  Workflow, 
  ArrowRight,
  FileCheck,
  Receipt,
  Scale,
  Mail,
  Briefcase,
  Award,
  FileSignature,
  Building
} from 'lucide-react';

interface LandingPageProps {
  isAuthenticated: boolean;
  locale: string;
}

export default function LandingPage({ isAuthenticated, locale }: LandingPageProps) {
  const t = useTranslations('landing');
  const tCommon = useTranslations('common');
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [, setPrompt] = useState('');
  const heroRef = useRef<HeroSectionRef>(null);

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

  const examples = [
    {
      title: t('examples.employmentContract.title'),
      description: t('examples.employmentContract.description'),
      prompt: t('examples.employmentContract.prompt'),
      sampleTemplate: t('examples.employmentContract.sampleTemplate'),
      icon: FileSignature,
      category: 'Contracts',
    },
    {
      title: t('examples.invoice.title'),
      description: t('examples.invoice.description'),
      prompt: t('examples.invoice.prompt'),
      sampleTemplate: t('examples.invoice.sampleTemplate'),
      icon: Receipt,
      category: 'Business',
    },
    {
      title: t('examples.serviceAgreement.title'),
      description: t('examples.serviceAgreement.description'),
      prompt: t('examples.serviceAgreement.prompt'),
      sampleTemplate: t('examples.serviceAgreement.sampleTemplate'),
      icon: FileCheck,
      category: 'Contracts',
    },
    {
      title: t('examples.businessProposal.title'),
      description: t('examples.businessProposal.description'),
      prompt: t('examples.businessProposal.prompt'),
      sampleTemplate: t('examples.businessProposal.sampleTemplate'),
      icon: Briefcase,
      category: 'Business',
    },
    {
      title: t('examples.legalNotice.title'),
      description: t('examples.legalNotice.description'),
      prompt: t('examples.legalNotice.prompt'),
      sampleTemplate: t('examples.legalNotice.sampleTemplate'),
      icon: Scale,
      category: 'Legal',
    },
    {
      title: t('examples.businessLetter.title'),
      description: t('examples.businessLetter.description'),
      prompt: t('examples.businessLetter.prompt'),
      sampleTemplate: t('examples.businessLetter.sampleTemplate'),
      icon: Mail,
      category: 'Personal',
    },
    {
      title: t('examples.certificate.title'),
      description: t('examples.certificate.description'),
      prompt: t('examples.certificate.prompt'),
      sampleTemplate: t('examples.certificate.sampleTemplate'),
      icon: Award,
      category: 'Personal',
    },
    {
      title: t('examples.companyPolicy.title'),
      description: t('examples.companyPolicy.description'),
      prompt: t('examples.companyPolicy.prompt'),
      sampleTemplate: t('examples.companyPolicy.sampleTemplate'),
      icon: Building,
      category: 'Business',
    },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Contracts':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800';
      case 'Business':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800';
      case 'Legal':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-800';
      case 'Personal':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-300 dark:border-orange-800';
      default:
        return 'bg-muted/50 text-muted-foreground border-border';
    }
  };

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
        ref={heroRef}
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
        ctaText={t('hero.createButton')}
        onSubmit={handlePromptSubmit}
        onGetStarted={handleGetStarted}
      />

      {/* Examples Section */}
      <section className="py-16 px-6 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              {t('examples.sectionTitle')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {examples.map((example, index) => (
                <div
                  key={index}
                  onClick={() => {
                    heroRef.current?.setMessage(example.prompt);
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
                      {t(`examples.categories.${example.category.toLowerCase()}`)}
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
