import { z } from 'zod'

export const TextNode = z.object({
  type: z.literal('text'),
  content: z.string(),
})

export const PageBreakNode = z.object({
  type: z.literal('page-break'),
})

export const NodeType = z.union([TextNode, PageBreakNode])

export const DocumentNode = z.object({
  type: z.literal('document'),
  children: z.array(NodeType),
})

export type TextNodeType = z.infer<typeof TextNode>
export type PageBreakNodeType = z.infer<typeof PageBreakNode>
export type DocumentSchema = z.infer<typeof DocumentNode>

export function validateDsl(json: unknown): { success: boolean; data?: DocumentSchema; error?: string } {
  try {
    const result = DocumentNode.parse(json);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      };
    }
    return { success: false, error: 'Invalid JSON structure' };
  }
}