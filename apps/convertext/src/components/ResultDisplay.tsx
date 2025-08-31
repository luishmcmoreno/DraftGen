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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (result.render_mode === 'output') {
    return (
      <div className="bg-slate-50 border border-slate-300 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-slate-800">Result:</h2>
          <button
            onClick={handleCopy}
            className="ml-2 px-5 py-2 rounded bg-teal-500 text-white text-base font-medium hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            {copied ? 'Copied!' : 'Copy Result'}
          </button>
        </div>
        <pre className="text-sm text-slate-700 whitespace-pre-wrap overflow-x-auto max-h-[400px] overflow-y-auto">
          {editableText}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 border border-slate-300 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-slate-800">Conversion Result</h2>
          <button
            onClick={handleCopy}
            className="ml-2 px-5 py-2 rounded bg-teal-500 text-white text-base font-medium hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            {copied ? 'Copied!' : 'Copy Result'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-slate-600 mb-2">
              Original Text
            </h3>
            <div className="bg-slate-50 p-4 rounded-lg">
              <pre className="text-sm text-slate-700 whitespace-pre-wrap overflow-x-auto max-h-[400px] overflow-y-auto">
                {result.original_text}
              </pre>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">
                Converted Text
              </h3>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <textarea
                className="text-sm text-slate-700 whitespace-pre-wrap overflow-x-auto max-h-[400px] overflow-y-auto w-full bg-slate-50 border-none focus:ring-0 resize-vertical"
                value={editableText}
                onChange={e => setEditableText(e.target.value)}
                rows={Math.max(3, Math.min(20, editableText.split('\n').length))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
 