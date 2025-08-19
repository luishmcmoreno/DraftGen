'use client';

import { DocumentSchema } from '@/lib/dslValidator';
import { cn } from '@/lib/utils';

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
      // Highlight variables with subtle tokens
      const content = node.content.replace(
        /\$\{([A-Z0-9_]+)\}/g,
        (match: string, varName: string) => {
          return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mx-1">${varName}</span>`;
        }
      );
      
      return (
        <p 
          key={index} 
          className="mb-4 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    return null;
  };

  return (
    <div className={cn('py-8 px-4', className)}>
      <div className="page">
        {dsl.children?.map((node, index) => renderNode(node, index))}
      </div>
    </div>
  );
}