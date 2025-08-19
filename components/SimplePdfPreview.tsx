import React from 'react';

interface SimplePdfPreviewProps {
  content: any; // DSL content
}

const SimplePdfPreview = React.forwardRef<HTMLDivElement, SimplePdfPreviewProps>(
  ({ content }, ref) => {
    console.log('SimplePdfPreview content:', content);
    
    if (!content || content.type !== 'document' || !Array.isArray(content.children)) {
      console.log('SimplePdfPreview: No valid content');
      return <div ref={ref} style={{ display: 'none' }}></div>;
    }

    // Render content in a simple HTML structure for PDF
    // Avoid any complex styling that might cause issues
    return (
      <div 
        ref={ref} 
        style={{
          width: '794px',
          padding: '72px',
          background: '#ffffff',
          color: '#000000',
          fontFamily: 'Arial',
          fontSize: '16px',
          lineHeight: 1.5,
        }}
      >
        {content.children.map((node: any, index: number) => {
          if (node.type === 'page-break') {
            return (
              <div 
                key={index}
                style={{ 
                  pageBreakAfter: 'always',
                  height: '1px',
                  margin: '0'
                }} 
              />
            );
          }
          
          if (node.type === 'text') {
            // Handle empty content as line break
            if (!node.content || node.content.trim() === '') {
              return <br key={index} />;
            }
            
            return (
              <p 
                key={index}
                style={{
                  margin: '0 0 16px 0',
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: '#000000'
                }}
              >
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

SimplePdfPreview.displayName = 'SimplePdfPreview';

export default SimplePdfPreview;