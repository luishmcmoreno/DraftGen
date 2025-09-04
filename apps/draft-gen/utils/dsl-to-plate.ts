import { type Value } from '@draft-gen/ui';
import {
  DocumentSchema,
  NodeType,
  NodeTypeEnum,
  isTextNode,
  isHeadingNode,
  isListNode,
  isTableNode,
  isGridNode,
  isPageBreakNode,
  TextNodeType,
  HeadingNodeType,
  ListNodeType,
  TableNodeType,
  GridNodeType,
} from '@/lib/dslValidator';

// Plate.js element types
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

type PlateText = {
  text: string;
  [key: string]: unknown; // For marks like bold, italic, etc.
};

type PlateElement = {
  type: string;
  children: (PlateElement | PlateText)[];
  [key: string]: unknown; // For additional properties
};

/**
 * Parse text content for variables and convert them to mention elements
 */
function parseVariablesAndText(content: string): (PlateText | PlateElement)[] {
  const result: (PlateText | PlateElement)[] = [];
  const variableRegex = /\$\{([A-Z0-9_]+)\}/g;
  let lastIndex = 0;
  let match;

  while ((match = variableRegex.exec(content)) !== null) {
    // Add text before the variable
    if (match.index > lastIndex) {
      const textBefore = content.substring(lastIndex, match.index);
      const parsedText = parseTextWithMarks(textBefore);
      result.push(...parsedText);
    }

    // Add the variable as a mention element
    const variableName = match[1];
    result.push({
      type: ELEMENT_TYPES.MENTION,
      value: variableName,
      children: [{ text: `$\{${variableName}\}` }],
    } as PlateElement);

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last variable
  if (lastIndex < content.length) {
    const remainingText = content.substring(lastIndex);
    const parsedText = parseTextWithMarks(remainingText);
    result.push(...parsedText);
  }

  // If no variables found, just parse the text normally
  if (result.length === 0) {
    return parseTextWithMarks(content);
  }

  return result;
}

/**
 * Parse markdown-style formatting in text and convert to Plate marks
 */
function parseTextWithMarks(content: string): (PlateText | PlateElement)[] {
  const result: (PlateText | PlateElement)[] = [];
  let currentText = '';
  let i = 0;

  while (i < content.length) {
    // Check for bold (**text** or __text__)
    if (
      (content[i] === '*' && content[i + 1] === '*') ||
      (content[i] === '_' && content[i + 1] === '_')
    ) {
      const marker = content.substring(i, i + 2);
      const endIndex = content.indexOf(marker, i + 2);

      if (endIndex !== -1) {
        // Add any text before the bold
        if (currentText) {
          result.push({ text: currentText });
          currentText = '';
        }

        // Add bold text
        const boldContent = content.substring(i + 2, endIndex);
        // Check for nested italic
        if (boldContent.includes('*') || boldContent.includes('_')) {
          const nestedMarks = parseTextWithMarks(boldContent);
          nestedMarks.forEach((mark) => {
            if ('text' in mark) {
              result.push({ ...mark, [MARK_TYPES.BOLD]: true });
            } else {
              result.push(mark);
            }
          });
        } else {
          result.push({ text: boldContent, [MARK_TYPES.BOLD]: true });
        }

        i = endIndex + 2;
        continue;
      }
    }

    // Check for italic (*text* or _text_) - single markers
    if (
      (content[i] === '*' && content[i + 1] !== '*') ||
      (content[i] === '_' && content[i + 1] !== '_')
    ) {
      const marker = content[i];
      const endIndex = content.indexOf(marker, i + 1);

      if (
        endIndex !== -1 &&
        (marker !== '*' || content[endIndex + 1] !== '*') &&
        (marker !== '_' || content[endIndex + 1] !== '_')
      ) {
        // Add any text before the italic
        if (currentText) {
          result.push({ text: currentText });
          currentText = '';
        }

        // Add italic text
        const italicContent = content.substring(i + 1, endIndex);
        result.push({ text: italicContent, [MARK_TYPES.ITALIC]: true });

        i = endIndex + 1;
        continue;
      }
    }

    currentText += content[i];
    i++;
  }

  // Add any remaining text
  if (currentText) {
    result.push({ text: currentText });
  }

  return result.length > 0 ? result : [{ text: content }];
}

/**
 * Convert a text node from DSL to Plate format
 */
function convertTextNode(node: TextNodeType): PlateElement {
  const children = parseVariablesAndText(node.content);

  // Apply any additional styles from the DSL
  if (node.styles) {
    children.forEach((child) => {
      if ('text' in child) {
        if (node.styles?.bold) child[MARK_TYPES.BOLD] = true;
        if (node.styles?.italic) child[MARK_TYPES.ITALIC] = true;
        if (node.styles?.underline) child[MARK_TYPES.UNDERLINE] = true;
        // Note: 'code' is not in TextStyles type, but we handle inline code via markdown
      }
    });
  }

  return {
    type: ELEMENT_TYPES.PARAGRAPH,
    children: children as PlateText[],
  };
}

/**
 * Convert a heading node from DSL to Plate format
 */
function convertHeadingNode(node: HeadingNodeType): PlateElement {
  const headingTypes: Record<number, string> = {
    1: ELEMENT_TYPES.HEADING_1,
    2: ELEMENT_TYPES.HEADING_2,
    3: ELEMENT_TYPES.HEADING_3,
    4: ELEMENT_TYPES.HEADING_4,
    5: ELEMENT_TYPES.HEADING_5,
    6: ELEMENT_TYPES.HEADING_6,
  };

  const children = parseVariablesAndText(node.content);

  // Apply any additional styles
  if (node.styles) {
    children.forEach((child) => {
      if ('text' in child) {
        if (node.styles?.bold) child[MARK_TYPES.BOLD] = true;
        if (node.styles?.italic) child[MARK_TYPES.ITALIC] = true;
        if (node.styles?.underline) child[MARK_TYPES.UNDERLINE] = true;
      }
    });
  }

  return {
    type: headingTypes[node.level] || ELEMENT_TYPES.HEADING_1,
    children: children as PlateText[],
  };
}

/**
 * Convert a list node from DSL to Plate format
 */
function convertListNode(node: ListNodeType): PlateElement {
  const listType =
    (node.ordered ?? false) ? ELEMENT_TYPES.ORDERED_LIST : ELEMENT_TYPES.UNORDERED_LIST;

  const children = node.children.map((listItem) => {
    // Convert list item children
    const itemChildren = listItem.children.map((child) => convertNode(child)).flat();

    return {
      type: ELEMENT_TYPES.LIST_ITEM,
      children:
        itemChildren.length > 0
          ? itemChildren
          : [{ type: ELEMENT_TYPES.PARAGRAPH, children: [{ text: '' }] }],
    };
  });

  return {
    type: listType,
    children,
  };
}

/**
 * Convert a table node from DSL to Plate format
 */
function convertTableNode(node: TableNodeType): PlateElement {
  const rows: PlateElement[] = [];

  // Convert header row if present
  if (node.head) {
    const headerCells = node.head.children.map((col) => ({
      type: ELEMENT_TYPES.TABLE_HEADER_CELL,
      children: col.children.map((child) => convertNode(child)).flat(),
    }));

    rows.push({
      type: ELEMENT_TYPES.TABLE_ROW,
      children: headerCells,
    });
  }

  // Convert body rows
  node.children.forEach((row) => {
    const cells = row.children.map((col) => ({
      type: ELEMENT_TYPES.TABLE_CELL,
      children: col.children.map((child) => convertNode(child)).flat(),
    }));

    rows.push({
      type: ELEMENT_TYPES.TABLE_ROW,
      children: cells,
    });
  });

  return {
    type: ELEMENT_TYPES.TABLE,
    children: rows,
  };
}

/**
 * Convert a grid node from DSL to Plate format
 * Note: Plate doesn't have native grid support, so we convert to columns
 */
function convertGridNode(node: GridNodeType): PlateElement[] {
  // Convert each column
  return node.children.map((column) => {
    const columnChildren = column.children.map((child) => convertNode(child)).flat();

    return {
      type: ELEMENT_TYPES.COLUMN,
      width: column.width || 100 / (node.columns || 2),
      children:
        columnChildren.length > 0
          ? columnChildren
          : [{ type: ELEMENT_TYPES.PARAGRAPH, children: [{ text: '' }] }],
    };
  });
}

/**
 * Convert a page break node from DSL to Plate format
 */
function convertPageBreakNode(): PlateElement {
  return {
    type: ELEMENT_TYPES.HORIZONTAL_RULE,
    children: [{ text: '' }],
  };
}

/**
 * Convert any node from DSL to Plate format
 */
function convertNode(node: NodeType): PlateElement | PlateElement[] {
  if (isTextNode(node)) {
    return convertTextNode(node);
  }

  if (isHeadingNode(node)) {
    return convertHeadingNode(node);
  }

  if (isListNode(node)) {
    return convertListNode(node);
  }

  if (isTableNode(node)) {
    return convertTableNode(node);
  }

  if (isGridNode(node)) {
    return convertGridNode(node);
  }

  if (isPageBreakNode(node)) {
    return convertPageBreakNode();
  }

  // Default fallback for unknown types
  return {
    type: ELEMENT_TYPES.PARAGRAPH,
    children: [{ text: '' }],
  };
}

/**
 * Convert a DSL document to Plate.js Value format
 */
export function dslToPlate(dsl: DocumentSchema): Value {
  if (!dsl || dsl.type !== NodeTypeEnum.DOCUMENT || !Array.isArray(dsl.children)) {
    // Return empty document
    return [
      {
        type: ELEMENT_TYPES.PARAGRAPH,
        children: [{ text: '' }],
      },
    ];
  }

  const plateNodes: PlateElement[] = [];

  dsl.children.forEach((node) => {
    const converted = convertNode(node);
    if (Array.isArray(converted)) {
      plateNodes.push(...converted);
    } else {
      plateNodes.push(converted);
    }
  });

  // Ensure we have at least one node
  if (plateNodes.length === 0) {
    plateNodes.push({
      type: ELEMENT_TYPES.PARAGRAPH,
      children: [{ text: '' }],
    });
  }

  return plateNodes as Value;
}

/**
 * Check if a DSL document has typed variables
 */
export function hasVariables(dsl: DocumentSchema): boolean {
  return !!(dsl.variables && dsl.variables.length > 0);
}
