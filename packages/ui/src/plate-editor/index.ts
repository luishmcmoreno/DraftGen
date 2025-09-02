// Main editor component
export { PlateEditor, defaultValue } from './components/editor/plate-editor';
export type { PlateEditorProps } from './components/editor/plate-editor';

// Editor kit and types
export { EditorKit, useEditor } from './components/editor/editor-kit';
export type { MyEditor } from './components/editor/editor-kit';

// Export Value type from platejs for consumers
export type { Value } from 'platejs';

// Re-export slate types to ensure they're available
export type { Editor, Element, Node, Text } from 'slate';
export type { RenderElementProps, RenderLeafProps } from 'slate-react';