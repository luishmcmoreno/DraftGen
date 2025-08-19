import { AIProvider } from './types';
import { GeminiProvider } from './providers/gemini';
import { MockProvider } from './providers/mock';

export * from './types';

let providerInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  // Return cached instance if available
  if (providerInstance) {
    return providerInstance;
  }

  const provider = process.env.AI_PROVIDER || 'mock';
  
  switch (provider) {
    case 'gemini':
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        console.warn('GEMINI_API_KEY not found, falling back to mock provider');
        providerInstance = new MockProvider();
      } else {
        console.log('Using Gemini 2.5 Flash provider');
        providerInstance = new GeminiProvider(geminiKey);
      }
      break;
    
    case 'mock':
    default:
      console.log('Using mock provider');
      providerInstance = new MockProvider();
      break;
  }

  return providerInstance;
}