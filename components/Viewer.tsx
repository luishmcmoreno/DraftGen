'use client';

import { DocumentSchema } from '@/lib/dslValidator';
import { cn } from '@/lib/utils';
import { documentStyles } from '@/utils/documentStyles';

interface ViewerProps {
  dsl: DocumentSchema | null;
  className?: string;
}

export function Viewer({ dsl, className }: ViewerProps) {
  if (!dsl) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="text-center text-muted-foreground">
          <p className="text-sm">No document to preview</p>
          <p className="text-xs mt-2">Start by entering a prompt in the chat</p>
        </div>
      </div>
    );
  }

  const renderNode = (node: any, index: number) => {
    if (node.type === 'text') {
      // Handle empty content as line breaks
      if (!node.content || node.content.trim() === '') {
        return <br key={index} />;
      }
      
      // Highlight variables with subtle tokens
      const content = node.content.replace(
        /\$\{([A-Z0-9_]+)\}/g,
        (match: string, varName: string) => {
          return `<span style="display: inline-flex; align-items: center; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; background-color: #dbeafe; color: #1e40af; margin: 0 0.25rem;">${varName}</span>`;
        }
      );
      
      return (
        <p 
          key={index} 
          style={documentStyles.paragraph}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    return null;
  };

  return (
    <div className={cn('py-8 px-4', className)}>
      <div style={documentStyles.page}>
        {dsl.children?.map((node, index) => renderNode(node, index))}
      </div>
    </div>
  );
}