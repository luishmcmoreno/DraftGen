'use client';

import React, { useState } from 'react';
import { PlateEditor, type Value } from '@draft-gen/ui';
import Link from 'next/link';

export default function PlateEditorTest() {
  const [editorValue, setEditorValue] = useState<Value | undefined>(undefined);
  const [showJson, setShowJson] = useState(false);

  // Sample initial content
  const initialValue: Value = [
    {
      type: 'h1',
      children: [{ text: 'Welcome to Plate Editor Test' }],
    },
    {
      type: 'p',
      children: [
        { text: 'This is a test page for the ' },
        { text: 'Plate.js editor', bold: true },
        { text: ' integration in the DraftGen monorepo.' },
      ],
    },
    {
      type: 'h2',
      children: [{ text: 'Features' }],
    },
    {
      type: 'p',
      children: [{ text: 'Try out these features:' }],
    },
    {
      type: 'p',
      children: [{ text: '• Bold text (Cmd+B)', bold: true }],
      indent: 1,
      listStyleType: 'disc',
    },
    {
      type: 'p',
      children: [{ text: '• Italic text (Cmd+I)', italic: true }],
      indent: 1,
      listStyleType: 'disc',
    },
    {
      type: 'p',
      children: [{ text: '• Underlined text (Cmd+U)', underline: true }],
      indent: 1,
      listStyleType: 'disc',
    },
    {
      type: 'p',
      children: [{ text: '• Code blocks', code: true }],
      indent: 1,
      listStyleType: 'disc',
    },
    {
      type: 'blockquote',
      children: [
        {
          type: 'p',
          children: [{ text: 'This is a blockquote. Great for highlighting important information!' }],
        },
      ],
    },
    {
      type: 'h3',
      children: [{ text: 'Code Example' }],
    },
    {
      type: 'code_block',
      lang: 'javascript',
      children: [
        { type: 'code_line', children: [{ text: 'function hello() {' }] },
        { type: 'code_line', children: [{ text: '  console.log("Hello from Plate.js!");' }] },
        { type: 'code_line', children: [{ text: '}' }] },
      ],
    },
    {
      type: 'h3',
      children: [{ text: 'Tables' }],
    },
    {
      type: 'p',
      children: [{ text: 'Tables are also supported:' }],
    },
    {
      type: 'table',
      children: [
        {
          type: 'tr',
          children: [
            {
              type: 'th',
              children: [{ type: 'p', children: [{ text: 'Feature', bold: true }] }],
            },
            {
              type: 'th',
              children: [{ type: 'p', children: [{ text: 'Status', bold: true }] }],
            },
          ],
        },
        {
          type: 'tr',
          children: [
            {
              type: 'td',
              children: [{ type: 'p', children: [{ text: 'Rich Text Editing' }] }],
            },
            {
              type: 'td',
              children: [{ type: 'p', children: [{ text: '✅ Working' }] }],
            },
          ],
        },
        {
          type: 'tr',
          children: [
            {
              type: 'td',
              children: [{ type: 'p', children: [{ text: 'Tables' }] }],
            },
            {
              type: 'td',
              children: [{ type: 'p', children: [{ text: '✅ Working' }] }],
            },
          ],
        },
        {
          type: 'tr',
          children: [
            {
              type: 'td',
              children: [{ type: 'p', children: [{ text: 'Code Blocks' }] }],
            },
            {
              type: 'td',
              children: [{ type: 'p', children: [{ text: '✅ Working' }] }],
            },
          ],
        },
      ],
    },
    {
      type: 'p',
      children: [{ text: '' }],
    },
    {
      type: 'p',
      children: [
        { text: 'Try using ' },
        { text: '/', kbd: true },
        { text: ' to open the slash command menu for quick element insertion!' },
      ],
    },
  ];

  const handleChange = (value: Value) => {
    setEditorValue(value);
    // Editor value changed: value
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Gallery
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Plate.js Editor Test
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Testing the integrated Plate.js editor from the @draft-gen/ui package
          </p>
        </div>

        {/* Controls */}
        <div className="mb-4 flex gap-4">
          <button
            onClick={() => setShowJson(!showJson)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showJson ? 'Hide' : 'Show'} JSON Output
          </button>
          <button
            onClick={() => {
              setEditorValue(initialValue);
              window.location.reload();
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Reset Editor
          </button>
        </div>

        {/* Editor Container */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 mb-8">
          <PlateEditor
            initialValue={initialValue}
            onChange={handleChange}
            placeholder="Start typing or press / for commands..."
            className="min-h-[500px]"
          />
        </div>

        {/* JSON Output */}
        {showJson && (
          <div className="bg-gray-900 rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Editor Value (JSON)</h2>
            <pre className="bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto">
              <code>{JSON.stringify(editorValue || initialValue, null, 2)}</code>
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            Keyboard Shortcuts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">⌘+B</span> - Bold
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">⌘+I</span> - Italic
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">⌘+U</span> - Underline
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">⌘+E</span> - Code
              </p>
            </div>
            <div>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">/</span> - Slash commands
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">#</span> - Heading
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">*</span> - List
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">```</span> - Code block
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}