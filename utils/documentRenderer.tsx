// Shared document rendering logic for WYSIWYG consistency
import React from 'react';
import { documentStyles, fontSizeMap, textAlignMap, headingStyleMap } from './documentStyles';
import type { 
  NodeType, 
  DocumentSchema,
  ListNodeType,
  ListItemNodeType,
  TableNodeType,
  TableHeadNodeType,
  TableRowNodeType,
  TableColumnNodeType,
  GridNodeType,
  ColumnNodeType,
  TextNodeType,
  HeadingNodeType,
  TextStylesType
} from '../lib/dslValidator';

export interface RenderOptions {
  showVariables?: boolean; // Show variable tokens in preview
  forPdf?: boolean; // Rendering for PDF generation
  isFirstOnPage?: boolean; // Is this the first element on the page
}

function parseMarkdown(text: string): string {
  // Parse bold (**text** or __text__)
  let parsed = text.replace(
    /\*\*([^*]+)\*\*|__([^_]+)__/g,
    (_match, p1, p2) => `<strong>${p1 || p2}</strong>`
  );
  
  // Parse italic (*text* or _text_) - but not if it's part of a variable like ${VAR_NAME}
  parsed = parsed.replace(
    /(?<!\$\{[A-Z0-9])\*([^*]+)\*|(?<![A-Z0-9]_)_([^_]+)_/g,
    (_match, p1, p2) => `<em>${p1 || p2}</em>`
  );
  
  return parsed;
}

function processTextContent(
  text: string, 
  showVariables: boolean, 
  forPdf: boolean
): string {
  let processed = text;
  
  // First, process variables
  if (showVariables && !forPdf) {
    processed = processed.replace(
      /\$\{([A-Z0-9_]+)\}/g,
      (_match: string, varName: string) => {
        return `<span class="variable-token">${varName}</span>`;
      }
    );
  }
  
  // Then, parse markdown
  processed = parseMarkdown(processed);
  
  return processed;
}

function getTextStyles(styles?: TextStylesType): React.CSSProperties {
  if (!styles) return {};
  
  const cssStyles: React.CSSProperties = {};
  
  if (styles.bold) cssStyles.fontWeight = 'bold';
  if (styles.italic) cssStyles.fontStyle = 'italic';
  if (styles.underline) cssStyles.textDecoration = 'underline';
  if (styles.fontSize) cssStyles.fontSize = fontSizeMap[styles.fontSize];
  if (styles.alignment) cssStyles.textAlign = textAlignMap[styles.alignment] as any;
  if (styles.color) cssStyles.color = styles.color;
  
  return cssStyles;
}

export function renderNode(
  node: NodeType, 
  index: number, 
  options: RenderOptions = {}
): React.JSX.Element | null {
  const { showVariables = true, forPdf = false, isFirstOnPage = false } = options;
  
  switch (node.type) {
    case 'text': {
      const textNode = node as TextNodeType;
      // Handle empty content as line breaks
      if (!textNode.content || textNode.content.trim() === '') {
        return <br key={index} />;
      }
      
      // Get text styles from node
      const textStyles = getTextStyles(textNode.styles);
      
      // Process content (variables + markdown)
      const processedContent = processTextContent(
        textNode.content, 
        showVariables, 
        forPdf
      );
      
      // Check if we have any HTML content (from variables or markdown)
      const hasHtml = processedContent !== textNode.content;
      
      if (hasHtml) {
        return (
          <p 
            key={index}
            style={{
              ...documentStyles.paragraph,
              ...textStyles,
              fontFamily: 'inherit'
            }}
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        );
      } else {
        return (
          <p 
            key={index}
            style={{
              ...documentStyles.paragraph,
              ...textStyles,
              fontFamily: 'inherit'
            }}
          >
            {textNode.content}
          </p>
        );
      }
    }

    case 'heading': {
      const headingNode = node as HeadingNodeType;
      
      // Get base heading styles for the level
      const baseStyles = headingStyleMap[headingNode.level as 1 | 2 | 3 | 4 | 5 | 6];
      
      // Get any additional custom styles
      const customStyles = getTextStyles(headingNode.styles);
      
      // Process content for variables and markdown
      const processedContent = processTextContent(
        headingNode.content,
        showVariables,
        forPdf
      );
      
      // Check if we have HTML content
      const hasHtml = processedContent !== headingNode.content;
      
      // Don't let fontSize from text styles override heading sizes
      const { fontSize: _ignoredFontSize, ...customStylesWithoutFontSize } = customStyles;
      
      const combinedStyles: React.CSSProperties = {
        ...customStylesWithoutFontSize, // Apply custom styles (without fontSize)
        ...baseStyles, // Base heading styles (includes proper fontSize)
        fontFamily: 'inherit',
        ...(isFirstOnPage && index === 0 ? { marginTop: 0 } : {})
      };
      
      // Render heading based on level
      const HeadingTag = `h${headingNode.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      
      if (hasHtml) {
        return React.createElement(
          HeadingTag,
          {
            key: index,
            style: combinedStyles,
            dangerouslySetInnerHTML: { __html: processedContent }
          }
        );
      } else {
        return React.createElement(
          HeadingTag,
          {
            key: index,
            style: combinedStyles,
          },
          headingNode.content
        );
      }
    }

    case 'list': {
      const listNode = node as ListNodeType;
      const ListTag = listNode.ordered ? 'ol' : 'ul';
      return (
        <ListTag 
          key={index}
          style={{
            marginTop: '0.5rem',
            marginBottom: '0.5rem',
            paddingLeft: '2rem',
            listStyleType: listNode.ordered ? 'decimal' : 'disc',
            listStylePosition: 'outside',
          }}
        >
          {listNode.children.map((item: ListItemNodeType, i: number) => (
            renderNode(item, i, options)
          ))}
        </ListTag>
      );
    }

    case 'list-item': {
      const listItemNode = node as ListItemNodeType;
      return (
        <li 
          key={index}
          style={{
            marginBottom: '0.25rem',
          }}
        >
          {listItemNode.children.map((child: NodeType, i: number) => {
            const rendered = renderNode(child, i, options);
            // Remove paragraph wrapper for text in list items but preserve styles
            if (React.isValidElement(rendered) && rendered.type === 'p') {
              const props = rendered.props as { dangerouslySetInnerHTML?: any; children?: React.ReactNode; style?: React.CSSProperties };
              // Extract styles but remove paragraph-specific margins
              const { margin, marginTop, marginBottom, ...otherStyles } = props.style || {};
              return props.dangerouslySetInnerHTML 
                ? <span key={i} style={otherStyles} dangerouslySetInnerHTML={props.dangerouslySetInnerHTML} />
                : <span key={i} style={otherStyles}>{props.children}</span>;
            }
            return rendered;
          })}
        </li>
      );
    }

    case 'table': {
      const tableNode = node as TableNodeType;
      return (
        <table 
          key={index}
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: '1rem',
            marginBottom: '1rem',
          }}
        >
          {tableNode.head && (
            <thead>
              {renderNode(tableNode.head, 0, options)}
            </thead>
          )}
          <tbody>
            {tableNode.children.map((row: TableRowNodeType, i: number) => (
              renderNode(row, i, options)
            ))}
          </tbody>
        </table>
      );
    }

    case 'table-head': {
      const tableHeadNode = node as TableHeadNodeType;
      return (
        <tr key={index}>
          {tableHeadNode.children.map((col: TableColumnNodeType, i: number) => (
            <th 
              key={i}
              style={{
                border: '1px solid #ddd',
                padding: '8px',
                backgroundColor: '#f5f5f5',
                fontWeight: 'bold',
                textAlign: 'left',
              }}
            >
              {col.children.map((child: NodeType, j: number) => renderNode(child, j, options))}
            </th>
          ))}
        </tr>
      );
    }

    case 'table-row': {
      const tableRowNode = node as TableRowNodeType;
      return (
        <tr key={index}>
          {tableRowNode.children.map((col: TableColumnNodeType, i: number) => (
            renderNode(col, i, options)
          ))}
        </tr>
      );
    }

    case 'table-column': {
      const tableColumnNode = node as TableColumnNodeType;
      return (
        <td 
          key={index}
          style={{
            border: '1px solid #ddd',
            padding: '8px',
          }}
        >
          {tableColumnNode.children.map((child: NodeType, i: number) => {
            const rendered = renderNode(child, i, options);
            // Remove paragraph wrapper for text in table cells but preserve styles
            if (React.isValidElement(rendered) && rendered.type === 'p') {
              const props = rendered.props as { dangerouslySetInnerHTML?: any; children?: React.ReactNode; style?: React.CSSProperties };
              // Extract styles but remove paragraph-specific margins
              const { margin, marginTop, marginBottom, ...otherStyles } = props.style || {};
              return props.dangerouslySetInnerHTML 
                ? <span key={i} style={otherStyles} dangerouslySetInnerHTML={props.dangerouslySetInnerHTML} />
                : <span key={i} style={otherStyles}>{props.children}</span>;
            }
            return rendered;
          })}
        </td>
      );
    }

    case 'grid': {
      const gridNode = node as GridNodeType;
      const columns = gridNode.columns || 2;
      return (
        <div 
          key={index}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '1rem',
            marginTop: isFirstOnPage && index === 0 ? 0 : '1rem',
            marginBottom: '1rem',
          }}
        >
          {gridNode.children.map((col: ColumnNodeType, i: number) => (
            renderNode(col, i, options)
          ))}
        </div>
      );
    }

    case 'column': {
      const columnNode = node as ColumnNodeType;
      const width = columnNode.width ? `${columnNode.width}%` : 'auto';
      return (
        <div 
          key={index}
          style={{
            width,
            minWidth: 0, // Prevent overflow
          }}
        >
          {columnNode.children.map((child: NodeType, i: number) => (
            renderNode(child, i, options)
          ))}
        </div>
      );
    }

    case 'page-break': {
      return null; // Handled by renderDocument
    }

    default:
      return null;
  }
}

export function renderDocument(
  content: DocumentSchema,
  _options: RenderOptions = {}
): { pages: NodeType[][] } {
  const pages: NodeType[][] = [];
  let currentPage: NodeType[] = [];
  
  if (content.type === 'document' && Array.isArray(content.children)) {
    content.children.forEach((node) => {
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