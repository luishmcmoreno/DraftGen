'use client';

import * as React from 'react';
import { Plate, usePlateEditor } from 'platejs/react';
import { type Value } from 'platejs';
import { Editor, EditorContainer } from '../ui/editor';
import { EditorKit } from './editor-kit';

export interface PlateEditorProps {
  initialValue?: Value;
  onChange?: (value: Value) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  variant?: 'default' | 'demo';
}

export function PlateEditor({
  initialValue,
  onChange,
  placeholder = 'Start typing...',
  readOnly = false,
  className,
  variant = 'default',
}: PlateEditorProps) {
  const editor = usePlateEditor({
    plugins: EditorKit,
    value: initialValue,
  });

  // Handle onChange through Plate's onChange prop
  React.useEffect(() => {
    if (onChange && editor) {
      // Call onChange with current value whenever it changes
      onChange(editor.children);
    }
  }, [editor, editor?.children, onChange]);

  return (
    <Plate editor={editor}>
      <EditorContainer className={className}>
        <Editor
          variant={variant}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      </EditorContainer>
    </Plate>
  );
}

// Default initial value for demonstration
export const defaultValue: Value = [
  {
    type: 'p',
    children: [{ text: '' }],
  },
];