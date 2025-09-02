import React, { useState, useEffect, useRef } from 'react';
import {
  WorkflowStep as WorkflowStepType,
  SavedConversionRoutine,
  ConversionRoutineStepTemplate,
} from '../types/conversion';
import { generateId } from '../utils/workflow-supabase';
import WorkflowStep from './WorkflowStep';

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
  isConvertPage?: boolean; // New prop to differentiate convert page context
  isAutoExecuting?: boolean; // New prop to hide input form when auto-executing
}

const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({
  steps,
  onContinue,
  onExampleSelect: _onExampleSelect,
  onUseAsInput: _onUseAsInput,
  onSaveConversionRoutine,
  onOpenWorkflowLibrary: _onOpenWorkflowLibrary,
  onAddNewStep,
  loading,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showSaveConversionRoutineModal, setShowSaveConversionRoutineModal] = useState(false);
  const [routineName, setRoutineName] = useState('My Conversion Routine');
  const [routineDescription, setRoutineDescription] = useState('');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps.length]);

  const handleSaveConversionRoutine = () => {
    if (!routineName.trim() || !onSaveConversionRoutine) return;

    const routineTemplates: ConversionRoutineStepTemplate[] = steps.map((step) => ({
      id: step.id,
      stepNumber: step.stepNumber,
      taskDescription: step.input.taskDescription,
      exampleOutput: step.input.exampleOutput,
    }));

    const savedRoutine: SavedConversionRoutine = {
      id: generateId(),
      name: routineName.trim(),
      description: routineDescription.trim() || undefined,
      steps: routineTemplates,
      createdAt: new Date(),
      usageCount: 0,
    };

    onSaveConversionRoutine(savedRoutine);
    setShowSaveConversionRoutineModal(false);
    setRoutineName('');
    setRoutineDescription('');
  };

  if (steps.length === 0 && loading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6 chat-scroll">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center my-12">
            <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-foreground font-medium">Processing your conversion...</span>
                <span className="text-muted-foreground text-sm">This may take a few seconds</span>
              </div>
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
                suppressHydrationWarning={true}
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
                  suppressHydrationWarning={true}
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
