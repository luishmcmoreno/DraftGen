'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { GeneratorContent } from '@/components/GeneratorContent';

export function GeneratorPageClient() {
  const searchParams = useSearchParams();
  const fromAuth = searchParams.get('fromAuth');
  const directPrompt = searchParams.get('prompt');

  useEffect(() => {
    // If coming from auth, check for pending prompt in sessionStorage
    if (fromAuth === 'true') {
      const pendingPrompt = sessionStorage.getItem('pendingPrompt');
      if (pendingPrompt) {
        // Trigger the prompt in GeneratorContent
        // We'll need to pass this as a prop
        sessionStorage.removeItem('pendingPrompt');
        // Set initial prompt for GeneratorContent
        const event = new CustomEvent('initialPrompt', { detail: pendingPrompt });
        window.dispatchEvent(event);
      }
    } else if (directPrompt) {
      // If there's a direct prompt in the URL (authenticated users from landing page)
      const event = new CustomEvent('initialPrompt', { detail: decodeURIComponent(directPrompt) });
      window.dispatchEvent(event);
    }
  }, [fromAuth, directPrompt]);

  return <GeneratorContent />;
}