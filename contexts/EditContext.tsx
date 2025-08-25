'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type PathSegment = number | string;
export type NodePath = PathSegment[];

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
  onDslUpdate?: (updater: (dsl: unknown) => unknown) => void;
}

export const EditContext = createContext<EditContextType | undefined>(undefined);

export function EditProvider({ 
  children, 
  onDslUpdate 
}: { 
  children: React.ReactNode;
  onDslUpdate?: (updater: (dsl: unknown) => unknown) => void;
}) {
  const [editState, setEditState] = useState<EditState>({
    editingPath: null,
    editingContent: null
  });

  const isCurrentlyEditing = useCallback(() => {
    return editState.editingPath !== null;
  }, [editState.editingPath]);

  const startEditing = useCallback((path: NodePath, content: string) => {
    setEditState({
      editingPath: path,
      editingContent: content
    });
  }, []);

  const cancelEditing = useCallback(() => {
    setEditState({
      editingPath: null,
      editingContent: null
    });
  }, []);

  const saveEdit = useCallback((newContent: string, forPath?: NodePath) => {
    // Capture the path immediately to avoid any state changes affecting it
    const pathToUse = forPath || editState.editingPath;
    
    if (!pathToUse || !onDslUpdate) {
      if (!forPath) cancelEditing();
      return;
    }

    // Don't save if content is empty (would delete the node)
    if (!newContent || newContent.trim() === '') {
      if (!forPath) cancelEditing();
      return;
    }

    // Update the DSL with the new content more efficiently
    onDslUpdate((dsl) => {
      // Only clone the parts we're modifying, not the entire tree
      const path = pathToUse;
      
      if (!path) return dsl; // Early return if no path
      
      // Cast to any for navigation - the DSL structure is validated elsewhere
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dslAny = dsl as any;
      
      // Create a shallow copy with updated children array
      const updatedDsl = {
        ...dslAny,
        children: [...dslAny.children]
      };
      
      // Navigate and update only the necessary parts
      // Using any here is necessary for dynamic navigation through the DSL tree
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let current: any = updatedDsl;
      
      // Navigate to the target node
      for (let i = 0; i < path.length; i++) {
        const segment = path[i];
        
        // Handle numeric indices
        if (typeof segment === 'number') {
          const index = segment;
          
          // Special handling for table head (index -1)
          if (index === -1) {
            if (current.type === 'table' && current.head) {
              if (i === path.length - 1) {
                // This shouldn't happen - head should have children
                return dsl;
              }
              // Clone the head and continue
              const clonedHead = { ...current.head, children: [...current.head.children] };
              current.head = clonedHead;
              current = clonedHead;
            } else {
              // Error: trying to access -1 on non-table
              return dsl;
            }
            continue;
          }
          
          if (i === path.length - 1) {
            // Last step - update the target node
            const targetNode = current.children ? current.children[index] : undefined;
            
            if (!targetNode) {
              return dsl;
            }
            
            // Create new node with updated content
            let updatedNode;
            if (targetNode.type === 'text' || targetNode.type === 'heading') {
              updatedNode = {
                ...targetNode,
                content: newContent
              };
            } else if (targetNode.type === 'list-item' || 
                       targetNode.type === 'table-column' || 
                       targetNode.type === 'column') {
              // For container nodes, update the first text child
              if (targetNode.children && targetNode.children[0]) {
                updatedNode = {
                  ...targetNode,
                  children: [
                    {
                      ...targetNode.children[0],
                      content: newContent
                    },
                    ...targetNode.children.slice(1)
                  ]
                };
              } else {
                updatedNode = targetNode;
              }
            } else {
              updatedNode = targetNode;
            }
            
            // Update the children array at this level
            current.children = [
              ...current.children.slice(0, index),
              updatedNode,
              ...current.children.slice(index + 1)
            ];
          } else {
            // Intermediate step - clone and continue navigation
            if (current.children && current.children[index]) {
              // Clone the child node we're navigating into
              const childNode = current.children[index];
              const clonedChild = {
                ...childNode,
                children: childNode.children ? [...childNode.children] : undefined,
                head: childNode.head ? { ...childNode.head, children: [...childNode.head.children] } : undefined
              };
              
              // Update parent's children array
              current.children = [
                ...current.children.slice(0, index),
                clonedChild,
                ...current.children.slice(index + 1)
              ];
              
              current = clonedChild;
            } else {
              return dsl;
            }
          }
        } else {
          // String segments - currently not supported
          return dsl;
        }
      }
      
      return updatedDsl;
    });

    if (!forPath) cancelEditing();
  }, [editState.editingPath, onDslUpdate, cancelEditing]);

  return (
    <EditContext.Provider value={{
      editingPath: editState.editingPath,
      editingContent: editState.editingContent,
      startEditing,
      cancelEditing,
      saveEdit,
      isCurrentlyEditing,
      onDslUpdate
    }}>
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