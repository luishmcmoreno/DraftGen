'use client';

import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { documentStyles } from '@/utils/documentStyles';
import { renderNode } from '@/utils/documentRenderer';
import { splitNodeAtHeight } from '@/utils/nodeSplitter';

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
        position: fixed;
        top: -9999px;
        left: -9999px;
        width: ${794 - 144}px; /* A4 width minus padding (72px * 2) */
        font-family: ${documentStyles.page.fontFamily};
        font-size: ${documentStyles.page.fontSize};
        line-height: ${documentStyles.page.lineHeight};
        color: #000000;
        background: white;
      `;
      measuringContainer.className = 'document-page';
      document.body.appendChild(measuringContainer);

      // Process nodes with the ability to split them
      const remainingNodes = [...content.children];
      const MAX_CONTENT_HEIGHT = AVAILABLE_HEIGHT; // Use full available height
      
      while (remainingNodes.length > 0) {
        const node = remainingNodes.shift()!;
        
        // Handle explicit page breaks
        if (node.type === 'page-break') {
          if (currentPage.length > 0) {
            newPages.push(currentPage);
            currentPage = [];
            currentPageHeight = 0;
          }
          continue;
        }
        
        const isFirstNode = currentPage.length === 0;
        const remainingHeight = MAX_CONTENT_HEIGHT - currentPageHeight;
        
        // Try to split the node if needed
        const splitResult = await splitNodeAtHeight(
          node,
          remainingHeight,
          measuringContainer,
          isFirstNode
        );
        
        
        // Add the part that fits to current page
        if (splitResult.fitsOnPage) {
          currentPage.push(splitResult.fitsOnPage);
          
          // Measure the actual cumulative height to account for margin collapse
          const testDocument = {
            type: 'document' as const,
            children: [...currentPage]
          };
          
          // Create a temporary container to measure
          const tempContainer = document.createElement('div');
          tempContainer.style.cssText = measuringContainer.style.cssText;
          tempContainer.className = measuringContainer.className;
          tempContainer.style.visibility = 'hidden';
          tempContainer.style.position = 'absolute';
          tempContainer.style.left = '-9999px';
          document.body.appendChild(tempContainer);
          
          // Render directly without wrapper divs
          const tempRoot = createRoot(tempContainer);
          tempRoot.render(
            <>
              {testDocument.children.map((child, index) => 
                renderNode(child, index, { showVariables: true, forPdf: false })
              )}
            </>
          );
          
          // Wait for render
          await new Promise(resolve => setTimeout(resolve, 20));
          
          // Measure using the last element's offsetTop + height
          const allChildren = tempContainer.children;
          let actualCumulativeHeight = 0;
          
          if (allChildren.length > 0) {
            const firstChild = allChildren[0] as HTMLElement;
            const lastChild = allChildren[allChildren.length - 1] as HTMLElement;
            
            if (firstChild && lastChild) {
              // Get the baseline offset (first element's top position)
              const baselineOffset = firstChild.offsetTop;
              
              // Calculate height from baseline to bottom of last element
              actualCumulativeHeight = (lastChild.offsetTop - baselineOffset) + lastChild.offsetHeight;
              
              // Also account for any bottom margin on the last element
              const computedStyle = window.getComputedStyle(lastChild);
              const marginBottom = parseFloat(computedStyle.marginBottom) || 0;
              actualCumulativeHeight += marginBottom;
            }
          }
          
          // Clean up
          tempRoot.unmount();
          document.body.removeChild(tempContainer);
          
          currentPageHeight = actualCumulativeHeight;
          
        }
        
        // Handle overflow
        if (splitResult.overflow) {
          // If nothing fit on this page, and page isn't empty, start a new page
          if (!splitResult.fitsOnPage && currentPage.length > 0) {
            newPages.push(currentPage);
            currentPage = [];
            currentPageHeight = 0;
            // Add the overflow back to process on the new page
            remainingNodes.unshift(splitResult.overflow);
          } else if (splitResult.fitsOnPage) {
            // Part of the node fit, start new page for overflow
            newPages.push(currentPage);
            currentPage = [];
            currentPageHeight = 0;
            remainingNodes.unshift(splitResult.overflow);
          } else {
            // Nothing fit and page is empty - this node is too big for a page
            // Force it onto this page anyway (will overflow)
            currentPage.push(node);
            currentPageHeight = MAX_CONTENT_HEIGHT; // Force new page next
          }
        }
        
        // Check if we should start a new page
        if (currentPageHeight >= MAX_CONTENT_HEIGHT && remainingNodes.length > 0) {
          newPages.push(currentPage);
          currentPage = [];
          currentPageHeight = 0;
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
                className="absolute -top-6 left-0 text-xs text-gray-500 dark:text-gray-400 font-medium z-10"
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
            position: 'relative',
          }}>
            {pageContent.map((node, nodeIndex) => (
              <React.Fragment key={nodeIndex}>
                {renderNode(node, nodeIndex, { 
                  showVariables, 
                  forPdf,
                  isFirstOnPage: nodeIndex === 0 
                })}
              </React.Fragment>
            ))}
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