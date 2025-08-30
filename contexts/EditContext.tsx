'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  DocumentSchema,
  NodeType,
  TableHeadNodeType,
  isDirectContentNode,
  isTextContainerNode,
} from '@/lib/dslValidator';

export type PathSegment = number | string;
export type NodePath = PathSegment[];

// Result type for update operations
type UpdateResult = 
  | { success: true; data: DocumentSchema }
  | { success: false; error: string };

// Specific types for nodes with certain properties
// These are more precise versions without index signatures
type NodeWithChildren = 
  | DocumentSchema
  | NodeType
  | { type: string; children: NodeType[] };

type TableNodeWithHead = Extract<NodeType, { head: TableHeadNodeType }> & {
  head: TableHeadNodeType;
};

// Union type for all possible nodes during tree traversal
type NavigableNode = 
  | DocumentSchema 
  | NodeType;

// Type guard to check if a node has children
function hasChildren(node: NavigableNode): node is NodeWithChildren {
  return 'children' in node && Array.isArray(node.children);
}

// Type guard to check if a node is a table with head
function isTableWithHead(node: NavigableNode): node is TableNodeWithHead {
  return 'head' in node && 
         node.head !== undefined && 
         'children' in node.head && 
         Array.isArray(node.head.children);
}

interface EditState {
  editingPath: NodePath | null;
  editingContent: string | null;
}

interface EditContextType {
  editingPath: NodePath | null;
  editingContent: string | null;
  startEditing: (path: NodePath, content: string) => void;
  cancelEditing: () => void;
  saveEdit: (newContent: string, forPath?: NodePath) => void;
  isCurrentlyEditing: () => boolean;
  onDslUpdate?: (updater: (dsl: DocumentSchema) => DocumentSchema) => void;
}

export const EditContext = createContext<EditContextType | undefined>(undefined);

// Helper function to validate a path through the DSL tree
function validatePath(node: NavigableNode, path: NodePath, index: number = 0): boolean {
  // Base case: we've validated the entire path
  if (index >= path.length) {
    return true;
  }

  const segment = path[index];
  
  // Only numeric indices are valid
  if (typeof segment !== 'number') {
    return false;
  }

  // Special case: -1 for table head
  if (segment === -1) {
    if (!isTableWithHead(node)) {
      return false; // -1 is only valid for tables with heads
    }
    return validatePath(node.head, path, index + 1);
  }

  // Regular index: check if node has children and index is valid
  if (!hasChildren(node)) {
    return false;
  }

  if (segment < 0 || segment >= node.children.length) {
    return false; // Index out of bounds
  }

  // Continue validation with the child node
  return validatePath(node.children[segment], path, index + 1);
}

// Recursive helper to immutably update a node at a specific path
function recursiveUpdate(
  node: NavigableNode,
  path: NodePath,
  currentIndex: number,
  newContent: string
): NavigableNode | null {
  // Base case: we've reached the target node
  if (currentIndex === path.length) {
    // We can only update NodeType nodes, not DocumentSchema
    if ('type' in node && node.type !== 'document') {
      return createUpdatedNode(node as NodeType, newContent);
    }
    return null;
  }

  const segment = path[currentIndex];
  
  // Only handle numeric segments
  if (typeof segment !== 'number') {
    return null;
  }

  // Handle table head navigation (index -1)
  if (segment === -1) {
    if (!isTableWithHead(node)) {
      return null;
    }

    const updatedHead = recursiveUpdate(
      node.head,
      path,
      currentIndex + 1,
      newContent
    );

    if (!updatedHead) {
      return null;
    }

    // Return new table node with updated head
    return {
      ...node,
      head: updatedHead as TableHeadNodeType
    };
  }

  // Handle regular array indices
  if (!hasChildren(node) || segment < 0 || segment >= node.children.length) {
    return null;
  }

  const updatedChild = recursiveUpdate(
    node.children[segment],
    path,
    currentIndex + 1,
    newContent
  );

  if (!updatedChild) {
    return null;
  }

  // Create new node with updated children array
  const newChildren = [...node.children];
  newChildren[segment] = updatedChild as NodeType;

  return {
    ...node,
    children: newChildren
  };
}

// Helper function to create an updated node with new content
function createUpdatedNode(node: NodeType, newContent: string): NodeType {
  // Direct content nodes (text or heading)
  if (isDirectContentNode(node)) {
    return {
      ...node,
      content: newContent,
    };
  }
  
  // Container nodes that wrap text content
  if (isTextContainerNode(node)) {
    if (node.children && node.children[0]) {
      return {
        ...node,
        children: [
          { ...node.children[0], content: newContent },
          ...node.children.slice(1),
        ],
      };
    }
  }
  
  return node;
}

// Main function to update a node at a specific path in the DSL tree
function updateNodeAtPath(dsl: DocumentSchema, path: NodePath, newContent: string): UpdateResult {
  // Validate inputs
  if (!path || path.length === 0) {
    return { success: false, error: 'Invalid path: path cannot be empty' };
  }

  if (!newContent || newContent.trim() === '') {
    return { success: false, error: 'Invalid content: content cannot be empty' };
  }

  // Validate the path exists in the tree
  if (!validatePath(dsl, path)) {
    return { 
      success: false, 
      error: `Invalid path: [${path.join(', ')}] does not exist in the document` 
    };
  }

  // Perform the immutable update
  const updated = recursiveUpdate(dsl, path, 0, newContent);

  if (!updated) {
    return { 
      success: false, 
      error: 'Failed to update node: target node may not be editable' 
    };
  }

  // Ensure the result is a valid DocumentSchema
  if (!('type' in updated) || updated.type !== 'document') {
    return { 
      success: false, 
      error: 'Internal error: update resulted in invalid document structure' 
    };
  }

  return { success: true, data: updated as DocumentSchema };
}

export function EditProvider({
  children,
  onDslUpdate,
}: {
  children: React.ReactNode;
  onDslUpdate?: (updater: (dsl: DocumentSchema) => DocumentSchema) => void;
}) {
  const [editState, setEditState] = useState<EditState>({
    editingPath: null,
    editingContent: null,
  });

  const isCurrentlyEditing = useCallback(() => {
    return editState.editingPath !== null;
  }, [editState.editingPath]);

  const startEditing = useCallback((path: NodePath, content: string) => {
    setEditState({
      editingPath: path,
      editingContent: content,
    });
  }, []);

  const cancelEditing = useCallback(() => {
    setEditState({
      editingPath: null,
      editingContent: null,
    });
  }, []);

  const saveEdit = useCallback(
    (newContent: string, forPath?: NodePath) => {
      // Use the provided path or the current editing path
      const path = forPath || editState.editingPath;

      // Validate inputs
      if (!path || !onDslUpdate) {
        if (!forPath) cancelEditing();
        return;
      }

      // Don't save if content is empty
      if (!newContent || newContent.trim() === '') {
        if (!forPath) cancelEditing();
        return;
      }

      // Update the DSL using our helper function
      onDslUpdate((dsl) => {
        const result = updateNodeAtPath(dsl, path, newContent);
        
        if (result.success) {
          return result.data;
        } else {
          // Log error for debugging (in production, you might want to show a toast)
          console.error('Failed to update node:', result.error);
          return dsl; // Return unchanged DSL on error
        }
      });

      // Clear editing state if this wasn't an external edit
      if (!forPath) cancelEditing();
    },
    [editState.editingPath, onDslUpdate, cancelEditing]
  );

  return (
    <EditContext.Provider
      value={{
        editingPath: editState.editingPath,
        editingContent: editState.editingContent,
        startEditing,
        cancelEditing,
        saveEdit,
        isCurrentlyEditing,
        onDslUpdate,
      }}
    >
      {children}
    </EditContext.Provider>
  );
}

export function useEdit() {
  const context = useContext(EditContext);
  if (!context) {
    throw new Error('useEdit must be used within an EditProvider');
  }
  return context;
}

// Helper to check if a path is being edited
export function isPathBeingEdited(currentPath: NodePath, editingPath: NodePath | null): boolean {
  if (!editingPath) return false;
  if (currentPath.length !== editingPath.length) return false;
  return currentPath.every((val, index) => val === editingPath[index]);
}
