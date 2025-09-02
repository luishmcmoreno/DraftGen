'use client';

import { type Value, TrailingBlockPlugin } from 'platejs';
import { type TPlateEditor, useEditorRef } from 'platejs/react';

// Import minimal plugin kits for AI chat
import { BasicBlocksKit } from '../../plugins/basic-blocks-kit';
import { BasicMarksKit } from '../../plugins/basic-marks-kit';

// Minimal EditorKit for AI chat functionality
export const EditorBaseKit = [
  ...BasicBlocksKit,
  ...BasicMarksKit,
  TrailingBlockPlugin,
];

// Also export as BaseEditorKit for compatibility
export const BaseEditorKit = EditorBaseKit;

export type BaseEditor = TPlateEditor<Value, (typeof EditorBaseKit)[number]>;

// Add explicit return type to avoid type inference issues
export const useBaseEditor = (): BaseEditor | null => {
  return useEditorRef<BaseEditor>();
};