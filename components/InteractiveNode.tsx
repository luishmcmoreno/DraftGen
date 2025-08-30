'use client';

import React, { useState, useRef, useEffect, useContext } from 'react';
import { cn } from '@/lib/utils';
import { EditContext, isPathBeingEdited, type NodePath } from '@/contexts/EditContext';

interface InteractiveNodeProps {
  nodeType: string;
  children: React.ReactNode;
  className?: string;
  inline?: boolean; // For wrapping content inside elements like td
  nodePath?: NodePath; // Path to this node in the DSL tree
  nodeContent?: string; // Original content of the node
  elementType?: string; // The HTML element type (p, h1, h2, etc.)
  elementStyles?: React.CSSProperties; // Original styles to preserve
}

export function InteractiveNode({
  nodeType,
  children,
  className,
  inline = false,
  nodePath = [],
  nodeContent = '',
  elementType = 'div',
  elementStyles = {},
}: InteractiveNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const editContext = useContext(EditContext);
  const isEditing = editContext ? isPathBeingEdited(nodePath, editContext.editingPath) : false;
  const editableRef = useRef<HTMLDivElement>(null);
  const [editContent, setEditContent] = useState(nodeContent);

  // Show hover state only if this node is selected or no node is selected
  const showHoverState = isHovered && (!editContext?.editingPath || isEditing);

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

  // Handle click to start editing
  const handleClick = (e: React.MouseEvent) => {
    if (!isEditing && isHovered && nodePath.length > 0 && editContext) {
      e.stopPropagation();
      e.preventDefault();

      // Extract text content from the node
      const textContent = extractTextContent(e.currentTarget);
      setEditContent(textContent);

      // Start editing - this will automatically deselect any other node
      editContext.startEditing(nodePath, textContent);
    }
  };

  // Extract plain text content from HTML element, preserving line breaks
  const extractTextContent = (element: EventTarget): string => {
    const el = element as HTMLElement;
    // Find the actual content element (p, h1-h6, span)
    const contentEl = el.querySelector(
      'p, h1, h2, h3, h4, h5, h6, span:not(.variable-token):not(.interactive-node-label)'
    );
    if (contentEl) {
      // Get inner text to preserve line breaks, or convert br tags to newlines
      const html = contentEl.innerHTML;
      // Replace <br> tags with newlines
      const withLineBreaks = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/div><div>/gi, '\n')
        .replace(/<div>/gi, '\n')
        .replace(/<\/div>/gi, '')
        .replace(/<[^>]*>/g, ''); // Remove remaining HTML tags
      // Decode HTML entities
      const textarea = document.createElement('textarea');
      textarea.innerHTML = withLineBreaks;
      return textarea.value;
    }
    return el.textContent || '';
  };

  // Get content from contentEditable preserving line breaks
  const getEditableContent = (): string => {
    if (!editableRef.current) return '';

    // Get the innerHTML and convert breaks to newlines
    const html = editableRef.current.innerHTML;
    const withLineBreaks = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/div><div>/gi, '\n')
      .replace(/<div>/gi, '\n')
      .replace(/<\/div>/gi, '')
      .replace(/<[^>]*>/g, ''); // Remove remaining HTML tags

    // Decode HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = withLineBreaks;
    return textarea.value.trim();
  };

  // Handle keyboard events during editing
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!editContext) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Get content directly from the contentEditable element
      const content = getEditableContent();
      if (content.trim() !== '') {
        editContext.saveEdit(content);
      } else {
        editContext.cancelEditing();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      editContext.cancelEditing();
    }
  };

  // Focus the editable element when editing starts
  useEffect(() => {
    if (isEditing && editableRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        if (editableRef.current) {
          editableRef.current.focus();
          // Select all content
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(editableRef.current);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }, 10);
    }
  }, [isEditing]);

  // Render editable content when in edit mode
  if (isEditing) {
    const EditWrapper = inline ? 'span' : 'div';
    // Use the actual element type for content editable
    const ContentElement = inline ? 'span' : elementType;

    return (
      <EditWrapper
        className={cn(
          'interactive-node-editing relative',
          inline ? 'inline-block w-full' : 'block',
          className
        )}
        data-node-type={nodeType}
      >
        {React.createElement(ContentElement, {
          ref: editableRef,
          contentEditable: true,
          suppressContentEditableWarning: true,
          tabIndex: 0,
          onKeyDown: handleKeyDown,
          style: {
            ...elementStyles, // Apply original element styles
            outline: '2px solid #3b82f6',
            outlineOffset: '2px',
            borderRadius: '0.25rem',
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            cursor: 'text',
          },
          onBlur: () => {
            // Save on blur if we have context
            if (editContext) {
              const content = getEditableContent();
              if (content.trim() !== '') {
                editContext.saveEdit(content);
              } else {
                editContext.cancelEditing();
              }
            }
          },
          dangerouslySetInnerHTML: {
            __html: editContent.replace(/\n/g, '<br>'),
          },
        })}
      </EditWrapper>
    );
  }

  // For inline mode (like table cells), use a span wrapper
  if (inline) {
    return (
      <span
        className={cn(
          'interactive-node-inline relative cursor-pointer',
          showHoverState && 'interactive-node-hover-inline',
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        data-node-type={nodeType}
      >
        {showHoverState && <span className="interactive-node-label">{getNodeLabel(nodeType)}</span>}
        {children}
      </span>
    );
  }

  return (
    <div
      className={cn(
        'interactive-node relative cursor-pointer',
        showHoverState && 'interactive-node-hover',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      data-node-type={nodeType}
    >
      {showHoverState && <div className="interactive-node-label">{getNodeLabel(nodeType)}</div>}
      {children}
    </div>
  );
}
