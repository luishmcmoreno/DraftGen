import { z } from 'zod';

// Node type enum for type safety
export enum NodeTypeEnum {
  TEXT = 'text',
  HEADING = 'heading',
  PAGE_BREAK = 'page-break',
  LIST = 'list',
  LIST_ITEM = 'list-item',
  TABLE = 'table',
  TABLE_HEAD = 'table-head',
  TABLE_ROW = 'table-row',
  TABLE_COLUMN = 'table-column',
  GRID = 'grid',
  COLUMN = 'column',
  DOCUMENT = 'document'
}

// Variable type enum
export const VariableType = z.enum(['TEXT', 'DATE', 'EMAIL', 'NUMBER', 'PHONE']);

// Validation rules for different variable types
export const TextValidation = z.object({
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(), // Regex pattern
});

export const DateValidation = z.object({
  minDate: z.string().optional(), // ISO date string
  maxDate: z.string().optional(), // ISO date string
  format: z.enum(['short', 'medium', 'long', 'full']).optional(), // Date display style using browser's locale
});

export const NumberValidation = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  decimals: z.number().optional(),
  step: z.number().optional(),
});

export const PhoneValidation = z.object({
  format: z.enum(['US', 'INTERNATIONAL']).optional(),
  country: z.string().optional(), // ISO country code
});

// Email doesn't need specific validation beyond the type itself
export const EmailValidation = z.object({
  domains: z.array(z.string()).optional(), // Allowed domains
});

// Variable definition schema
export const VariableDefinition = z.object({
  name: z.string(),
  type: VariableType,
  label: z.string().optional(),
  required: z.boolean().optional().default(true),
  defaultValue: z.string().optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  validation: z
    .union([
      TextValidation,
      DateValidation,
      NumberValidation,
      PhoneValidation,
      EmailValidation,
      z.object({}), // Allow empty object for no validation
    ])
    .optional(),
});

// Text style properties
export const TextStyles = z.object({
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  fontSize: z.enum(['small', 'normal', 'large', 'xl', 'xxl']).optional(),
  alignment: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(), // Hex color or named color
});

// Basic content nodes
export const TextNode = z.object({
  type: z.literal(NodeTypeEnum.TEXT),
  content: z.string(),
  styles: TextStyles.optional(),
});

export const HeadingNode = z.object({
  type: z.literal(NodeTypeEnum.HEADING),
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
});

export const PageBreakNode = z.object({
  type: z.literal(NodeTypeEnum.PAGE_BREAK),
});

// Forward declare the types to handle recursion
// These need to match the actual inferred types exactly
type ListNodeType = {
  type: NodeTypeEnum.LIST;
  ordered?: boolean;
  children: ListItemNodeType[];
};

type ListItemNodeType = {
  type: NodeTypeEnum.LIST_ITEM;
  children: NodeType[];
};

type TableColumnNodeType = {
  type: NodeTypeEnum.TABLE_COLUMN;
  children: NodeType[];
};

type GridNodeType = {
  type: NodeTypeEnum.GRID;
  columns?: number;
  children: ColumnNodeType[];
};

type ColumnNodeType = {
  type: NodeTypeEnum.COLUMN;
  width?: number;
  children: NodeType[];
};

// List nodes
export const ListItemNode: z.ZodType<ListItemNodeType> = z.lazy(() =>
  z.object({
    type: z.literal(NodeTypeEnum.LIST_ITEM),
    children: z.array(NodeTypeSchema),
  })
);

export const ListNode = z.object({
  type: z.literal(NodeTypeEnum.LIST),
  ordered: z.boolean().optional().default(false),
  children: z.array(ListItemNode),
});

// Table nodes
export const TableColumnNode: z.ZodType<TableColumnNodeType> = z.lazy(() =>
  z.object({
    type: z.literal(NodeTypeEnum.TABLE_COLUMN),
    children: z.array(NodeTypeSchema),
  })
);

export const TableHeadNode = z.object({
  type: z.literal(NodeTypeEnum.TABLE_HEAD),
  children: z.array(TableColumnNode),
});

export const TableRowNode = z.object({
  type: z.literal(NodeTypeEnum.TABLE_ROW),
  children: z.array(TableColumnNode),
});

export const TableNode = z.object({
  type: z.literal(NodeTypeEnum.TABLE),
  head: TableHeadNode.optional(),
  children: z.array(TableRowNode),
});

// Grid nodes
export const ColumnNode: z.ZodType<ColumnNodeType> = z.lazy(() =>
  z.object({
    type: z.literal(NodeTypeEnum.COLUMN),
    width: z.number().optional(), // Width in percentage (1-100)
    children: z.array(NodeTypeSchema),
  })
);

export const GridNode = z.object({
  type: z.literal(NodeTypeEnum.GRID),
  columns: z.number().optional().default(2), // Number of columns
  children: z.array(ColumnNode),
});

export const NodeTypeSchema = z.lazy(() =>
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
);

export const DocumentNode = z.object({
  type: z.literal(NodeTypeEnum.DOCUMENT),
  children: z.array(NodeTypeSchema),
  variables: z.array(VariableDefinition).optional(), // Optional for backward compatibility
});

// Type exports
export type VariableTypeEnum = z.infer<typeof VariableType>;
export type VariableDefinitionType = z.infer<typeof VariableDefinition>;
export type TextValidationType = z.infer<typeof TextValidation>;
export type DateValidationType = z.infer<typeof DateValidation>;
export type NumberValidationType = z.infer<typeof NumberValidation>;
export type PhoneValidationType = z.infer<typeof PhoneValidation>;
export type EmailValidationType = z.infer<typeof EmailValidation>;

export type TextStylesType = z.infer<typeof TextStyles>;
export type TextNodeType = z.infer<typeof TextNode>;
export type HeadingNodeType = z.infer<typeof HeadingNode>;
export type PageBreakNodeType = z.infer<typeof PageBreakNode>;
// ListNodeType, ListItemNodeType, TableColumnNodeType, GridNodeType, and ColumnNodeType 
// are already forward declared above for recursion handling
export type TableNodeType = z.infer<typeof TableNode>;
export type TableHeadNodeType = z.infer<typeof TableHeadNode>;
export type TableRowNodeType = z.infer<typeof TableRowNode>;

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
  | ColumnNodeType;

export type DocumentSchema = z.infer<typeof DocumentNode>;

// Type guard functions for runtime type checking with TypeScript type narrowing
export function isTextNode(node: NodeType): node is TextNodeType {
  return node.type === NodeTypeEnum.TEXT;
}

export function isHeadingNode(node: NodeType): node is HeadingNodeType {
  return node.type === NodeTypeEnum.HEADING;
}

export function isPageBreakNode(node: NodeType): node is PageBreakNodeType {
  return node.type === NodeTypeEnum.PAGE_BREAK;
}

export function isListNode(node: NodeType): node is ListNodeType {
  return node.type === NodeTypeEnum.LIST;
}

export function isListItemNode(node: NodeType): node is ListItemNodeType {
  return node.type === NodeTypeEnum.LIST_ITEM;
}

export function isTableNode(node: NodeType): node is TableNodeType {
  return node.type === NodeTypeEnum.TABLE;
}

export function isTableHeadNode(node: NodeType): node is TableHeadNodeType {
  return node.type === NodeTypeEnum.TABLE_HEAD;
}

export function isTableRowNode(node: NodeType): node is TableRowNodeType {
  return node.type === NodeTypeEnum.TABLE_ROW;
}

export function isTableColumnNode(node: NodeType): node is TableColumnNodeType {
  return node.type === NodeTypeEnum.TABLE_COLUMN;
}

export function isGridNode(node: NodeType): node is GridNodeType {
  return node.type === NodeTypeEnum.GRID;
}

export function isColumnNode(node: NodeType): node is ColumnNodeType {
  return node.type === NodeTypeEnum.COLUMN;
}

// Higher-level semantic type guard functions
// Check if node has direct content property (text or heading)
export function isDirectContentNode(node: NodeType): node is TextNodeType | HeadingNodeType {
  return isTextNode(node) || isHeadingNode(node);
}

// Check if node is a container that wraps text content
export function isTextContainerNode(node: NodeType): node is ListItemNodeType | TableColumnNodeType | ColumnNodeType {
  return isListItemNode(node) || isTableColumnNode(node) || isColumnNode(node);
}

export function validateDsl(json: unknown): {
  success: boolean;
  data?: DocumentSchema;
  error?: string;
} {
  try {
    const result = DocumentNode.parse(json);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }
    return { success: false, error: 'Invalid JSON structure' };
  }
}
