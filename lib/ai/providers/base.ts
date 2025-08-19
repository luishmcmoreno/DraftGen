import { GenerateTemplateRequest, GenerateTemplateResponse, AIProvider } from '../types';
import { validateDsl } from '@/lib/dslValidator';

export abstract class BaseAIProvider implements AIProvider {
  protected systemPrompt = `You are a document template generator. Your task is to generate valid JSON that matches the following DSL schema:

{
  "type": "document",
  "children": [
    { "type": "text", "content": "Some text content here" },
    { "type": "page-break" },
    { "type": "text", "content": "Content on next page" }
  ]
}

Rules:
1. Output ONLY valid JSON, nothing else - no markdown, no explanations
2. The root must have type "document" with a "children" array
3. Children can be either:
   - { "type": "text", "content": "string" } for text content
   - { "type": "page-break" } to start a new page
4. Variables should be in the format \${VARIABLE_NAME} using UPPERCASE_SNAKE_CASE
5. Use page-break nodes to separate logical sections (e.g., between contract clauses, appendices, etc.)
6. For longer documents (contracts, agreements), use page breaks to improve readability
7. If updating an existing template, maintain its structure while incorporating the requested changes
8. Create professional, well-structured documents

Example multi-page output:
{
  "type": "document",
  "children": [
    { "type": "text", "content": "EMPLOYMENT CONTRACT" },
    { "type": "text", "content": "" },
    { "type": "text", "content": "This Employment Agreement is entered into as of \${START_DATE}" },
    { "type": "text", "content": "Between: \${COMPANY_NAME} (\"Employer\")" },
    { "type": "text", "content": "And: \${EMPLOYEE_NAME} (\"Employee\")" },
    { "type": "page-break" },
    { "type": "text", "content": "1. POSITION AND DUTIES" },
    { "type": "text", "content": "Position: \${POSITION}" },
    { "type": "text", "content": "Start Date: \${START_DATE}" },
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