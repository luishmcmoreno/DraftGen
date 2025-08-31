import { DocumentSchema, NodeType } from '@/lib/dslValidator';

/**
 * Updates a node in the DSL tree at the specified path
 * @param dsl The document schema to update
 * @param path Array of indices representing the path to the node
 * @param newContent The new content for the node
 * @returns Updated DSL
 */
export function updateNodeContent(
  dsl: DocumentSchema,
  path: number[],
  newContent: string
): DocumentSchema {
  // Deep clone the DSL to avoid mutations
  const updatedDsl = JSON.parse(JSON.stringify(dsl));

  // Navigate to the target node
  let current: any = updatedDsl;
  const pathToParent = path.slice(0, -1);
  const targetIndex = path[path.length - 1];

  // Navigate to parent
  for (const index of pathToParent) {
    if (current.children && current.children[index]) {
      current = current.children[index];
    } else {
      console.error('Invalid path:', path);
      return dsl; // Return original if path is invalid
    }
  }

  // Update the target node
  if (current.children && current.children[targetIndex]) {
    const targetNode = current.children[targetIndex];
    updateNodeContentByType(targetNode, newContent);
  }

  return updatedDsl;
}

/**
 * Updates node content based on its type
 */
function updateNodeContentByType(node: any, newContent: string): void {
  switch (node.type) {
    case 'text':
    case 'heading':
      // Direct content update
      node.content = newContent;
      break;

    case 'list-item':
    case 'table-column':
    case 'column':
      // For container nodes, update the first text child
      if (node.children && node.children.length > 0) {
        const firstChild = node.children[0];
        if (firstChild.type === 'text') {
          firstChild.content = newContent;
        } else if (firstChild.type === 'heading') {
          firstChild.content = newContent;
        }
      }
      break;

    default:
      console.warn(`Cannot update content for node type: ${node.type}`);
  }
}

/**
 * Gets the editable content from a node
 */
export function getNodeContent(node: NodeType): string {
  if ('content' in node) {
    return node.content;
  }

  // For container nodes, get content from first text child
  if ('children' in node && Array.isArray(node.children) && node.children.length > 0) {
    const firstChild = node.children[0];
    if ('content' in firstChild) {
      return firstChild.content;
    }
  }

  return '';
}

/**
 * Validates if a path points to an editable node
 */
export function isEditableNode(dsl: DocumentSchema, path: number[]): boolean {
  let current: any = dsl;

  for (let i = 0; i < path.length; i++) {
    const index = path[i];
    if (current.children && current.children[index]) {
      current = current.children[index];
    } else {
      return false;
    }
  }

  // Check if node type is editable
  const editableTypes = ['text', 'heading', 'list-item', 'table-column', 'column'];
  return editableTypes.includes(current.type);
}

/**
 * Creates a path array for a node in the DSL tree
 */
export function createNodePath(indices: number[]): number[] {
  return indices;
}

/**
 * Compares two paths for equality
 */
export function pathsEqual(path1: number[], path2: number[]): boolean {
  if (path1.length !== path2.length) return false;
  return path1.every((val, index) => val === path2[index]);
}
