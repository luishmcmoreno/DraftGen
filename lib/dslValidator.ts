import { z } from 'zod'

// Text style properties
export const TextStyles = z.object({
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  fontSize: z.enum(['small', 'normal', 'large', 'xl', 'xxl']).optional(),
  alignment: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(), // Hex color or named color
})

// Basic content nodes
export const TextNode = z.object({
  type: z.literal('text'),
  content: z.string(),
  styles: TextStyles.optional(),
})

export const HeadingNode = z.object({
  type: z.literal('heading'),
  level: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ]),
  content: z.string(),
  styles: TextStyles.optional(), // Optional additional styles
})

export const PageBreakNode = z.object({
  type: z.literal('page-break'),
})

// List nodes
export const ListItemNode: z.ZodType<any> = z.lazy(() => z.object({
  type: z.literal('list-item'),
  children: z.array(NodeTypeSchema),
}))

export const ListNode = z.object({
  type: z.literal('list'),
  ordered: z.boolean().optional().default(false),
  children: z.array(ListItemNode),
})

// Table nodes
export const TableColumnNode: z.ZodType<any> = z.lazy(() => z.object({
  type: z.literal('table-column'),
  children: z.array(NodeTypeSchema),
}))

export const TableHeadNode = z.object({
  type: z.literal('table-head'),
  children: z.array(TableColumnNode),
})

export const TableRowNode = z.object({
  type: z.literal('table-row'),
  children: z.array(TableColumnNode),
})

export const TableNode = z.object({
  type: z.literal('table'),
  head: TableHeadNode.optional(),
  children: z.array(TableRowNode),
})

// Grid nodes
export const ColumnNode: z.ZodType<any> = z.lazy(() => z.object({
  type: z.literal('column'),
  width: z.number().optional(), // Width in percentage (1-100)
  children: z.array(NodeTypeSchema),
}))

export const GridNode = z.object({
  type: z.literal('grid'),
  columns: z.number().optional().default(2), // Number of columns
  children: z.array(ColumnNode),
})

export const NodeTypeSchema: z.ZodType<any> = z.lazy(() => 
  z.union([
    TextNode,
    HeadingNode,
    PageBreakNode, 
    ListNode, 
    ListItemNode,
    TableNode,
    TableHeadNode,
    TableRowNode,
    TableColumnNode,
    GridNode,
    ColumnNode,
  ])
)

export const DocumentNode = z.object({
  type: z.literal('document'),
  children: z.array(NodeTypeSchema),
})

// Type exports
export type TextStylesType = z.infer<typeof TextStyles>
export type TextNodeType = z.infer<typeof TextNode>
export type HeadingNodeType = z.infer<typeof HeadingNode>
export type PageBreakNodeType = z.infer<typeof PageBreakNode>
export type ListNodeType = z.infer<typeof ListNode>
export type ListItemNodeType = z.infer<typeof ListItemNode>
export type TableNodeType = z.infer<typeof TableNode>
export type TableHeadNodeType = z.infer<typeof TableHeadNode>
export type TableRowNodeType = z.infer<typeof TableRowNode>
export type TableColumnNodeType = z.infer<typeof TableColumnNode>
export type GridNodeType = z.infer<typeof GridNode>
export type ColumnNodeType = z.infer<typeof ColumnNode>

export type NodeType = 
  | TextNodeType
  | HeadingNodeType
  | PageBreakNodeType
  | ListNodeType
  | ListItemNodeType
  | TableNodeType
  | TableHeadNodeType
  | TableRowNodeType
  | TableColumnNodeType
  | GridNodeType
  | ColumnNodeType

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