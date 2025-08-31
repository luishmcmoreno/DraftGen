import { DocumentSchema } from '@/lib/dslValidator';

export interface GenerateTemplateRequest {
  prompt: string;
  existingJson?: DocumentSchema;
}

export interface GenerateTemplateResponse {
  json: DocumentSchema;
}

export interface AIProvider {
  generateTemplate(request: GenerateTemplateRequest): Promise<GenerateTemplateResponse>;
}

export class AIError extends Error {
  constructor(
    message: string,
    public code: 'RATE_LIMIT' | 'INVALID_RESPONSE' | 'API_ERROR' | 'CONFIGURATION_ERROR'
  ) {
    super(message);
    this.name = 'AIError';
  }
}
