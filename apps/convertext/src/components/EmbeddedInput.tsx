import React, { useState, useRef, useEffect } from 'react';

interface EmbeddedInputProps {
  onExecute: (taskDescription: string, text: string, exampleOutput?: string) => void;
  loading?: boolean;
  initialTask?: string;
  initialText?: string;
  placeholder?: string;
}

const EmbeddedInput: React.FC<EmbeddedInputProps> = ({ 
  onExecute, 
  loading = false, 
  placeholder = "Describe what you want to do with your text...",
  initialTask,
  initialText
}) => {
  const [taskDescription, setTaskDescription] = useState('');
  const [text, setText] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [exampleOutput, setExampleOutput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle initial values from examples
  useEffect(() => {
    if (initialTask) {
      setTaskDescription(initialTask);
    }
    if (initialText) {
      setText(initialText);
    }
  }, [initialTask, initialText]);

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskDescription.trim()) return;
    
    onExecute(taskDescription.trim(), text.trim(), exampleOutput.trim() || undefined);
    setTaskDescription('');
    setText('');
    setExampleOutput('');
    setShowAdvanced(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileText = e.target?.result as string;
        setText(fileText);
      };
      reader.readAsText(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !loading) {
      e.preventDefault();
      handleExecute(e);
    }
  };

  const isValid = taskDescription.trim().length > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8 max-w-4xl mx-auto">
      <form onSubmit={handleExecute}>
        <div className="space-y-4">
          {/* Task input with Send button */}
          <div className="flex space-x-3">
            <div className="flex-1">
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full resize-none rounded-lg border-slate-300 bg-slate-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-3"
                rows={1}
                style={{
                  minHeight: '44px',
                  height: Math.min(120, Math.max(44, taskDescription.split('\n').length * 20 + 24))
                }}
                disabled={loading}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={!isValid || loading}
                className={`px-4 py-3 rounded-lg font-medium text-sm transition-all ${ 
                  isValid && !loading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Execute</span>
                  </div>
                )}
              </button>
            </div>
          </div>


          {/* Keyboard tip below task input */}
          {taskDescription && !loading && (
            <div className="text-xs text-slate-500 text-center -mt-2">
              Press <kbd className="px-1 py-0.5 bg-slate-200 rounded text-xs">⌘ Enter</kbd> or 
              <kbd className="px-1 py-0.5 bg-slate-200 rounded text-xs">Ctrl Enter</kbd> to send
            </div>
          )}

          {/* Content input - always visible */}
          <div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your content here (optional)..."
              className="w-full resize-none rounded-lg border-slate-300 bg-slate-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-3"
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Advanced options */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              disabled={loading}
            >
              {showAdvanced ? 'Hide' : 'Show'} advanced options
            </button>
            
            {showAdvanced && (
              <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Example Output (optional)
                  </label>
                  <textarea
                    value={exampleOutput}
                    onChange={(e) => setExampleOutput(e.target.value)}
                    placeholder="Show an example of how you want the output to look..."
                    className="w-full resize-none rounded-lg border-slate-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2"
                    rows={2}
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Upload File
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    accept=".txt,.md,.csv"
                    className="hidden"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs rounded-lg transition-colors"
                    disabled={loading}
                  >
                    Choose File
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default EmbeddedInput;
