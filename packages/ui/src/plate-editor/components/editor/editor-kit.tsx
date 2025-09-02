'use client';

import { type Value, TrailingBlockPlugin } from 'platejs';
import { type TPlateEditor, useEditorRef } from 'platejs/react';

// Import essential plugin kits
import { BasicBlocksKit } from '../../plugins/basic-blocks-kit';
import { BasicMarksKit } from '../../plugins/basic-marks-kit';
import { AlignKit } from '../../plugins/align-kit';
import { AutoformatKit } from '../../plugins/autoformat-kit';
import { BlockMenuKit } from '../../plugins/block-menu-kit';
import { CalloutKit } from '../../plugins/callout-kit';
import { CodeBlockKit } from '../../plugins/code-block-kit';
import { DndKit } from '../../plugins/dnd-kit';
import { ExitBreakKit } from '../../plugins/exit-break-kit';
import { FloatingToolbarKit } from '../../plugins/floating-toolbar-kit';
import { FixedToolbarKit } from '../../plugins/fixed-toolbar-kit';
import { FontKit } from '../../plugins/font-kit';
import { IndentKit } from '../../plugins/indent-kit';
import { LineHeightKit } from '../../plugins/line-height-kit';
import { LinkKit } from '../../plugins/link-kit';
import { ListKit } from '../../plugins/list-kit';
import { MarkdownKit } from '../../plugins/markdown-kit';
import { BlockSelectionKit } from '../../plugins/block-selection-kit';
import { SlashKit } from '../../plugins/slash-kit';
import { TableKit } from '../../plugins/table-kit';

// Simplified EditorKit with essential plugins for document generation
export const EditorKit = [
  // Elements
  ...BasicBlocksKit,
  ...CodeBlockKit,
  ...TableKit,
  ...CalloutKit,
  ...LinkKit,
  
  // Marks
  ...BasicMarksKit,
  ...FontKit,
  
  // Block Style
  ...ListKit,
  ...AlignKit,
  ...LineHeightKit,
  ...IndentKit,
  
  // Editing
  ...SlashKit,
  ...AutoformatKit,
  ...BlockMenuKit,
  ...DndKit,
  ...ExitBreakKit,
  TrailingBlockPlugin,
  
  // Selection
  ...BlockSelectionKit,
  
  // Parsers
  ...MarkdownKit,
  
  // UI
  ...FixedToolbarKit,
  ...FloatingToolbarKit,
];

export type MyEditor = TPlateEditor<Value, (typeof EditorKit)[number]>;

// Add explicit return type to avoid type inference issues
export const useEditor = (): MyEditor | null => {
  return useEditorRef<MyEditor>();
};