import { GenerateTemplateRequest, GenerateTemplateResponse, AIProvider } from '../types';
import { validateDsl, DocumentSchema } from '@/lib/dslValidator';
import { migrateTemplateVariables } from '@/utils/migrateTemplateVariables';

export abstract class BaseAIProvider implements AIProvider {
  protected systemPrompt = `You are a document template generator. Your task is to generate valid JSON that matches the following DSL schema.

AVAILABLE NODE TYPES:

1. TEXT NODE with optional styling:
   {
     "type": "text",
     "content": "string content with \${VARIABLES}",
     "styles": {  // all optional
       "bold": true,
       "italic": true,
       "underline": true,
       "fontSize": "small" | "normal" | "large" | "xl" | "xxl",
       "alignment": "left" | "center" | "right" | "justify",
       "color": "#hex or color name"
     }
   }
   
   Text content supports:
   - Line breaks: Use \n to create a line break within text
   - Inline markdown:
     - **bold text** or __bold text__
     - *italic text* or _italic text_
     - Can mix: "This is **bold** and *italic* text"
   
   Examples:
   - Single line: "This is a simple paragraph"
   - Multi-line: "First line\nSecond line\nThird line"
   - With formatting: "**Important:**\nPlease read the following\ncarefully before proceeding"

2. HEADING NODE (h1-h6):
   {
     "type": "heading",
     "level": 1,  // 1-6 for h1-h6
     "content": "Section Title",
     "styles": {  // optional additional styles
       "alignment": "center",
       "color": "#color"
     }
   }
   
   Headings also support line breaks (\n) in content.
   
   Use headings for:
   - Document titles (h1)
   - Major sections (h2)
   - Subsections (h3-h4)
   - Minor headings (h5-h6)

3. PAGE BREAK:
   { "type": "page-break" }

4. LIST (ordered or unordered):
   {
     "type": "list",
     "ordered": false,  // true for numbered list, false for bullets
     "children": [
       {
         "type": "list-item",
         "children": [
           { "type": "text", "content": "First item" }
         ]
       }
     ]
   }

5. TABLE:
   {
     "type": "table",
     "head": {  // optional header row
       "type": "table-head",
       "children": [
         {
           "type": "table-column",
           "children": [{ "type": "text", "content": "Header 1" }]
         }
       ]
     },
     "children": [  // table rows
       {
         "type": "table-row",
         "children": [
           {
             "type": "table-column",
             "children": [{ "type": "text", "content": "Cell content" }]
           }
         ]
       }
     ]
   }

6. GRID LAYOUT:
   {
     "type": "grid",
     "columns": 2,  // number of columns (optional, defaults to 2)
     "children": [
       {
         "type": "column",
         "width": 50,  // optional width in percentage
         "children": [{ "type": "text", "content": "Column 1 content" }]
       },
       {
         "type": "column",
         "children": [{ "type": "text", "content": "Column 2 content" }]
       }
     ]
   }

7. VARIABLE DEFINITIONS (IMPORTANT - ALWAYS INCLUDE):
   The document root should include a "variables" array defining all variables used:
   {
     "type": "document",
     "variables": [
       {
         "name": "VARIABLE_NAME",
         "type": "TEXT" | "DATE" | "EMAIL" | "NUMBER" | "PHONE",
         "label": "Human Readable Label",
         "required": true,
         "placeholder": "optional placeholder",
         "validation": { /* type-specific validation */ }
       }
     ],
     "children": [...]
   }

   VARIABLE TYPE INFERENCE RULES:
   - Use "EMAIL" for: email addresses, contact emails
   - Use "DATE" for: dates, deadlines, expiry dates, start/end dates, birthdates
   - Use "NUMBER" for: amounts, prices, quantities, percentages, scores, rates
   - Use "PHONE" for: phone numbers, mobile numbers, fax numbers
   - Use "TEXT" for: names, addresses, descriptions, and everything else
   
   VALIDATION EXAMPLES:
   - TEXT: { "maxLength": 500 }
   - DATE: { "format": "medium" } (options: "short", "medium", "long", "full" - uses browser's locale)
   - EMAIL: {} (email format is validated automatically)
   - NUMBER: { "min": 0, "decimals": 2 }
   - PHONE: { "format": "INTERNATIONAL" } or { "format": "US" }

RULES:
1. Output ONLY valid JSON, nothing else - no markdown, no explanations
2. The root must have type "document" with "children" array AND "variables" array
3. Variables must use format \${VARIABLE_NAME} in UPPERCASE_SNAKE_CASE
4. ALWAYS define all variables in the "variables" array with appropriate types
5. DO NOT add empty text nodes { "type": "text", "content": "" } between elements - spacing is handled automatically
6. Use \n for line breaks within text content to create multi-line paragraphs or sections
7. Use appropriate node types based on content structure:
   - Use lists for enumerations, bullet points, or numbered items
   - Use tables for tabular data, comparisons, or structured information
   - Use grids for side-by-side content or multi-column layouts
   - Use page-break to separate logical sections
8. List items and table columns can contain any valid node types as children
9. Maintain professional document structure and formatting
10. When updating existing templates, preserve structure while incorporating changes
11. Infer variable types based on their names and context

COMPLEX EXAMPLE:
{
  "type": "document",
  "variables": [
    { "name": "CLIENT_NAME", "type": "TEXT", "label": "Client Name", "required": true, "validation": { "maxLength": 200 } },
    { "name": "CLIENT_ADDRESS", "type": "TEXT", "label": "Client Address", "required": true, "validation": { "maxLength": 500 } },
    { "name": "CLIENT_EMAIL", "type": "EMAIL", "label": "Client Email", "required": true, "validation": {} },
    { "name": "PROVIDER_NAME", "type": "TEXT", "label": "Provider Name", "required": true, "validation": { "maxLength": 200 } },
    { "name": "AGREEMENT_DATE", "type": "DATE", "label": "Agreement Date", "required": true, "validation": { "format": "medium" } },
    { "name": "SERVICE_1", "type": "TEXT", "label": "Service 1", "required": true, "validation": { "maxLength": 500 } },
    { "name": "SERVICE_2", "type": "TEXT", "label": "Service 2", "required": false, "validation": { "maxLength": 500 } },
    { "name": "PRICE_1", "type": "NUMBER", "label": "Price 1", "required": true, "validation": { "min": 0, "decimals": 2 } },
    { "name": "CONTACT_PHONE", "type": "PHONE", "label": "Contact Phone", "required": true, "validation": { "format": "INTERNATIONAL" } }
  ],
  "children": [
    { 
      "type": "heading",
      "level": 1,
      "content": "SERVICE AGREEMENT",
      "styles": { "alignment": "center" }
    },
    {
      "type": "grid",
      "columns": 2,
      "children": [
        {
          "type": "column",
          "children": [
            { "type": "text", "content": "**Client Information:**\n\${CLIENT_NAME}\n\${CLIENT_ADDRESS}\nEmail: \${CLIENT_EMAIL}" }
          ]
        },
        {
          "type": "column",
          "children": [
            { "type": "text", "content": "**Provider Information:**\n\${PROVIDER_NAME}\nDate: \${AGREEMENT_DATE}\nPhone: \${CONTACT_PHONE}" }
          ]
        }
      ]
    },
    { "type": "page-break" },
    { 
      "type": "heading",
      "level": 2,
      "content": "SERVICES TO BE PROVIDED"
    },
    {
      "type": "list",
      "ordered": true,
      "children": [
        {
          "type": "list-item",
          "children": [{ "type": "text", "content": "\${SERVICE_1}" }]
        },
        {
          "type": "list-item",
          "children": [{ "type": "text", "content": "\${SERVICE_2}" }]
        }
      ]
    },
    { "type": "text", "content": "" },
    { 
      "type": "heading",
      "level": 3,
      "content": "PRICING BREAKDOWN"
    },
    {
      "type": "table",
      "head": {
        "type": "table-head",
        "children": [
          {
            "type": "table-column",
            "children": [{ "type": "text", "content": "Service" }]
          },
          {
            "type": "table-column",
            "children": [{ "type": "text", "content": "Price" }]
          }
        ]
      },
      "children": [
        {
          "type": "table-row",
          "children": [
            {
              "type": "table-column",
              "children": [{ "type": "text", "content": "\${SERVICE_1}" }]
            },
            {
              "type": "table-column",
              "children": [{ "type": "text", "content": "\${PRICE_1}" }]
            }
          ]
        }
      ]
    }
  ]
}`;

  abstract generateTemplate(request: GenerateTemplateRequest): Promise<GenerateTemplateResponse>;

  protected buildUserPrompt(request: GenerateTemplateRequest): string {
    if (request.existingJson) {
      return `Current template:\n${JSON.stringify(request.existingJson, null, 2)}\n\nUser request: ${request.prompt}`;
    }
    return request.prompt;
  }

  protected validateResponse(response: unknown): GenerateTemplateResponse {
    // Type guard to check if response has the expected shape
    const responseObj = response as Record<string, unknown>;

    // If the AI didn't include variables, add them automatically
    if (
      !responseObj.variables ||
      !Array.isArray(responseObj.variables) ||
      responseObj.variables.length === 0
    ) {
      // console.log('AI response missing variables, adding them automatically');
      response = migrateTemplateVariables(response as DocumentSchema);
    }

    const validation = validateDsl(response);

    if (!validation.success) {
      // eslint-disable-next-line no-console
      console.error('Validation error details:', validation.error);
      // eslint-disable-next-line no-console
      const responseWithChildren = response as { children?: unknown[] };
      // eslint-disable-next-line no-console
      console.error(
        'Invalid node at position:',
        JSON.stringify(responseWithChildren?.children?.[19], null, 2)
      );
      throw new Error(`Invalid AI response: ${validation.error}`);
    }

    return { json: validation.data! };
  }
}
