import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIProvider } from './base';
import { GenerateTemplateRequest, GenerateTemplateResponse, AIError } from '../types';

export class GeminiProvider extends BaseAIProvider {
  private genAI: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;
  
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
      } catch {
        // console.error('Failed to parse Gemini response:', text);
        
        // Check if the response was truncated
        if (text && text.length > 1000 && !text.trim().endsWith('}')) {
          throw new AIError(
            'Response was truncated. Please try a simpler prompt or break it into smaller parts.',
            'INVALID_RESPONSE'
          );
        }
        
        throw new AIError('Invalid JSON response from Gemini. Please try again.', 'INVALID_RESPONSE');
      }
      
      // Log the response for debugging
      // console.log('Gemini generated JSON:', JSON.stringify(jsonResponse, null, 2));
      
      // Validate and return
      return this.validateResponse(jsonResponse);
      
    } catch (error) {
      // Re-throw AIErrors
      if (error instanceof AIError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Handle rate limiting
      if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        throw new AIError('Rate limit exceeded. Please try again later.', 'RATE_LIMIT');
      }
      
      // Handle service overload
      if (errorMessage.includes('503') || errorMessage.includes('overloaded')) {
        throw new AIError('The AI service is currently overloaded. Please try again in a few seconds.', 'RATE_LIMIT');
      }
      
      // Wrap other errors
      // console.error('Gemini API error:', error);
      throw new AIError(
        `Gemini API error: ${errorMessage || 'Unknown error'}`,
        'API_ERROR'
      );
    }
  }
}