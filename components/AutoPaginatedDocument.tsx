'use client';

import React, { useEffect, useRef, useState } from 'react';
import { documentStyles } from '@/utils/documentStyles';
import { renderNode } from '@/utils/documentRenderer';

interface AutoPaginatedDocumentProps {
  content: any; // DSL content
  showVariables?: boolean;
  forPdf?: boolean;
  className?: string;
}

export function AutoPaginatedDocument({ 
  content, 
  showVariables = true, 
  forPdf = false,
  className = ''
}: AutoPaginatedDocumentProps) {
  const [pages, setPages] = useState<any[][]>([[]]);
  const measureRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  // Calculate available height for content (A4 height minus padding)
  const PAGE_HEIGHT = 1123; // A4 height in pixels at 96 DPI
  const PADDING_TOP = 72; // 1 inch
  const PADDING_BOTTOM = 72; // 1 inch
  // Available height is page height minus top and bottom padding
  const AVAILABLE_HEIGHT = PAGE_HEIGHT - PADDING_TOP - PADDING_BOTTOM; // 979px for content
  
  useEffect(() => {
    if (!content || content.type !== 'document' || !Array.isArray(content.children)) {
      setIsProcessing(false);
      return;
    }

    const processContent = async () => {
      setIsProcessing(true);
      const newPages: any[][] = [];
      let currentPage: any[] = [];
      let currentPageHeight = 0;
      
      // Create a hidden measuring container with exact page styles
      const measuringContainer = document.createElement('div');
      measuringContainer.style.cssText = `
        position: absolute;
        visibility: hidden;
        width: ${794 - 144}px; /* A4 width minus padding (72px * 2) */
        font-family: ${documentStyles.page.fontFamily};
        font-size: ${documentStyles.page.fontSize};
        line-height: ${documentStyles.page.lineHeight};
      `;
      document.body.appendChild(measuringContainer);

      for (let i = 0; i < content.children.length; i++) {
        const node = content.children[i];
        
        // Handle explicit page breaks
        if (node.type === 'page-break') {
          if (currentPage.length > 0) {
            newPages.push(currentPage);
            currentPage = [];
            currentPageHeight = 0;
          }
          continue;
        }

        // Measure the height of this node
        const tempDiv = document.createElement('div');
        if (node.type === 'text') {
          const p = document.createElement('p');
          p.style.cssText = `
            margin: 0 0 1em 0;
            line-height: 1.5;
            font-size: 12pt;
            font-family: inherit;
          `;
          // Handle empty content as line break
          if (!node.content || node.content.trim() === '') {
            p.innerHTML = '<br>';
          } else {
            // Account for variables in the text
            const textWithVariables = node.content.replace(
              /\$\{([A-Z0-9_]+)\}/g,
              '<span style="display: inline-block; padding: 0.125rem 0.5rem; margin: 0 0.25rem;">$1</span>'
            );
            p.innerHTML = textWithVariables;
          }
          tempDiv.appendChild(p);
        }
        
        measuringContainer.appendChild(tempDiv);
        const nodeHeight = tempDiv.offsetHeight;
        measuringContainer.removeChild(tempDiv);

        // Check if adding this node would exceed page height
        // Use a small buffer (30px) to prevent edge overflow
        const MAX_CONTENT_HEIGHT = AVAILABLE_HEIGHT - 30;
        
        if (currentPageHeight > 0 && currentPageHeight + nodeHeight > MAX_CONTENT_HEIGHT) {
          // Start a new page
          newPages.push(currentPage);
          currentPage = [node];
          currentPageHeight = nodeHeight;
        } else {
          // Add to current page
          currentPage.push(node);
          currentPageHeight += nodeHeight;
        }
      }

      // Add the last page if it has content
      if (currentPage.length > 0) {
        newPages.push(currentPage);
      }

      // Clean up measuring container
      document.body.removeChild(measuringContainer);

      // If no pages were created, create one empty page
      if (newPages.length === 0) {
        newPages.push([]);
      }

      setPages(newPages);
      setIsProcessing(false);
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(processContent, 50);
    return () => clearTimeout(timer);
  }, [content, AVAILABLE_HEIGHT]);

  if (isProcessing && !forPdf) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-sm text-gray-500">Processing document...</div>
      </div>
    );
  }

  return (
    <div className={className}>
      {pages.map((pageContent, pageIndex) => (
        <div
          key={pageIndex}
          className="document-page"
          style={{
            width: '794px',
            height: '1123px',
            padding: '72px',
            backgroundColor: '#ffffff',
            color: '#000000',
            fontFamily: documentStyles.page.fontFamily,
            fontSize: documentStyles.page.fontSize,
            lineHeight: documentStyles.page.lineHeight,
            boxSizing: 'border-box' as const,
            position: 'relative' as const,
            margin: forPdf ? '0' : '0 auto',
            marginBottom: forPdf ? '0' : (pageIndex < pages.length - 1 ? '2rem' : '1rem'),
            boxShadow: !forPdf ? documentStyles.page.boxShadow : 'none',
            border: !forPdf ? documentStyles.page.border : 'none',
            pageBreakAfter: forPdf && pageIndex < pages.length - 1 ? 'always' : 'auto',
            pageBreakInside: 'avoid' as const,
          }}
        >
          {/* Page number indicator */}
          {!forPdf && (
            <>
              <div 
                className="absolute -top-6 left-0 text-xs text-gray-500 font-medium"
                style={{ top: '-24px' }}
              >
                Page {pageIndex + 1} of {pages.length}
              </div>
              {/* A4 size indicator on the side */}
              <div className="absolute -left-12 top-0 h-[1123px] w-8 hidden lg:block">
                <div className="relative h-full">
                  <div className="absolute inset-0 border-l-2 border-dashed border-gray-300 dark:border-gray-600 opacity-50">
                    <div className="absolute -left-6 top-0 text-[9px] text-gray-400 whitespace-nowrap">
                      0
                    </div>
                    <div className="absolute -left-10 bottom-0 text-[9px] text-gray-400 whitespace-nowrap">
                      297mm
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {/* Page content - constrained within padding */}
          <div className="page-content" style={{
            maxHeight: `${AVAILABLE_HEIGHT}px`,
            overflow: 'hidden',
            position: 'relative'
          }}>
            {pageContent.map((node, nodeIndex) => 
              renderNode(node, nodeIndex, { showVariables, forPdf })
            )}
          </div>
          
          {/* Page number footer and page break indicator */}
          {!forPdf && (
            <>
              <div 
                className="absolute bottom-8 left-0 right-0 text-center text-gray-400"
                style={{ fontSize: '10px' }}
              >
                — {pageIndex + 1} —
              </div>
              {pageIndex < pages.length - 1 && (
                <div className="absolute -bottom-10 left-0 right-0 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <div className="h-[1px] w-20 bg-gray-300 dark:bg-gray-700"></div>
                    <span className="text-xs text-gray-400 italic">Auto page break</span>
                    <div className="h-[1px] w-20 bg-gray-300 dark:bg-gray-700"></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}