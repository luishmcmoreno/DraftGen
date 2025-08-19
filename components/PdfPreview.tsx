import React from 'react';
import { documentStyles } from '@/utils/documentStyles';

interface PdfPreviewProps {
  content: any; // DSL content
}

const PdfPreview = React.forwardRef<HTMLDivElement, PdfPreviewProps>(
  ({ content }, ref) => {
    const renderNode = (node: any, index: number = 0): JSX.Element | null => {
      if (node.type === 'text') {
        // Handle empty content as line breaks
        if (!node.content || node.content.trim() === '') {
          return <br key={index} />;
        }
        
        // Process variables in the content
        const processedContent = node.content.replace(
          /\$\{([A-Z0-9_]+)\}/g,
          (match: string, varName: string) => {
            // For PDF, we just show the variable name without special styling
            // since the values should already be substituted
            return varName;
          }
        );
        
        return (
          <p 
            key={index}
            style={documentStyles.paragraph}
          >
            {processedContent}
          </p>
        );
      } else if (node.type === 'document' && Array.isArray(node.children)) {
        return (
          <div key={index}>
            {node.children.map((child: any, childIndex: number) => 
              renderNode(child, childIndex)
            )}
          </div>
        );
      }
      return null;
    };

    return (
      <div
        ref={ref}
        style={{
          ...documentStyles.page,
          // Remove shadow for PDF generation
          boxShadow: 'none',
          margin: 0,
        }}
      >
        {renderNode(content)}
      </div>
    );
  }
);

PdfPreview.displayName = 'PdfPreview';

export default PdfPreview;