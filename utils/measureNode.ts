// Utility to measure the height of a node when rendered
import { NodeType } from '@/lib/dslValidator';

export function measureNodeHeight(
  node: NodeType,
  container: HTMLElement,
  showVariables: boolean = true,
  isFirstOnPage: boolean = false
): number {
  const tempDiv = document.createElement('div');
  tempDiv.style.cssText = 'position: relative; width: 100%;';
  
  // Create element based on node type
  switch (node.type) {
    case 'text': {
      const p = document.createElement('p');
      p.style.cssText = `
        margin: 0 0 1em 0;
        line-height: 1.5;
        font-size: 12pt;
        font-family: inherit;
        color: #000;
      `;
      
      if (!node.content || node.content.trim() === '') {
        p.innerHTML = '<br>';
      } else {
        let content = node.content;
        if (showVariables) {
          content = content.replace(
            /\$\{([A-Z0-9_]+)\}/g,
            '<span style="display: inline-block; padding: 0.125rem 0.5rem; margin: 0 0.25rem; background: #e3f2fd; color: #1976d2; border-radius: 0.25rem;">$1</span>'
          );
        }
        p.innerHTML = content;
      }
      tempDiv.appendChild(p);
      break;
    }
    
    case 'heading': {
      const level = node.level || 1;
      const h = document.createElement(`h${level}` as keyof HTMLElementTagNameMap);
      const sizes: Record<number, string> = {
        1: '2.5rem',
        2: '2rem',
        3: '1.75rem',
        4: '1.5rem',
        5: '1.25rem',
        6: '1.125rem'
      };
      h.style.cssText = `
        font-size: ${sizes[level]};
        font-weight: bold;
        margin: ${isFirstOnPage ? '0' : '1rem'} 0 0.5rem 0;
        line-height: 1.2;
        color: #000;
      `;
      h.textContent = node.content || '';
      tempDiv.appendChild(h);
      break;
    }
    
    case 'list': {
      const list = document.createElement(node.ordered ? 'ol' : 'ul');
      list.style.cssText = `
        margin: ${isFirstOnPage ? '0' : '0.5rem'} 0 0.5rem 0;
        padding-left: 2rem;
        list-style-type: ${node.ordered ? 'decimal' : 'disc'};
        list-style-position: outside;
      `;
      
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any) => {
          const li = document.createElement('li');
          li.style.cssText = 'margin: 0.25rem 0;';
          
          // Handle list item content
          if (child.type === 'list-item' && child.children) {
            child.children.forEach((itemChild: any) => {
              if (itemChild.type === 'text') {
                const span = document.createElement('span');
                span.textContent = itemChild.content || '';
                li.appendChild(span);
              }
            });
          } else {
            li.textContent = child.content || 'Item';
          }
          
          list.appendChild(li);
        });
      }
      tempDiv.appendChild(list);
      break;
    }
    
    case 'table': {
      const table = document.createElement('table');
      table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        margin: ${isFirstOnPage ? '0' : '1rem'} 0 1rem 0;
      `;
      
      if (node.head) {
        const thead = document.createElement('thead');
        const tr = document.createElement('tr');
        if (node.head.children) {
          node.head.children.forEach((col: any) => {
            const th = document.createElement('th');
            th.style.cssText = 'border: 1px solid #ddd; padding: 0.5rem; text-align: left; font-weight: bold;';
            th.textContent = col.content || '';
            tr.appendChild(th);
          });
        }
        thead.appendChild(tr);
        table.appendChild(thead);
      }
      
      if (node.children && Array.isArray(node.children)) {
        const tbody = document.createElement('tbody');
        node.children.forEach((row: any) => {
          if (row.type === 'table-row') {
            const tr = document.createElement('tr');
            if (row.children) {
              row.children.forEach((col: any) => {
                const td = document.createElement('td');
                td.style.cssText = 'border: 1px solid #ddd; padding: 0.5rem;';
                td.textContent = col.content || '';
                tr.appendChild(td);
              });
            }
            tbody.appendChild(tr);
          }
        });
        table.appendChild(tbody);
      }
      tempDiv.appendChild(table);
      break;
    }
    
    case 'grid': {
      const grid = document.createElement('div');
      const columns = node.columns || 1;
      grid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(${columns}, 1fr);
        gap: 1rem;
        margin: ${isFirstOnPage ? '0' : '1rem'} 0 1rem 0;
      `;
      
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((col: any) => {
          const colDiv = document.createElement('div');
          if (col.children && Array.isArray(col.children)) {
            col.children.forEach((child: any) => {
              if (child.type === 'text') {
                const p = document.createElement('p');
                p.style.cssText = 'margin: 0 0 0.5rem 0;';
                p.textContent = child.content || '';
                colDiv.appendChild(p);
              }
            });
          } else {
            colDiv.textContent = col.content || 'Column content';
          }
          grid.appendChild(colDiv);
        });
      }
      tempDiv.appendChild(grid);
      break;
    }
    
    case 'page-break': {
      // Page breaks have no height
      return 0;
    }
    
    default: {
      const div = document.createElement('div');
      div.style.cssText = 'margin: 0.5rem 0; color: #666;';
      div.textContent = `[Unsupported node type: ${node.type}]`;
      tempDiv.appendChild(div);
    }
  }
  
  // Add to container and measure
  container.appendChild(tempDiv);
  const height = tempDiv.getBoundingClientRect().height;
  container.removeChild(tempDiv);
  
  return height;
}