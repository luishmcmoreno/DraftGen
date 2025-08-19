// Shared document rendering logic for WYSIWYG consistency
import React from 'react';
import { documentStyles } from './documentStyles';

export interface RenderOptions {
  showVariables?: boolean; // Show variable tokens in preview
  forPdf?: boolean; // Rendering for PDF generation
}

export function renderNode(
  node: any, 
  index: number, 
  options: RenderOptions = {}
): JSX.Element | null {
  const { showVariables = true, forPdf = false } = options;
  
  if (node.type === 'text') {
    // Handle empty content as line breaks
    if (!node.content || node.content.trim() === '') {
      return <br key={index} />;
    }
    
    // Process variables
    if (showVariables && !forPdf) {
      // For preview: show variables as styled tokens
      const content = node.content.replace(
        /\$\{([A-Z0-9_]+)\}/g,
        (match: string, varName: string) => {
          return `<span class="variable-token">${varName}</span>`;
        }
      );
      
      return (
        <p 
          key={index} 
          style={{
            ...documentStyles.paragraph,
            fontFamily: 'inherit' // Ensure it inherits from parent
          }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    } else {
      // For PDF or when variables are substituted: render plain text
      return (
        <p 
          key={index}
          style={{
            ...documentStyles.paragraph,
            fontFamily: 'inherit' // Ensure it inherits from parent
          }}
        >
          {node.content}
        </p>
      );
    }
  }
  
  return null;
}

export function renderDocument(
  content: any,
  options: RenderOptions = {}
): { pages: any[][] } {
  const pages: any[][] = [];
  let currentPage: any[] = [];
  
  if (content.type === 'document' && Array.isArray(content.children)) {
    content.children.forEach((node: any) => {
      if (node.type === 'page-break') {
        if (currentPage.length > 0) {
          pages.push(currentPage);
          currentPage = [];
        }
      } else {
        currentPage.push(node);
      }
    });
    
    // Add the last page if it has content
    if (currentPage.length > 0) {
      pages.push(currentPage);
    }
    
    // If no pages were created, create one with all content
    if (pages.length === 0 && content.children.length > 0) {
      pages.push(content.children);
    }
  }
  
  return { pages };
}