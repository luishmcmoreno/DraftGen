'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface InteractiveNodeProps {
  nodeType: string;
  children: React.ReactNode;
  className?: string;
  inline?: boolean; // For wrapping content inside elements like td
}

export function InteractiveNode({ 
  nodeType, 
  children, 
  className,
  inline = false
}: InteractiveNodeProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Format node type for display
  const getNodeLabel = (type: string) => {
    switch (type) {
      case 'text':
        return 'Text';
      case 'heading':
        return 'Heading';
      case 'table-column':
        return 'Table Cell';
      case 'table-header':
        return 'Table Header';
      case 'list-item':
        return 'List Item';
      default:
        return type;
    }
  };

  // For inline mode (like table cells), use a span wrapper
  if (inline) {
    return (
      <span
        className={cn(
          'interactive-node-inline relative',
          isHovered && 'interactive-node-hover-inline',
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-node-type={nodeType}
      >
        {isHovered && (
          <span className="interactive-node-label">
            {getNodeLabel(nodeType)}
          </span>
        )}
        {children}
      </span>
    );
  }

  return (
    <div
      className={cn(
        'interactive-node relative',
        isHovered && 'interactive-node-hover',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-node-type={nodeType}
    >
      {isHovered && (
        <div className="interactive-node-label">
          {getNodeLabel(nodeType)}
        </div>
      )}
      {children}
    </div>
  );
}