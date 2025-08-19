// Utility to automatically paginate content based on A4 page height
// This is a simplified version for MVP - a more robust solution would measure actual rendered height

const LINES_PER_PAGE = 45; // Approximate lines that fit in an A4 page with our styling
const CHARS_PER_LINE = 90; // Approximate characters per line

export function estimateContentHeight(content: string): number {
  // Rough estimation: each line is about 25px with our line height
  const lines = content.split('\n').length + Math.floor(content.length / CHARS_PER_LINE);
  return lines * 25;
}

export function shouldBreakPage(currentHeight: number, nextContentHeight: number): boolean {
  const PAGE_HEIGHT = 1123 - 160; // A4 height minus padding (80px top + 80px bottom)
  return currentHeight + nextContentHeight > PAGE_HEIGHT;
}

// Auto-paginate content by inserting page-break nodes when content would overflow
export function autopaginateDocument(dsl: any): any {
  if (!dsl || dsl.type !== 'document' || !Array.isArray(dsl.children)) {
    return dsl;
  }

  const paginatedChildren: any[] = [];
  let currentPageHeight = 0;
  const MAX_PAGE_HEIGHT = 963; // 1123px - 160px padding

  for (const node of dsl.children) {
    if (node.type === 'page-break') {
      // User-defined page break, reset height counter
      paginatedChildren.push(node);
      currentPageHeight = 0;
    } else if (node.type === 'text') {
      // Estimate height of this text node
      const content = node.content || '';
      const estimatedHeight = estimateContentHeight(content);
      
      // Check if this content would overflow the current page
      if (currentPageHeight > 0 && currentPageHeight + estimatedHeight > MAX_PAGE_HEIGHT) {
        // Insert an automatic page break
        paginatedChildren.push({ type: 'page-break', auto: true });
        currentPageHeight = 0;
      }
      
      paginatedChildren.push(node);
      currentPageHeight += estimatedHeight;
    } else {
      // Unknown node type, just add it
      paginatedChildren.push(node);
    }
  }

  return {
    ...dsl,
    children: paginatedChildren
  };
}