import React from 'react';

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
        return (
          <p 
            key={index}
            style={{
              margin: '0.5rem 0',
              lineHeight: 1.6,
              color: '#000000',
              fontSize: '14px',
            }}
          >
            {node.content}
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
          width: '794px', // A4 width at 96 DPI
          minHeight: '1123px', // A4 height at 96 DPI
          padding: '80px 60px',
          backgroundColor: '#ffffff',
          color: '#000000',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '14px',
          lineHeight: '1.5',
          boxSizing: 'border-box',
        }}
      >
        {renderNode(content)}
      </div>
    );
  }
);

PdfPreview.displayName = 'PdfPreview';

export default PdfPreview;