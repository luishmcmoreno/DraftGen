'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { GeneratorContent } from '@/components/GeneratorContent';

export function GeneratorPageClient() {
  const searchParams = useSearchParams();
  const fromAuth = searchParams.get('fromAuth');

  useEffect(() => {
    // Always check sessionStorage for pending prompt
    const pendingPrompt = sessionStorage.getItem('pendingPrompt');
    if (pendingPrompt) {
      sessionStorage.removeItem('pendingPrompt');
      // Small delay to ensure GeneratorContent is ready
      setTimeout(() => {
        const event = new CustomEvent('initialPrompt', { detail: pendingPrompt });
        window.dispatchEvent(event);
      }, 100);
    }
  }, [fromAuth]);

  return <GeneratorContent />;
}
