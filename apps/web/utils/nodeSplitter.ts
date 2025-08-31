// Recursive node splitter for pagination
import { NodeType } from '@/lib/dslValidator';
import { createRoot } from 'react-dom/client';
import { renderNode } from './documentRenderer';

// Configuration for how each node type can be split
interface NodeSplitConfig {
  canSplit: boolean;
  minChildren?: number; // Minimum children to keep together
  wrapperHeight?: number; // Container's own height (margins, padding)
  orphanProtection?: boolean; // Don't leave this node alone at page bottom
  repeatHeader?: boolean; // For tables
  splitStrategy?: 'independent' | 'synchronized'; // For grids
}

const NODE_CONFIGS: Record<string, NodeSplitConfig> = {
  document: { canSplit: true },
  list: {
    canSplit: true,
    minChildren: 1, // Allow splitting even with just 1 item on current page
  },
  'list-item': {
    canSplit: true, // List items can contain complex content
  },
  table: {
    canSplit: true,
    minChildren: 1,
    repeatHeader: true,
  },
  'table-row': {
    canSplit: false, // Rows are atomic
  },
  'table-head': {
    canSplit: false,
    orphanProtection: true, // Don't leave header alone
  },
  grid: {
    canSplit: true,
    splitStrategy: 'synchronized', // All columns break together
  },
  column: {
    canSplit: true,
  },
  text: {
    canSplit: true,
  },
  heading: {
    canSplit: false,
    orphanProtection: true, // Don't leave heading alone at page bottom
  },
  'page-break': { canSplit: false },
};

export interface SplitResult {
  fitsOnPage: NodeType | null;
  overflow: NodeType | null;
  heightUsed: number;
}

// Measure a single node's height
async function measureNodeHeight(
  node: NodeType,
  container: HTMLElement,
  isFirstOnPage: boolean = false
): Promise<number> {
  const nodeContainer = document.createElement('div');
  container.appendChild(nodeContainer);

  const root = createRoot(nodeContainer);
  root.render(
    renderNode(node, 0, {
      showVariables: true,
      forPdf: false,
      isFirstOnPage,
    })
  );

  // Wait for React to finish rendering
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Measure the actual rendered height INCLUDING margins
  // getBoundingClientRect() doesn't include margins, so we need to get computed styles
  const rect = nodeContainer.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(nodeContainer.firstElementChild || nodeContainer);
  const marginTop = parseFloat(computedStyle.marginTop) || 0;
  const marginBottom = parseFloat(computedStyle.marginBottom) || 0;

  // Total height including margins
  const height = rect.height + marginTop + marginBottom;

  // Clean up
  root.unmount();
  container.removeChild(nodeContainer);

  return height;
}

// Helper function to split text nodes by lines
async function splitTextNode(
  node: any, // TextNodeType
  availableHeight: number,
  container: HTMLElement,
  isFirstOnPage: boolean
): Promise<SplitResult> {
  const textNode = node;

  // First check if the whole text fits
  const totalHeight = await measureNodeHeight(node, container, isFirstOnPage);
  if (totalHeight <= availableHeight) {
    return {
      fitsOnPage: node,
      overflow: null,
      heightUsed: totalHeight,
    };
  }

  // Create a temporary container to measure line by line
  const tempContainer = document.createElement('div');
  tempContainer.style.cssText = container.style.cssText;
  tempContainer.style.visibility = 'hidden';
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  document.body.appendChild(tempContainer);

  // Render the text to get line breaks
  const p = document.createElement('p');
  p.style.cssText = `
    margin: 0 0 1em 0;
    line-height: 1.5;
    font-size: 12pt;
    font-family: Arial, Helvetica, sans-serif;
    white-space: pre-wrap;
    word-wrap: break-word;
  `;
  p.textContent = textNode.content;
  tempContainer.appendChild(p);

  // Get the lines using a range
  const range = document.createRange();
  const textNodeElement = p.firstChild;
  if (!textNodeElement) {
    document.body.removeChild(tempContainer);
    return {
      fitsOnPage: null,
      overflow: node,
      heightUsed: 0,
    };
  }

  // Binary search to find how much text fits
  let low = 0;
  let high = textNode.content.length;
  let bestFit = 0;
  let bestHeight = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);

    // Set range to measure up to this point
    range.setStart(textNodeElement, 0);
    try {
      range.setEnd(textNodeElement, mid);
    } catch (e) {
      // If we can't set the range, break
      break;
    }

    // Measure the height of this range
    const rects = range.getClientRects();
    let rangeHeight = 0;
    for (let i = 0; i < rects.length; i++) {
      rangeHeight = Math.max(
        rangeHeight,
        rects[i].bottom - tempContainer.getBoundingClientRect().top
      );
    }

    // Add paragraph bottom margin
    rangeHeight += 16; // 1em at 12pt

    if (rangeHeight <= availableHeight) {
      bestFit = mid;
      bestHeight = rangeHeight;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  // Clean up
  document.body.removeChild(tempContainer);

  // Don't split if we can't fit at least a reasonable amount
  const minChars = 50; // At least 50 characters
  if (bestFit < minChars) {
    return {
      fitsOnPage: null,
      overflow: node,
      heightUsed: 0,
    };
  }

  // Find a good break point (end of word, not mid-word)
  let splitPoint = bestFit;
  const content = textNode.content;

  // Look for the last space before our split point
  while (splitPoint > 0 && content[splitPoint] !== ' ' && content[splitPoint] !== '\n') {
    splitPoint--;
  }

  // If we went back too far, use the original point
  if (splitPoint < bestFit * 0.8) {
    splitPoint = bestFit;
  }

  // Create the two parts
  const firstPart = content.substring(0, splitPoint).trim();
  const secondPart = content.substring(splitPoint).trim();

  // Don't split if either part is too small
  if (firstPart.length < minChars || secondPart.length < minChars) {
    return {
      fitsOnPage: null,
      overflow: node,
      heightUsed: 0,
    };
  }

  return {
    fitsOnPage: {
      ...textNode,
      content: firstPart,
    },
    overflow: {
      ...textNode,
      content: secondPart,
    },
    heightUsed: bestHeight,
  };
}

// Main recursive splitter function
export async function splitNodeAtHeight(
  node: NodeType,
  availableHeight: number,
  measuringContainer: HTMLElement,
  isFirstOnPage: boolean = false
): Promise<SplitResult> {
  const config = NODE_CONFIGS[node.type] || { canSplit: false };

  // Measure the complete node first
  const totalHeight = await measureNodeHeight(node, measuringContainer, isFirstOnPage);

  // If it fits completely, return it as-is
  if (totalHeight <= availableHeight) {
    return {
      fitsOnPage: node,
      overflow: null,
      heightUsed: totalHeight,
    };
  }

  // Special handling for text nodes that can be split
  if (node.type === 'text' && config.canSplit) {
    return await splitTextNode(node, availableHeight, measuringContainer, isFirstOnPage);
  }

  // If node can't be split, it either fits entirely or goes to overflow
  if (!config.canSplit || !('children' in node) || !Array.isArray(node.children)) {
    // Check for orphan protection
    if (config.orphanProtection && isFirstOnPage) {
      // If this is a heading at the top of a page, it can stay
      return {
        fitsOnPage: node,
        overflow: null,
        heightUsed: totalHeight,
      };
    }

    return {
      fitsOnPage: null,
      overflow: node,
      heightUsed: 0,
    };
  }

  // Node has children and can be split
  const children = node.children as NodeType[];
  const fittingChildren: NodeType[] = [];
  const overflowChildren: NodeType[] = [];

  let reachedOverflow = false;

  // Special handling for tables - preserve header
  let tableHeader: NodeType | null = null;
  if (node.type === 'table' && 'head' in node && node.head) {
    tableHeader = node.head as NodeType;
  }

  // First pass: try to fit children
  for (let i = 0; i < children.length; i++) {
    const child = children[i];

    if (reachedOverflow) {
      // Already overflowing, add rest to overflow
      overflowChildren.push(child);
      continue;
    }

    // Try adding this child
    const testChildren = [...fittingChildren, child];
    const testNode = {
      ...node,
      children: testChildren,
    } as NodeType;

    // Include table header if applicable
    if (node.type === 'table' && tableHeader) {
      (testNode as any).head = tableHeader;
    }

    // Measure with this child added
    const testHeight = await measureNodeHeight(testNode, measuringContainer, isFirstOnPage);

    if (testHeight <= availableHeight) {
      // It fits, keep going
      fittingChildren.push(child);
    } else {
      // Doesn't fit, try to split this child
      const isChildFirst = fittingChildren.length === 0 && isFirstOnPage;
      const currentNode = {
        ...node,
        children: fittingChildren,
      } as NodeType;

      if (node.type === 'table' && tableHeader) {
        (currentNode as any).head = tableHeader;
      }

      const currentHeight =
        fittingChildren.length > 0
          ? await measureNodeHeight(currentNode, measuringContainer, isFirstOnPage)
          : 0;

      const remainingHeight = availableHeight - currentHeight;
      const childResult = await splitNodeAtHeight(
        child,
        remainingHeight,
        measuringContainer,
        isChildFirst
      );

      if (childResult.fitsOnPage) {
        fittingChildren.push(childResult.fitsOnPage);
      }

      if (childResult.overflow) {
        overflowChildren.push(childResult.overflow);
        reachedOverflow = true;
      } else if (!childResult.fitsOnPage) {
        // Child doesn't fit at all
        overflowChildren.push(child);
        reachedOverflow = true;
      }
    }
  }

  // Check minimum children requirement
  if (
    config.minChildren &&
    fittingChildren.length < config.minChildren &&
    fittingChildren.length < children.length
  ) {
    // Not enough children fit, move everything to overflow
    return {
      fitsOnPage: null,
      overflow: node,
      heightUsed: 0,
    };
  }

  // Build the split nodes
  let fitsNode: NodeType | null = null;
  let overflowNode: NodeType | null = null;

  if (fittingChildren.length > 0) {
    fitsNode = {
      ...node,
      children: fittingChildren,
    } as NodeType;

    // Special handling for tables - include header
    if (node.type === 'table' && tableHeader) {
      (fitsNode as any).head = tableHeader;
    }

    // For lists, ensure ordered property is set with default
    if (node.type === 'list') {
      (fitsNode as any).ordered = (node as any).ordered ?? false;
    }
  }

  if (overflowChildren.length > 0) {
    overflowNode = {
      ...node,
      children: overflowChildren,
    } as NodeType;

    // For tables, repeat the header in overflow
    if (node.type === 'table' && tableHeader && config.repeatHeader) {
      (overflowNode as any).head = tableHeader;
    }

    // For ordered lists, we need to continue numbering
    // This will be handled by the renderer detecting a 'startFrom' property
    if (node.type === 'list') {
      const listNode = node as any;
      const isOrdered = listNode.ordered ?? false;
      (overflowNode as any).ordered = isOrdered;
      if (isOrdered) {
        (overflowNode as any).startFrom = fittingChildren.length + 1;
      }
    }
  }

  // Measure the actual height of what fits
  let actualHeightUsed = 0;
  if (fitsNode) {
    actualHeightUsed = await measureNodeHeight(fitsNode, measuringContainer, isFirstOnPage);
  }

  return {
    fitsOnPage: fitsNode,
    overflow: overflowNode,
    heightUsed: actualHeightUsed,
  };
}

// Special handler for grids with synchronized column breaks
export async function splitGridSynchronized(
  gridNode: any,
  availableHeight: number,
  measuringContainer: HTMLElement,
  isFirstOnPage: boolean = false
): Promise<SplitResult> {
  // For grids, we need to find break points that work for ALL columns
  // This is more complex and might need multiple passes

  // For now, use the simple splitter
  // TODO: Implement synchronized column breaking
  return splitNodeAtHeight(gridNode, availableHeight, measuringContainer, isFirstOnPage);
}
