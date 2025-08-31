import React, { useState } from 'react';
import { WorkflowStep as WorkflowStepType, SavedConversionRoutine } from '../types/conversion';

interface WorkflowStepProps {
  step: WorkflowStepType;
  onAddNewStep?: (previousResult: string) => void;
  onSaveWorkflow?: (routine: SavedConversionRoutine) => void;
  onExecute?: (taskDescription: string, text: string, exampleOutput?: string) => void;
  isLastStep?: boolean;
}

const WorkflowStep: React.FC<WorkflowStepProps> = ({ 
  step, 
  onAddNewStep, 
  onSaveWorkflow, 
  onExecute, 
  isLastStep = false 
}) => {
  const [editedText, setEditedText] = useState(step.input.text);
  const [taskDescription, setTaskDescription] = useState(step.input.taskDescription);
  const [exampleOutput, setExampleOutput] = useState(step.input.exampleOutput);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      case 'skipped': return 'bg-gray-400';
      case 'editing': return 'bg-yellow-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✓';
      case 'running': return '⟳';
      case 'error': return '✗';
      case 'skipped': return '−';
      case 'editing': return '✏️';
      default: return '○';
    }
  };

  const handleAddNewStep = () => {
    if (step.output?.result.converted_text && onAddNewStep) {
      onAddNewStep(step.output.result.converted_text);
    }
  };

  return (
    <div className="relative">
      {/* Timeline line */}
      {!isLastStep && (
        <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-slate-200" />
      )}
      
      <div className="flex items-start space-x-4 mb-8">
        {/* Status indicator */}
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${getStatusColor(step.status)}`}>
            {getStatusIcon(step.status)}
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            {/* Step header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-slate-500">Step {step.stepNumber}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  step.status === 'completed' ? 'bg-green-100 text-green-800' :
                  step.status === 'running' ? 'bg-blue-100 text-blue-800' :
                  step.status === 'error' ? 'bg-red-100 text-red-800' :
                  step.status === 'skipped' ? 'bg-gray-100 text-gray-800' :
                  step.status === 'editing' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-slate-100 text-slate-800'
                }`}>
                  {step.status.charAt(0).toUpperCase() + step.status.slice(1)}
                </span>
                {step.duration && (
                  <span className="text-xs text-slate-500">
                    {step.duration}ms
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500">
                {step.timestamp.toLocaleTimeString()}
              </span>
            </div>

            {/* Input section */}
            {step.status === 'editing' ? (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">New Step</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Task Description</label>
                      <input
                        type="text"
                        placeholder="Describe what you want to do with this text..."
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <button
                      onClick={() => onExecute?.(taskDescription, editedText, exampleOutput)}
                      className="px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors mt-5"
                    >
                      Evaluate and Execute
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Input Text (from previous step)</label>
                    <textarea
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Example Output (optional)</label>
                    <input
                      type="text"
                      placeholder="Provide an example of the expected output..."
                      value={exampleOutput}
                      onChange={(e) => setExampleOutput(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Task</h4>
                <p className="text-sm text-slate-600 mb-3">{step.input.taskDescription}</p>
                
                {step.input.text && (
                  <div>
                    <h5 className="text-xs font-medium text-slate-600 mb-1">Input Text</h5>
                    <textarea
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                  </div>
                )}
                
                {step.input.exampleOutput && (
                  <div className="mt-3">
                    <h5 className="text-xs font-medium text-slate-600 mb-1">Example Output</h5>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <pre className="text-sm text-blue-700 whitespace-pre-wrap max-h-24 overflow-y-auto">
                        {step.input.exampleOutput}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Output section */}
            {step.output && step.status === 'completed' && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-slate-700">Result</h4>
                  <code className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                    {step.output.result.tool_used}
                  </code>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {step.output.result.converted_text}
                  </pre>
                </div>
                
              </div>
            )}

            {/* Error section */}
            {step.error && step.status === 'error' && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-red-700 mb-2">Error</h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{step.error}</p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <div className="flex space-x-2">
                {step.status === 'completed' && step.output && (
                  <button
                    onClick={handleAddNewStep}
                    className="px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add new step
                  </button>
                )}
                
                {step.status === 'completed' && step.output && (
                  <button
                    onClick={() => step.output && navigator.clipboard.writeText(step.output.result.converted_text)}
                    className="px-3 py-2 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Copy result
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowStep;
