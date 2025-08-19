import React, { useMemo } from 'react';
import { renderNode } from '@/utils/documentRenderer';
import { documentStyles } from '@/utils/documentStyles';

interface PdfPreviewProps {
  content: any; // DSL content
}

const PdfPreview = React.forwardRef<HTMLDivElement, PdfPreviewProps>(
  ({ content }, ref) => {
    // Pre-paginate content for PDF generation (same logic as AutoPaginatedDocument)
    const pages = useMemo(() => {
      if (!content || content.type !== 'document' || !Array.isArray(content.children)) {
        return [];
      }

      const result: any[][] = [];
      let currentPage: any[] = [];
      let currentPageHeight = 0;
      const AVAILABLE_HEIGHT = 979 - 30; // Same as AutoPaginatedDocument

      // Simple height estimation
      const estimateHeight = (node: any) => {
        if (node.type === 'text') {
          const lines = Math.ceil((node.content?.length || 0) / 90) || 1;
          return lines * 25;
        }
        return 0;
      };

      for (const node of content.children) {
        if (node.type === 'page-break') {
          if (currentPage.length > 0) {
            result.push(currentPage);
            currentPage = [];
            currentPageHeight = 0;
          }
        } else {
          const nodeHeight = estimateHeight(node);
          
          if (currentPageHeight > 0 && currentPageHeight + nodeHeight > AVAILABLE_HEIGHT) {
            result.push(currentPage);
            currentPage = [node];
            currentPageHeight = nodeHeight;
          } else {
            currentPage.push(node);
            currentPageHeight += nodeHeight;
          }
        }
      }

      if (currentPage.length > 0) {
        result.push(currentPage);
      }

      return result.length > 0 ? result : [[]];
    }, [content]);

    if (!content || content.type !== 'document') {
      return <div ref={ref}></div>;
    }

    // Render with exact same styles as AutoPaginatedDocument
    return (
      <div ref={ref} style={{ backgroundColor: '#ffffff' }}>
        {pages.map((pageContent, pageIndex) => (
          <div
            key={pageIndex}
            className="pdf-page"
            style={{
              width: '794px',
              height: '1123px',
              padding: '72px',
              backgroundColor: '#ffffff',
              color: '#000000',
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: '12pt',
              lineHeight: '1.5',
              boxSizing: 'border-box',
              position: 'relative',
              pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'auto',
              pageBreakInside: 'avoid',
              overflow: 'hidden',
            }}
          >
            <div style={{
              maxHeight: '979px',
              overflow: 'hidden'
            }}>
              {pageContent.map((node: any, nodeIndex: number) => 
                renderNode(node, nodeIndex, { showVariables: false, forPdf: true })
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
);

PdfPreview.displayName = 'PdfPreview';

export default PdfPreview;