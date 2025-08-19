import React from 'react';

interface BasicPdfPreviewProps {
  content: any; // DSL content
}

const BasicPdfPreview = React.forwardRef<HTMLDivElement, BasicPdfPreviewProps>(
  ({ content }, ref) => {
    console.log('BasicPdfPreview received content:', content);
    
    if (!content || content.type !== 'document' || !Array.isArray(content.children)) {
      console.log('BasicPdfPreview: Invalid content structure');
      return <div ref={ref}>No content</div>;
    }

    console.log('BasicPdfPreview: Rendering', content.children.length, 'nodes');
    
    // Very simple rendering - just paragraphs with basic inline styles
    return (
      <div>
        {content.children.map((node: any, index: number) => {
          console.log('Rendering node:', node);
          if (node.type === 'page-break') {
            // For PDF, insert a div that forces page break
            return <div key={index} style={{ pageBreakAfter: 'always' }} />;
          }
          
          if (node.type === 'text') {
            if (!node.content || node.content.trim() === '') {
              return <br key={index} />;
            }
            
            // Simple paragraph with inline styles
            return (
              <p key={index} style={{ 
                fontFamily: 'Arial', 
                fontSize: '16px',
                lineHeight: '24px',
                margin: '0 0 16px 0',
                color: 'black'
              }}>
                {node.content}
              </p>
            );
          }
          
          return null;
        })}
      </div>
    );
  }
);

BasicPdfPreview.displayName = 'BasicPdfPreview';

export default BasicPdfPreview;