import React, { useState, useEffect } from 'react';
import { TextConversionResponse } from '../types/conversion';

interface ResultDisplayProps {
  result: TextConversionResponse;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);
  const [editableText, setEditableText] = useState(result.converted_text);

  useEffect(() => {
    setEditableText(result.converted_text);
  }, [result.converted_text]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (result.render_mode === 'output') {
    return (
      <div className="bg-muted/50 border border-border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-foreground">Result:</h2>
          <button
            onClick={handleCopy}
            className="ml-2 px-5 py-2 rounded bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {copied ? 'Copied!' : 'Copy Result'}
          </button>
        </div>
        <pre className="text-sm text-foreground whitespace-pre-wrap overflow-x-auto max-h-[400px] overflow-y-auto">
          {editableText}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 border border-border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-foreground">Conversion Result</h2>
          <button
            onClick={handleCopy}
            className="ml-2 px-5 py-2 rounded bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {copied ? 'Copied!' : 'Copy Result'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Original Text</h3>
            <div className="bg-muted/50 p-4 rounded-lg">
              <pre className="text-sm text-foreground whitespace-pre-wrap overflow-x-auto max-h-[400px] overflow-y-auto">
                {result.original_text}
              </pre>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Converted Text</h3>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <textarea
                className="text-sm text-foreground whitespace-pre-wrap overflow-x-auto max-h-[400px] overflow-y-auto w-full bg-background border-none focus:ring-0 resize-vertical"
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                rows={Math.max(3, Math.min(20, editableText.split('\n').length))}
                suppressHydrationWarning={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
