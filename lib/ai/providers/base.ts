import { GenerateTemplateRequest, GenerateTemplateResponse, AIProvider } from '../types';
import { validateDsl } from '@/lib/dslValidator';

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
   
   Text content also supports inline markdown:
   - **bold text** or __bold text__
   - *italic text* or _italic text_
   - Can mix: "This is **bold** and *italic* text"

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

RULES:
1. Output ONLY valid JSON, nothing else - no markdown, no explanations
2. The root must have type "document" with a "children" array
3. Variables must use format \${VARIABLE_NAME} in UPPERCASE_SNAKE_CASE
4. DO NOT add empty text nodes { "type": "text", "content": "" } between elements - spacing is handled automatically
5. Use appropriate node types based on content structure:
   - Use lists for enumerations, bullet points, or numbered items
   - Use tables for tabular data, comparisons, or structured information
   - Use grids for side-by-side content or multi-column layouts
   - Use page-break to separate logical sections
6. List items and table columns can contain any valid node types as children
7. Maintain professional document structure and formatting
8. When updating existing templates, preserve structure while incorporating changes

COMPLEX EXAMPLE:
{
  "type": "document",
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
            { "type": "text", "content": "Client: \${CLIENT_NAME}" },
            { "type": "text", "content": "Address: \${CLIENT_ADDRESS}" }
          ]
        },
        {
          "type": "column",
          "children": [
            { "type": "text", "content": "Provider: \${PROVIDER_NAME}" },
            { "type": "text", "content": "Date: \${AGREEMENT_DATE}" }
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

  protected validateResponse(response: any): GenerateTemplateResponse {
    const validation = validateDsl(response);
    
    if (!validation.success) {
      console.error('Validation error details:', validation.error);
      console.error('Invalid node at position:', JSON.stringify(response?.children?.[19], null, 2));
      throw new Error(`Invalid AI response: ${validation.error}`);
    }

    return { json: validation.data! };
  }
}