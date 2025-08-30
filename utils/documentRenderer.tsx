// Shared document rendering logic for WYSIWYG consistency
import React from 'react';
import { documentStyles, fontSizeMap, textAlignMap, headingStyleMap } from './documentStyles';
import { InteractiveNode } from '@/components/InteractiveNode';
import type { NodePath } from '@/contexts/EditContext';
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
  TextStylesType,
} from '../lib/dslValidator';

export interface RenderOptions {
  showVariables?: boolean; // Show variable tokens in preview
  forPdf?: boolean; // Rendering for PDF generation
  isFirstOnPage?: boolean; // Is this the first element on the page
  skipWrapper?: boolean; // Skip InteractiveNode wrapper (for nested content)
  nodePath?: NodePath; // Path to the current node in the DSL tree
  baseIndex?: number; // Base index offset for paginated content
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

function processTextContent(text: string, showVariables: boolean, forPdf: boolean): string {
  let processed = text;

  // Process variables first to protect them from markdown parsing
  if (showVariables && !forPdf) {
    // Replace variables with a placeholder that won't be affected by markdown
    const varPlaceholders: { [key: string]: string } = {};
    let placeholderIndex = 0;

    // Match both simple ${NAME} and extended ${NAME:TYPE:...} syntax
    processed = processed.replace(/\$\{([A-Z0-9_]+)(?::[^}]*)?\}/g, (match: string) => {
      // Extract just the variable name from the match
      const nameMatch = match.match(/\$\{([A-Z0-9_]+)/);
      const variableName = nameMatch ? nameMatch[1] : match;
      const displayText = `\${${variableName}}`;

      const placeholder = `%%VARPLACEHOLDER${placeholderIndex}%%`;
      varPlaceholders[placeholder] = `<span class="variable-token">${displayText}</span>`;
      placeholderIndex++;
      return placeholder;
    });

    // Parse markdown (won't affect placeholders)
    processed = parseMarkdown(processed);

    // Replace placeholders back with styled variables
    Object.keys(varPlaceholders).forEach((placeholder) => {
      processed = processed.replace(placeholder, varPlaceholders[placeholder]);
    });
  } else {
    // If not showing variables, just parse markdown
    processed = parseMarkdown(processed);
  }

  // Convert line breaks to <br> tags (after markdown parsing to avoid conflicts)
  processed = processed.replace(/\n/g, '<br>');

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
  const {
    showVariables = true,
    forPdf = false,
    isFirstOnPage = false,
    skipWrapper = false,
    nodePath = [],
    baseIndex = 0, // Add baseIndex with default value of 0
  } = options;
  
  // Calculate the actual index considering the base offset
  const actualIndex = baseIndex + index;
  const currentPath = [...nodePath, actualIndex];

  switch (node.type) {
    case 'text': {
      const textNode = node as TextNodeType;
      // Skip empty text nodes - spacing is handled by CSS margins
      if (!textNode.content || textNode.content.trim() === '') {
        return null;
      }

      // Get text styles from node
      const textStyles = getTextStyles(textNode.styles);

      // Process content (variables + markdown)
      const processedContent = processTextContent(textNode.content, showVariables, forPdf);

      // Check if we have any HTML content (from variables or markdown)
      const hasHtml = processedContent !== textNode.content;

      const textElement = hasHtml ? (
        <p
          style={{
            ...documentStyles.paragraph,
            ...textStyles,
            fontFamily: 'inherit',
          }}
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />
      ) : (
        <p
          style={{
            ...documentStyles.paragraph,
            ...textStyles,
            fontFamily: 'inherit',
          }}
        >
          {textNode.content}
        </p>
      );

      // Skip wrapper if we're inside another interactive node or for PDF
      if (skipWrapper || forPdf) {
        return React.cloneElement(textElement, { key: index });
      }

      return (
        <InteractiveNode
          key={index}
          nodeType="text"
          nodePath={currentPath}
          nodeContent={textNode.content}
          elementType="p"
          elementStyles={{
            ...documentStyles.paragraph,
            ...textStyles,
            fontFamily: 'inherit',
          }}
        >
          {textElement}
        </InteractiveNode>
      );
    }

    case 'heading': {
      const headingNode = node as HeadingNodeType;

      // Get base heading styles for the level
      const baseStyles = headingStyleMap[headingNode.level as 1 | 2 | 3 | 4 | 5 | 6];

      // Get any additional custom styles
      const customStyles = getTextStyles(headingNode.styles);

      // Process content for variables and markdown
      const processedContent = processTextContent(headingNode.content, showVariables, forPdf);

      // Check if we have HTML content
      const hasHtml = processedContent !== headingNode.content;

      // Don't let fontSize from text styles override heading sizes
      const { fontSize: _ignoredFontSize, ...customStylesWithoutFontSize } = customStyles;

      const combinedStyles: React.CSSProperties = {
        ...customStylesWithoutFontSize, // Apply custom styles (without fontSize)
        ...baseStyles, // Base heading styles (includes proper fontSize)
        fontFamily: 'inherit',
        ...(isFirstOnPage && index === 0 ? { marginTop: 0 } : {}),
      };

      // Render heading based on level
      const HeadingTag = `h${headingNode.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

      const headingElement = hasHtml
        ? React.createElement(HeadingTag, {
            style: combinedStyles,
            dangerouslySetInnerHTML: { __html: processedContent },
          })
        : React.createElement(
            HeadingTag,
            {
              style: combinedStyles,
            },
            headingNode.content
          );

      // Skip wrapper for PDF
      if (forPdf) {
        return React.cloneElement(headingElement, { key: index });
      }

      return (
        <InteractiveNode
          key={index}
          nodeType="heading"
          nodePath={currentPath}
          nodeContent={headingNode.content}
          elementType={HeadingTag}
          elementStyles={combinedStyles}
        >
          {headingElement}
        </InteractiveNode>
      );
    }

    case 'list': {
      const listNode = node as ListNodeType;
      const ListTag = listNode.ordered ? 'ol' : 'ul';

      // Support continuing numbering for split ordered lists
      const startFrom = (listNode as any).startFrom;

      return (
        <ListTag
          key={index}
          start={startFrom} // HTML ol supports start attribute
          style={{
            marginTop: isFirstOnPage && index === 0 ? 0 : '0.5rem',
            marginBottom: '0.5rem',
            paddingLeft: '2rem',
            listStyleType: listNode.ordered ? 'decimal' : 'disc',
            listStylePosition: 'outside',
          }}
        >
          {listNode.children.map((item: ListItemNodeType, i: number) =>
            renderNode(item, i, { ...options, nodePath: currentPath, baseIndex: 0 })
          )}
        </ListTag>
      );
    }

    case 'list-item': {
      const listItemNode = node as ListItemNodeType;

      // For list items, wrap the content inside the li, not the li itself
      return (
        <li
          key={index}
          style={{
            marginBottom: '0.25rem',
            position: 'relative', // For positioning the hover effect
          }}
          data-node-type="list-item"
        >
          {!forPdf ? (
            <InteractiveNode
              nodeType="list-item"
              inline={true}
              nodePath={currentPath}
              nodeContent={
                'content' in listItemNode.children[0] ? listItemNode.children[0].content : ''
              }
            >
              {listItemNode.children.map((child: NodeType, i: number) => {
                const rendered = renderNode(child, i, {
                  ...options,
                  skipWrapper: true,
                  nodePath: currentPath,
                  baseIndex: 0,
                });
                // Remove paragraph wrapper for text in list items but preserve styles
                if (React.isValidElement(rendered) && rendered.type === 'p') {
                  const props = rendered.props as {
                    dangerouslySetInnerHTML?: any;
                    children?: React.ReactNode;
                    style?: React.CSSProperties;
                  };
                  // Extract styles but remove paragraph-specific margins
                  const { margin, marginTop, marginBottom, ...otherStyles } = props.style || {};
                  return props.dangerouslySetInnerHTML ? (
                    <span
                      key={i}
                      style={otherStyles}
                      dangerouslySetInnerHTML={props.dangerouslySetInnerHTML}
                    />
                  ) : (
                    <span key={i} style={otherStyles}>
                      {props.children}
                    </span>
                  );
                }
                return rendered;
              })}
            </InteractiveNode>
          ) : (
            listItemNode.children.map((child: NodeType, i: number) => {
              const rendered = renderNode(child, i, {
                ...options,
                skipWrapper: true,
                nodePath: currentPath,
                baseIndex: 0,
              });
              // Remove paragraph wrapper for text in list items but preserve styles
              if (React.isValidElement(rendered) && rendered.type === 'p') {
                const props = rendered.props as {
                  dangerouslySetInnerHTML?: any;
                  children?: React.ReactNode;
                  style?: React.CSSProperties;
                };
                // Extract styles but remove paragraph-specific margins
                const { margin, marginTop, marginBottom, ...otherStyles } = props.style || {};
                return props.dangerouslySetInnerHTML ? (
                  <span
                    key={i}
                    style={otherStyles}
                    dangerouslySetInnerHTML={props.dangerouslySetInnerHTML}
                  />
                ) : (
                  <span key={i} style={otherStyles}>
                    {props.children}
                  </span>
                );
              }
              return rendered;
            })
          )}
        </li>
      );
    }

    case 'table': {
      const tableNode = node as TableNodeType;
      // Use a special index for the head to avoid conflicts with body rows
      const HEAD_INDEX = -1;
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
              {/* Pass HEAD_INDEX to indicate we're in the head section */}
              {(() => {
                // Render table-head directly without adding another index to the path
                const tableHeadNode = tableNode.head;
                return (
                  <tr>
                    {tableHeadNode.children.map((col: TableColumnNodeType, colIndex: number) => {
                      // Path is [tableIndex, -1, columnIndex]
                      const cellPath = [...currentPath, HEAD_INDEX, colIndex];
                      return (
                        <th
                          key={colIndex}
                          style={{
                            border: '1px solid #ddd',
                            padding: '8px',
                            backgroundColor: '#f5f5f5',
                            fontWeight: 'bold',
                            textAlign: 'left',
                            position: 'relative',
                          }}
                          data-node-type="table-header"
                        >
                          {!forPdf ? (
                            <InteractiveNode
                              nodeType="table-header"
                              inline={true}
                              nodePath={cellPath}
                              nodeContent={
                                col.children[0] && 'content' in col.children[0]
                                  ? col.children[0].content
                                  : ''
                              }
                            >
                              {col.children.map((child: NodeType, j: number) => {
                                const rendered = renderNode(child, j, {
                                  ...options,
                                  skipWrapper: true,
                                  nodePath: cellPath,
                                  baseIndex: 0,
                                });
                                // Remove paragraph wrapper for text in table headers but preserve styles
                                if (React.isValidElement(rendered) && rendered.type === 'p') {
                                  const props = rendered.props as {
                                    dangerouslySetInnerHTML?: any;
                                    children?: React.ReactNode;
                                    style?: React.CSSProperties;
                                  };
                                  // Extract styles but remove paragraph-specific margins
                                  const { margin, marginTop, marginBottom, ...otherStyles } =
                                    props.style || {};
                                  return props.dangerouslySetInnerHTML ? (
                                    <span
                                      key={j}
                                      style={otherStyles}
                                      dangerouslySetInnerHTML={props.dangerouslySetInnerHTML}
                                    />
                                  ) : (
                                    <span key={j} style={otherStyles}>
                                      {props.children}
                                    </span>
                                  );
                                }
                                return rendered;
                              })}
                            </InteractiveNode>
                          ) : (
                            col.children.map((child: NodeType, j: number) => {
                              const rendered = renderNode(child, j, {
                                ...options,
                                skipWrapper: true,
                                nodePath: cellPath,
                                baseIndex: 0,
                              });
                              // Remove paragraph wrapper for text in table headers but preserve styles
                              if (React.isValidElement(rendered) && rendered.type === 'p') {
                                const props = rendered.props as {
                                  dangerouslySetInnerHTML?: any;
                                  children?: React.ReactNode;
                                  style?: React.CSSProperties;
                                };
                                // Extract styles but remove paragraph-specific margins
                                const { margin, marginTop, marginBottom, ...otherStyles } =
                                  props.style || {};
                                return props.dangerouslySetInnerHTML ? (
                                  <span
                                    key={j}
                                    style={otherStyles}
                                    dangerouslySetInnerHTML={props.dangerouslySetInnerHTML}
                                  />
                                ) : (
                                  <span key={j} style={otherStyles}>
                                    {props.children}
                                  </span>
                                );
                              }
                              return rendered;
                            })
                          )}
                        </th>
                      );
                    })}
                  </tr>
                );
              })()}
            </thead>
          )}
          <tbody>
            {tableNode.children.map((row: TableRowNodeType, rowIndex: number) => {
              // Render table-row directly here to have better control over paths
              const tableRowNode = row;
              return (
                <tr key={rowIndex}>
                  {tableRowNode.children.map((col: TableColumnNodeType, colIndex: number) => {
                    // Path is [tableIndex, rowIndex, columnIndex]
                    const cellPath = [...currentPath, rowIndex, colIndex];
                    return (
                      <td
                        key={colIndex}
                        style={{
                          border: '1px solid #ddd',
                          padding: '8px',
                          position: 'relative',
                        }}
                        data-node-type="table-column"
                      >
                        {!forPdf ? (
                          <InteractiveNode
                            nodeType="table-column"
                            inline={true}
                            nodePath={cellPath}
                            nodeContent={
                              col.children[0] && 'content' in col.children[0]
                                ? col.children[0].content
                                : ''
                            }
                          >
                            {col.children.map((child: NodeType, j: number) => {
                              const rendered = renderNode(child, j, {
                                ...options,
                                skipWrapper: true,
                                nodePath: cellPath,
                                baseIndex: 0,
                              });
                              // Remove paragraph wrapper for text in table cells but preserve styles
                              if (React.isValidElement(rendered) && rendered.type === 'p') {
                                const props = rendered.props as {
                                  dangerouslySetInnerHTML?: any;
                                  children?: React.ReactNode;
                                  style?: React.CSSProperties;
                                };
                                // Extract styles but remove paragraph-specific margins
                                const { margin, marginTop, marginBottom, ...otherStyles } =
                                  props.style || {};
                                return props.dangerouslySetInnerHTML ? (
                                  <span
                                    key={j}
                                    style={otherStyles}
                                    dangerouslySetInnerHTML={props.dangerouslySetInnerHTML}
                                  />
                                ) : (
                                  <span key={j} style={otherStyles}>
                                    {props.children}
                                  </span>
                                );
                              }
                              return rendered;
                            })}
                          </InteractiveNode>
                        ) : (
                          col.children.map((child: NodeType, j: number) => {
                            const rendered = renderNode(child, j, {
                              ...options,
                              skipWrapper: true,
                              nodePath: cellPath,
                              baseIndex: 0,
                            });
                            // Remove paragraph wrapper for text in table cells but preserve styles
                            if (React.isValidElement(rendered) && rendered.type === 'p') {
                              const props = rendered.props as {
                                dangerouslySetInnerHTML?: any;
                                children?: React.ReactNode;
                                style?: React.CSSProperties;
                              };
                              // Extract styles but remove paragraph-specific margins
                              const { margin, marginTop, marginBottom, ...otherStyles } =
                                props.style || {};
                              return props.dangerouslySetInnerHTML ? (
                                <span
                                    key={j}
                                    style={otherStyles}
                                    dangerouslySetInnerHTML={props.dangerouslySetInnerHTML}
                                  />
                                ) : (
                                  <span key={j} style={otherStyles}>
                                    {props.children}
                                  </span>
                                );
                              }
                              return rendered;
                            })
                          )}
                        </td>
                      );
                    })}
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }

    case 'table-head': {
      // This case shouldn't be reached anymore since we handle table-head inline in the table case
      // But keeping it for backwards compatibility
      const tableHeadNode = node as TableHeadNodeType;
      return (
        <tr key={index}>
          {tableHeadNode.children.map((col: TableColumnNodeType, colIndex: number) => (
            <th
              key={colIndex}
              style={{
                border: '1px solid #ddd',
                padding: '8px',
                backgroundColor: '#f5f5f5',
                fontWeight: 'bold',
                textAlign: 'left',
              }}
            >
              {col.children.map((child: NodeType, j: number) =>
                renderNode(child, j, { ...options, skipWrapper: true, baseIndex: 0 })
              )}
            </th>
          ))}
        </tr>
      );
    }

    case 'table-row': {
      const tableRowNode = node as TableRowNodeType;
      return (
        <tr key={index}>
          {tableRowNode.children.map((col: TableColumnNodeType, colIndex: number) =>
            renderNode(col, colIndex, { ...options, nodePath: [...currentPath, colIndex], baseIndex: 0 })
          )}
        </tr>
      );
    }

    case 'table-column': {
      const tableColumnNode = node as TableColumnNodeType;

      // For table cells, we need to wrap the content inside the td, not the td itself
      return (
        <td
          key={index}
          style={{
            border: '1px solid #ddd',
            padding: '8px',
            position: 'relative', // For positioning the hover effect
          }}
          data-node-type="table-column"
        >
          {!forPdf ? (
            <InteractiveNode
              nodeType="table-column"
              inline={true}
              nodePath={currentPath}
              nodeContent={
                tableColumnNode.children[0] && 'content' in tableColumnNode.children[0]
                  ? tableColumnNode.children[0].content
                  : ''
              }
            >
              {tableColumnNode.children.map((child: NodeType, j: number) => {
                const rendered = renderNode(child, j, {
                  ...options,
                  skipWrapper: true,
                  nodePath: currentPath,
                  baseIndex: 0,
                });
                // Remove paragraph wrapper for text in table cells but preserve styles
                if (React.isValidElement(rendered) && rendered.type === 'p') {
                  const props = rendered.props as {
                    dangerouslySetInnerHTML?: any;
                    children?: React.ReactNode;
                    style?: React.CSSProperties;
                  };
                  // Extract styles but remove paragraph-specific margins
                  const { margin, marginTop, marginBottom, ...otherStyles } = props.style || {};
                  return props.dangerouslySetInnerHTML ? (
                    <span
                      key={j}
                      style={otherStyles}
                      dangerouslySetInnerHTML={props.dangerouslySetInnerHTML}
                    />
                  ) : (
                    <span key={j} style={otherStyles}>
                      {props.children}
                    </span>
                  );
                }
                return rendered;
              })}
            </InteractiveNode>
          ) : (
            tableColumnNode.children.map((child: NodeType, j: number) => {
              const rendered = renderNode(child, j, {
                ...options,
                skipWrapper: true,
                nodePath: currentPath,
                baseIndex: 0,
              });
              // Remove paragraph wrapper for text in table cells but preserve styles
              if (React.isValidElement(rendered) && rendered.type === 'p') {
                const props = rendered.props as {
                  dangerouslySetInnerHTML?: any;
                  children?: React.ReactNode;
                  style?: React.CSSProperties;
                };
                // Extract styles but remove paragraph-specific margins
                const { margin, marginTop, marginBottom, ...otherStyles } = props.style || {};
                return props.dangerouslySetInnerHTML ? (
                  <span
                    key={j}
                    style={otherStyles}
                    dangerouslySetInnerHTML={props.dangerouslySetInnerHTML}
                  />
                ) : (
                  <span key={j} style={otherStyles}>
                    {props.children}
                  </span>
                );
              }
              return rendered;
            })
          )}
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
          {gridNode.children.map((col: ColumnNodeType, i: number) =>
            renderNode(col, i, { ...options, nodePath: currentPath, baseIndex: 0 })
          )}
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
          {columnNode.children.map((child: NodeType, i: number) =>
            renderNode(child, i, { ...options, nodePath: currentPath, baseIndex: 0 })
          )}
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
