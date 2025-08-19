import { GenerateTemplateRequest, GenerateTemplateResponse, AIProvider } from '../types';
import { validateDsl } from '@/lib/dslValidator';

export abstract class BaseAIProvider implements AIProvider {
  protected systemPrompt = `You are a document template generator. Your task is to generate valid JSON that matches the following DSL schema:

{
  "type": "document",
  "children": [
    { "type": "text", "content": "Some text content here" }
  ]
}

Rules:
1. Output ONLY valid JSON, nothing else - no markdown, no explanations
2. The root must have type "document" with a "children" array
3. Each child must have type "text" with a "content" string
4. Variables should be in the format \${VARIABLE_NAME} using UPPERCASE_SNAKE_CASE
5. Based on the user's prompt, create appropriate document content
6. If updating an existing template, maintain its structure while incorporating the requested changes
7. Create professional, well-structured documents

Example output:
{
  "type": "document",
  "children": [
    { "type": "text", "content": "Employment Contract for \${EMPLOYEE_NAME}" },
    { "type": "text", "content": "Start Date: \${START_DATE}" },
    { "type": "text", "content": "Position: \${POSITION}" },
    { "type": "text", "content": "Salary: \${SALARY}" }
  ]
}`;

  abstract generateTemplate(request: GenerateTemplateRequest): Promise<GenerateTemplateResponse>;

  protected buildUserPrompt(request: GenerateTemplateRequest): string {
    if (request.existingJson) {
      return `Current template:\n${JSON.stringify(request.existingJson, null, 2)}\n\nUser request: ${request.prompt}`;
    }
    return request.prompt;
  }

  protected validateResponse(response: any): GenerateTemplateResponse {
    const validation = validateDsl(response);
    
    if (!validation.success) {
      throw new Error(`Invalid AI response: ${validation.error}`);
    }

    return { json: validation.data! };
  }
}