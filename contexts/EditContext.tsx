'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface EditState {
  editingPath: number[] | null;
  editingContent: string | null;
}

interface EditContextType {
  editingPath: number[] | null;
  editingContent: string | null;
  startEditing: (path: number[], content: string) => void;
  cancelEditing: () => void;
  saveEdit: (newContent: string, forPath?: number[]) => void;
  isCurrentlyEditing: () => boolean;
  onDslUpdate?: (updater: (dsl: any) => any) => void;
}

export const EditContext = createContext<EditContextType | undefined>(undefined);

export function EditProvider({ 
  children, 
  onDslUpdate 
}: { 
  children: React.ReactNode;
  onDslUpdate?: (updater: (dsl: any) => any) => void;
}) {
  const [editState, setEditState] = useState<EditState>({
    editingPath: null,
    editingContent: null
  });

  const isCurrentlyEditing = useCallback(() => {
    return editState.editingPath !== null;
  }, [editState.editingPath]);

  const startEditing = useCallback((path: number[], content: string) => {
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

  const saveEdit = useCallback((newContent: string, forPath?: number[]) => {
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
      
      // Create a shallow copy with updated children array
      const updatedDsl = {
        ...dsl,
        children: [...dsl.children]
      };
      
      // Navigate and update only the necessary parts
      let current: any = updatedDsl;
      
      // Navigate to the target node
      for (let i = 0; i < path.length; i++) {
        const index = path[i];
        
        if (i === path.length - 1) {
          // Last step - update the target node
          const targetNode = current.children[index];
          
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
          // Clone the child node we're navigating into
          const childNode = current.children[index];
          const clonedChild = {
            ...childNode,
            children: childNode.children ? [...childNode.children] : undefined
          };
          
          // Update parent's children array
          current.children = [
            ...current.children.slice(0, index),
            clonedChild,
            ...current.children.slice(index + 1)
          ];
          
          current = clonedChild;
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
export function isPathBeingEdited(currentPath: number[], editingPath: number[] | null): boolean {
  if (!editingPath) return false;
  if (currentPath.length !== editingPath.length) return false;
  return currentPath.every((val, index) => val === editingPath[index]);
}