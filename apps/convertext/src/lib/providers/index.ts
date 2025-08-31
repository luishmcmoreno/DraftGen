export { BaseLLMProvider, type GenerateResponse } from './base';
export { GeminiProvider } from './gemini';
export { MockProvider } from './mock';

import { BaseLLMProvider } from './base';
import { GeminiProvider } from './gemini';
import { MockProvider } from './mock';

export function createProvider(name: string): BaseLLMProvider {
  switch (name.toLowerCase()) {
    case 'gemini':
      return new GeminiProvider();
    case 'mock':
      return new MockProvider();
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}

export function getProviderFromName(name: string): BaseLLMProvider {
  return createProvider(name);
}

export function getProvider(): BaseLLMProvider {
  const providerName = process.env.AI_PROVIDER || 'mock';
  return createProvider(providerName);
}