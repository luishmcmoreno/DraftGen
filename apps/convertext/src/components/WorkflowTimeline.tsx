import React, { useState, useEffect, useRef } from 'react';
import { WorkflowStep as WorkflowStepType, SavedConversionRoutine, ConversionRoutineStepTemplate } from '../types/conversion';
import WorkflowStep from './WorkflowStep';
import EmbeddedInput from './EmbeddedInput';

interface ExampleTile {
  title: string;
  description: string;
  task: string;
  sampleInput?: string;
  icon: string;
  category: 'CSV' | 'Text' | 'Format' | 'Data';
}

interface WorkflowTimelineProps {
  steps: WorkflowStepType[];
  provider: string;
  onProviderChange: (provider: string) => void;
  onContinue?: (taskDescription: string, text: string, exampleOutput?: string) => void;
  onExampleSelect?: (task: string, sampleInput?: string) => void;
  onUseAsInput?: (text: string) => void;
  onSaveWorkflow?: () => void;
  onSaveConversionRoutine?: (routine: SavedConversionRoutine) => void;
  onOpenWorkflowLibrary?: () => void;
  onAddNewStep?: (previousResult: string) => void;
  initialTask?: string;
  initialText?: string;
  loading?: boolean;
}

const PROVIDERS = [
  { label: 'Mock Agent', value: 'mock' },
  { label: 'OpenAI', value: 'openai', disabled: true },
  { label: 'Gemini', value: 'gemini' },
];

const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({ 
  steps, 
  provider,
  onProviderChange,
  onContinue, 
  onExampleSelect,
  onUseAsInput,
  onSaveConversionRoutine,
  onOpenWorkflowLibrary,
  onAddNewStep,
  initialTask,
  initialText,
  loading 
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showSaveConversionRoutineModal, setShowSaveConversionRoutineModal] = useState(false);
  const [routineName, setRoutineName] = useState('My Conversion Routine');
  const [routineDescription, setRoutineDescription] = useState('');

  const examples: ExampleTile[] = [
    {
      title: "Remove Duplicate Rows",
      description: "Clean up CSV files by removing duplicate entries",
      task: "Remove duplicate rows from this CSV data",
      sampleInput: "name,email,age\nJohn,john@email.com,25\nJane,jane@email.com,30\nJohn,john@email.com,25",
      icon: "🗑️",
      category: "CSV"
    },
    {
      title: "Capitalize All Words",
      description: "Transform text to title case formatting",
      task: "Capitalize all words in this text",
      sampleInput: "the quick brown fox jumps over the lazy dog",
      icon: "🔤",
      category: "Text"
    },
    {
      title: "Remove CSV Columns",
      description: "Delete specific columns from CSV data",
      task: "Remove the 'age' column from this CSV data",
      sampleInput: "name,email,age,city\nJohn,john@email.com,25,NYC\nJane,jane@email.com,30,LA",
      icon: "📋",
      category: "CSV"
    },
    {
      title: "Convert European Numbers",
      description: "Change European decimal format to American",
      task: "Convert European number format to American format",
      sampleInput: "Price: 1.234,56 €\nQuantity: 2.500,00\nDiscount: 15,5%",
      icon: "🔢",
      category: "Format"
    },
    {
      title: "CSV to JSON",
      description: "Convert CSV data into JSON format",
      task: "Convert this CSV data to JSON format",
      sampleInput: "name,age,city\nAlice,28,Boston\nBob,35,Seattle",
      icon: "📄",
      category: "Data"
    },
    {
      title: "Extract Email Addresses",
      description: "Find and extract all email addresses from text",
      task: "Extract all email addresses from this text",
      sampleInput: "Contact us at support@example.com or sales@company.org. For urgent matters, reach admin@site.net.",
      icon: "📧",
      category: "Text"
    },
    {
      title: "Split Text by Lines",
      description: "Convert paragraph text into separate lines",
      task: "Split this text into separate lines by sentences",
      sampleInput: "This is the first sentence. This is the second sentence. Here's a third one!",
      icon: "📝",
      category: "Text"
    },
    {
      title: "Format Phone Numbers",
      description: "Standardize phone number formatting",
      task: "Format these phone numbers to (XXX) XXX-XXXX format",
      sampleInput: "1234567890\n555.123.4567\n(555) 987-6543\n+1-800-555-0199",
      icon: "📞",
      category: "Format"
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'CSV': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Text': return 'bg-green-50 text-green-700 border-green-200';
      case 'Format': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Data': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-muted/50 text-muted-foreground border-border';
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps.length]);

  const handleSaveConversionRoutine = () => {
    if (!routineName.trim() || !onSaveConversionRoutine) return;

    const routineTemplates: ConversionRoutineStepTemplate[] = steps.map(step => ({
      id: step.id,
      stepNumber: step.stepNumber,
      taskDescription: step.input.taskDescription,
      exampleOutput: step.input.exampleOutput
    }));

    const savedRoutine: SavedConversionRoutine = {
      id: Math.random().toString(36).substr(2, 9),
      name: routineName.trim(),
      description: routineDescription.trim() || undefined,
      steps: routineTemplates,
      createdAt: new Date(),
      usageCount: 0
    };

    onSaveConversionRoutine(savedRoutine);
    setShowSaveConversionRoutineModal(false);
    setRoutineName('');
    setRoutineDescription('');
  };

  if (steps.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6 chat-scroll">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Describe your task below or choose from our examples to start building your conversion routine.
            </p>
          </div>

          {onContinue && (
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-6 sticky top-0 z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label htmlFor="provider-select" className="text-sm font-medium text-foreground">
                      AI Model:
                    </label>
                    <select
                      id="provider-select"
                      value={provider}
                      onChange={(e) => onProviderChange(e.target.value)}
                      className="rounded-lg border-input bg-background shadow-sm focus:border-ring focus:ring-ring text-sm px-3 py-2"
                      disabled={loading}
                    >
                      {PROVIDERS.map(opt => (
                        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                
              </div>
              
              <EmbeddedInput
                onExecute={onContinue}
                loading={loading}
                initialTask={initialTask}
                initialText={initialText}
              />
            </div>
          )}

          <div className="mb-8">
            <h4 className="text-lg font-semibold text-foreground mb-4 text-center">Not sure how to start? Try these examples:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {examples.map((example, index) => (
                <div
                  key={index}
                  onClick={() => onExampleSelect?.(example.task, example.sampleInput)}
                  className="group cursor-pointer bg-card border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-2xl">{example.icon}</div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(example.category)}`}>
                      {example.category}
                    </span>
                  </div>
                  <h5 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {example.title}
                  </h5>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {example.description}
                  </p>
                  <div className="mt-3 flex items-center text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Try this example
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Conversion Routine Header */}
      <div className="bg-card border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <input
                type="text"
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                className="text-xl font-semibold text-foreground bg-transparent border-none focus:ring-0 p-0"
              />
              <textarea
                value={routineDescription}
                onChange={(e) => setRoutineDescription(e.target.value)}
                placeholder="Add a description..."
                className="text-sm text-muted-foreground bg-transparent mt-1 w-full border-none focus:ring-0 p-0 resize-none"
                rows={1}
              />
            </div>
            {steps.length > 0 && (
              <button
                onClick={() => setShowSaveConversionRoutineModal(true)}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                Save Routine
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 chat-scroll">
        <div className="max-w-4xl mx-auto">
          {/* Conversion Routine Steps */}
          <div className="space-y-0">
            {steps.map((step, index) => (
              <WorkflowStep
                key={step.id}
                step={step}
                onAddNewStep={onAddNewStep}
                onSaveWorkflow={onSaveConversionRoutine}
                onExecute={onContinue}
                isLastStep={index === steps.length - 1}
              />
            ))}
          </div>

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center my-8">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-foreground">Processing conversion routine step...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Save Conversion Routine Modal */}
      {showSaveConversionRoutineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Save Conversion Routine</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Routine Name
                </label>
                <input
                  type="text"
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value)}
                  placeholder="Enter routine name"
                  className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:border-ring focus:ring-ring"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={routineDescription}
                  onChange={(e) => setRoutineDescription(e.target.value)}
                  placeholder="Describe what this routine does..."
                  rows={3}
                  className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:border-ring focus:ring-ring"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowSaveConversionRoutineModal(false)}
                className="flex-1 px-4 py-2 border border-input text-foreground rounded-lg hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConversionRoutine}
                disabled={!routineName.trim()}
                className="flex-1 px-4 py-2 bg-success text-success-foreground rounded-lg hover:bg-success/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors"
              >
                Save Routine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowTimeline;