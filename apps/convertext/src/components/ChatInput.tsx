import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@draft-gen/ui';
import { Textarea } from '@draft-gen/ui';
import { Send, Upload } from 'lucide-react';

interface ChatInputProps {
  onSubmit: (taskDescription: string, text: string, exampleOutput?: string) => void;
  loading?: boolean;
  placeholder?: string;
  initialTask?: string;
  initialText?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSubmit,
  loading = false,
  placeholder = 'Describe what you want to do with your text...',
  initialTask,
  initialText,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskDescription.trim()) return;

    onSubmit(taskDescription.trim(), text.trim(), exampleOutput.trim() || undefined);
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
      handleSubmit(e);
    }
  };

  const isValid = taskDescription.trim().length > 0;

  return (
    <div className="border-t border-border bg-card px-4 py-4">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="space-y-4">
          {/* Task input with Send button */}
          <div className="flex space-x-3">
            <div className="flex-1">
              <Textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full resize-none text-sm"
                rows={1}
                style={{
                  minHeight: '44px',
                  height: Math.min(120, Math.max(44, taskDescription.split('\n').length * 20 + 24)),
                }}
                disabled={loading}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={!isValid || loading} className="px-4 py-3">
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </div>
                )}
              </Button>
            </div>
          </div>

          {/* Keyboard tip below task input */}
          {taskDescription && !loading && (
            <div className="text-xs text-muted-foreground text-center -mt-2">
              Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">⌘ Enter</kbd> or
              <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl Enter</kbd> to send
            </div>
          )}

          {/* Content input - always visible */}
          <div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your content here (optional)..."
              className="w-full resize-none text-sm"
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Advanced options */}
          {taskDescription && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-primary hover:text-primary/80 font-medium"
                disabled={loading}
              >
                {showAdvanced ? 'Hide' : 'Show'} advanced options
              </button>

              {showAdvanced && (
                <div className="space-y-3 p-3 bg-muted/50 rounded-lg border border-border">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Example Output (optional)
                    </label>
                    <Textarea
                      value={exampleOutput}
                      onChange={(e) => setExampleOutput(e.target.value)}
                      placeholder="Show an example of how you want the output to look..."
                      className="w-full resize-none text-sm"
                      rows={2}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
