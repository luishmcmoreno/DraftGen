import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIProvider } from './base';
import { GenerateTemplateRequest, GenerateTemplateResponse, AIError } from '../types';

export class GeminiProvider extends BaseAIProvider {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    super();
    
    if (!apiKey) {
      throw new AIError('Gemini API key is required', 'CONFIGURATION_ERROR');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // Using Gemini 2.5 Flash with JSON output mode
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json', // Force JSON output
      },
    });
  }

  async generateTemplate(request: GenerateTemplateRequest): Promise<GenerateTemplateResponse> {
    try {
      const userPrompt = this.buildUserPrompt(request);
      
      // Combine system prompt and user prompt
      const fullPrompt = `${this.systemPrompt}\n\nUser request: ${userPrompt}`;
      
      // Generate content
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      let jsonResponse;
      try {
        jsonResponse = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', text);
        throw new AIError('Invalid JSON response from Gemini', 'INVALID_RESPONSE');
      }
      
      // Validate and return
      return this.validateResponse(jsonResponse);
      
    } catch (error: any) {
      // Handle rate limiting
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        throw new AIError('Rate limit exceeded. Please try again later.', 'RATE_LIMIT');
      }
      
      // Re-throw AIErrors
      if (error instanceof AIError) {
        throw error;
      }
      
      // Wrap other errors
      console.error('Gemini API error:', error);
      throw new AIError(
        `Gemini API error: ${error.message || 'Unknown error'}`,
        'API_ERROR'
      );
    }
  }
}