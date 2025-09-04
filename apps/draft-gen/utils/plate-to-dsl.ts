import { type Value } from '@draft-gen/ui';
import {
  DocumentSchema,
  NodeType,
  NodeTypeEnum,
  TextNodeType,
  HeadingNodeType,
  ListNodeType,
  ListItemNodeType,
  TableNodeType,
  TableHeadNodeType,
  TableRowNodeType,
  TableColumnNodeType,
  GridNodeType,
  ColumnNodeType,
  PageBreakNodeType,
  TextStylesType,
} from '@/lib/dslValidator';

// Plate.js element types (matching dsl-to-plate.ts)
const ELEMENT_TYPES = {
  PARAGRAPH: 'p',
  HEADING_1: 'h1',
  HEADING_2: 'h2',
  HEADING_3: 'h3',
  HEADING_4: 'h4',
  HEADING_5: 'h5',
  HEADING_6: 'h6',
  LIST_ITEM: 'li',
  ORDERED_LIST: 'ol',
  UNORDERED_LIST: 'ul',
  TABLE: 'table',
  TABLE_ROW: 'tr',
  TABLE_CELL: 'td',
  TABLE_HEADER_CELL: 'th',
  HORIZONTAL_RULE: 'hr',
  COLUMN: 'column',
  BLOCKQUOTE: 'blockquote',
  MENTION: 'mention',
} as const;

// Plate.js mark types
const MARK_TYPES = {
  BOLD: 'bold',
  ITALIC: 'italic',
  UNDERLINE: 'underline',
  CODE: 'code',
} as const;

type PlateNode = {
  type?: string;
  text?: string;
  children?: PlateNode[];
  [key: string]: unknown;
};

/**
 * Extract text content and marks from a Plate text node
 */
function extractTextAndMarks(node: PlateNode): { content: string; styles?: TextStylesType } {
  if (!node.text) {
    return { content: '' };
  }

  let content = node.text;
  const styles: TextStylesType = {};

  // Check for marks and convert to markdown syntax
  if (node[MARK_TYPES.BOLD]) {
    content = `**${content}**`;
    styles.bold = true;
  }

  if (node[MARK_TYPES.ITALIC]) {
    content = `*${content}*`;
    styles.italic = true;
  }

  if (node[MARK_TYPES.UNDERLINE]) {
    styles.underline = true;
  }

  // Note: 'code' mark could be handled separately if needed
  // For now we skip it as it's not in the TextStyles type

  // Return content with styles only if there are styles
  if (Object.keys(styles).length > 0) {
    return { content, styles };
  }

  return { content };
}

/**
 * Extract all text from plate children and combine
 */
function extractTextFromChildren(children: PlateNode[]): {
  content: string;
  styles?: TextStylesType;
} {
  if (!children || children.length === 0) {
    return { content: '' };
  }

  const textParts: string[] = [];
  let hasStyles = false;
  const combinedStyles: TextStylesType = {};

  children.forEach((child) => {
    // Handle mention elements (variables)
    if (child.type === ELEMENT_TYPES.MENTION) {
      const variableName = (child.value as string) || child.children?.[0]?.text || '';
      // Extract just the variable name if it's in the full format
      const cleanName =
        typeof variableName === 'string' ? variableName.replace(/^\$\{|\}$/g, '') : variableName;
      textParts.push(`\${${cleanName}}`);
    } else if (child.text !== undefined) {
      const { content, styles } = extractTextAndMarks(child);
      textParts.push(content);

      if (styles) {
        hasStyles = true;
        // Merge styles (for now we'll use the first set of styles we encounter)
        Object.assign(combinedStyles, styles);
      }
    } else if (child.children) {
      // Recursively extract from nested children
      const { content } = extractTextFromChildren(child.children);
      textParts.push(content);
    }
  });

  const finalContent = textParts.join('');

  if (hasStyles) {
    return { content: finalContent, styles: combinedStyles };
  }

  return { content: finalContent };
}

/**
 * Convert a Plate paragraph to DSL text node
 */
function convertParagraphNode(node: PlateNode): TextNodeType {
  const { content, styles } = extractTextFromChildren(node.children || []);

  const textNode: TextNodeType = {
    type: NodeTypeEnum.TEXT,
    content,
  };

  if (styles && Object.keys(styles).length > 0) {
    textNode.styles = styles;
  }

  return textNode;
}

/**
 * Convert a Plate heading to DSL heading node
 */
function convertHeadingNode(node: PlateNode): HeadingNodeType {
  const levelMap: Record<string, 1 | 2 | 3 | 4 | 5 | 6> = {
    [ELEMENT_TYPES.HEADING_1]: 1,
    [ELEMENT_TYPES.HEADING_2]: 2,
    [ELEMENT_TYPES.HEADING_3]: 3,
    [ELEMENT_TYPES.HEADING_4]: 4,
    [ELEMENT_TYPES.HEADING_5]: 5,
    [ELEMENT_TYPES.HEADING_6]: 6,
  };

  const { content, styles } = extractTextFromChildren(node.children || []);

  const headingNode: HeadingNodeType = {
    type: NodeTypeEnum.HEADING,
    level: levelMap[node.type!] || 1,
    content,
  };

  if (styles && Object.keys(styles).length > 0) {
    headingNode.styles = styles;
  }

  return headingNode;
}

/**
 * Convert a Plate list to DSL list node
 */
function convertListNode(node: PlateNode): ListNodeType {
  const isOrdered = node.type === ELEMENT_TYPES.ORDERED_LIST;

  const listItems: ListItemNodeType[] = [];

  if (node.children) {
    node.children.forEach((child) => {
      if (child.type === ELEMENT_TYPES.LIST_ITEM) {
        const itemChildren: NodeType[] = [];

        if (child.children) {
          child.children.forEach((grandchild) => {
            const converted = convertPlateNode(grandchild);
            if (converted) {
              itemChildren.push(converted);
            }
          });
        }

        // If no children, add empty text node
        if (itemChildren.length === 0) {
          itemChildren.push({
            type: NodeTypeEnum.TEXT,
            content: '',
          });
        }

        listItems.push({
          type: NodeTypeEnum.LIST_ITEM,
          children: itemChildren,
        });
      }
    });
  }

  const listNode: ListNodeType = {
    type: NodeTypeEnum.LIST,
    ordered: isOrdered, // Always explicitly set
    children: listItems,
  };

  return listNode;
}

/**
 * Convert a Plate table to DSL table node
 */
function convertTableNode(node: PlateNode): TableNodeType {
  let headNode: TableHeadNodeType | undefined;
  const bodyRows: TableRowNodeType[] = [];

  if (node.children) {
    node.children.forEach((row, rowIndex) => {
      if (row.type === ELEMENT_TYPES.TABLE_ROW && row.children) {
        const columns: TableColumnNodeType[] = [];
        let isHeaderRow = false;

        row.children.forEach((cell) => {
          if (cell.type === ELEMENT_TYPES.TABLE_HEADER_CELL) {
            isHeaderRow = true;
          }

          const columnChildren: NodeType[] = [];

          if (cell.children) {
            cell.children.forEach((cellChild) => {
              const converted = convertPlateNode(cellChild);
              if (converted) {
                columnChildren.push(converted);
              }
            });
          }

          // If no children, add empty text node
          if (columnChildren.length === 0) {
            columnChildren.push({
              type: NodeTypeEnum.TEXT,
              content: '',
            });
          }

          columns.push({
            type: NodeTypeEnum.TABLE_COLUMN,
            children: columnChildren,
          });
        });

        if (isHeaderRow && rowIndex === 0) {
          // First row with header cells becomes the head
          headNode = {
            type: NodeTypeEnum.TABLE_HEAD,
            children: columns,
          };
        } else {
          // Regular body row
          bodyRows.push({
            type: NodeTypeEnum.TABLE_ROW,
            children: columns,
          });
        }
      }
    });
  }

  const tableNode: TableNodeType = {
    type: NodeTypeEnum.TABLE,
    children: bodyRows,
  };

  if (headNode) {
    tableNode.head = headNode;
  }

  return tableNode;
}

/**
 * Convert a Plate column to DSL column node (for grids)
 */
function convertColumnNode(node: PlateNode): ColumnNodeType {
  const columnChildren: NodeType[] = [];

  if (node.children) {
    node.children.forEach((child) => {
      const converted = convertPlateNode(child);
      if (converted) {
        columnChildren.push(converted);
      }
    });
  }

  // If no children, add empty text node
  if (columnChildren.length === 0) {
    columnChildren.push({
      type: NodeTypeEnum.TEXT,
      content: '',
    });
  }

  const column: ColumnNodeType = {
    type: NodeTypeEnum.COLUMN,
    children: columnChildren,
  };

  if (node.width && typeof node.width === 'number') {
    column.width = node.width;
  }

  return column;
}

/**
 * Convert a Plate horizontal rule to DSL page break
 */
function convertHorizontalRuleNode(): PageBreakNodeType {
  return {
    type: NodeTypeEnum.PAGE_BREAK,
  };
}

/**
 * Convert any Plate node to DSL node
 */
function convertPlateNode(node: PlateNode): NodeType | null {
  // Handle text nodes
  if (node.text !== undefined) {
    const { content, styles } = extractTextAndMarks(node);
    const textNode: TextNodeType = {
      type: NodeTypeEnum.TEXT,
      content,
    };

    if (styles && Object.keys(styles).length > 0) {
      textNode.styles = styles;
    }

    return textNode;
  }

  // Handle element nodes
  switch (node.type) {
    case ELEMENT_TYPES.PARAGRAPH:
      return convertParagraphNode(node);

    case ELEMENT_TYPES.HEADING_1:
    case ELEMENT_TYPES.HEADING_2:
    case ELEMENT_TYPES.HEADING_3:
    case ELEMENT_TYPES.HEADING_4:
    case ELEMENT_TYPES.HEADING_5:
    case ELEMENT_TYPES.HEADING_6:
      return convertHeadingNode(node);

    case ELEMENT_TYPES.ORDERED_LIST:
    case ELEMENT_TYPES.UNORDERED_LIST:
      return convertListNode(node);

    case ELEMENT_TYPES.TABLE:
      return convertTableNode(node);

    case ELEMENT_TYPES.COLUMN:
      return convertColumnNode(node);

    case ELEMENT_TYPES.HORIZONTAL_RULE:
      return convertHorizontalRuleNode();

    case ELEMENT_TYPES.MENTION:
      // Convert mention back to text with variable syntax
      const variableName = (node.value as string) || node.children?.[0]?.text || '';
      const cleanName =
        typeof variableName === 'string' ? variableName.replace(/^\$\{|\}$/g, '') : variableName;
      return {
        type: NodeTypeEnum.TEXT,
        content: `\${${cleanName}}`,
      };

    case ELEMENT_TYPES.BLOCKQUOTE:
      // Convert blockquote to text with special formatting
      const { content } = extractTextFromChildren(node.children || []);
      return {
        type: NodeTypeEnum.TEXT,
        content: `> ${content}`,
      };

    default:
      // For unknown types, try to extract text content
      if (node.children && node.children.length > 0) {
        const { content } = extractTextFromChildren(node.children);
        if (content) {
          return {
            type: NodeTypeEnum.TEXT,
            content,
          };
        }
      }
      return null;
  }
}

/**
 * Detect and group columns into grids
 */
function detectAndGroupGrids(nodes: NodeType[]): NodeType[] {
  const result: NodeType[] = [];
  let i = 0;

  while (i < nodes.length) {
    const node = nodes[i];

    // Check if this is a column node
    if (node.type === NodeTypeEnum.COLUMN) {
      const columns: ColumnNodeType[] = [node as ColumnNodeType];

      // Look for consecutive column nodes
      let j = i + 1;
      while (j < nodes.length && nodes[j].type === NodeTypeEnum.COLUMN) {
        columns.push(nodes[j] as ColumnNodeType);
        j++;
      }

      // Create a grid node with the columns
      const gridNode: GridNodeType = {
        type: NodeTypeEnum.GRID,
        columns: columns.length || 2, // Ensure columns is always set (default 2)
        children: columns,
      };

      result.push(gridNode);
      i = j;
    } else {
      result.push(node);
      i++;
    }
  }

  return result;
}

/**
 * Convert a Plate.js Value to DSL document format
 */
export function plateToDsl(
  value: Value,
  preserveVariables?: DocumentSchema['variables']
): DocumentSchema {
  const children: NodeType[] = [];

  if (Array.isArray(value)) {
    value.forEach((node) => {
      const converted = convertPlateNode(node as PlateNode);
      if (converted) {
        children.push(converted);
      }
    });
  }

  // Detect and group columns into grids
  const processedChildren = detectAndGroupGrids(children);

  // Ensure we have at least one node
  if (processedChildren.length === 0) {
    processedChildren.push({
      type: NodeTypeEnum.TEXT,
      content: '',
    });
  }

  const document: DocumentSchema = {
    type: NodeTypeEnum.DOCUMENT,
    children: processedChildren as DocumentSchema['children'],
  };

  // Preserve variables if provided
  if (preserveVariables && preserveVariables.length > 0) {
    document.variables = preserveVariables;
  }

  return document;
}
