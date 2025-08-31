import React, { useState } from 'react';
import { WorkflowStep as WorkflowStepType, SavedConversionRoutine } from '../types/conversion';
import { Button } from '@draft-gen/ui';
import { Input } from '@draft-gen/ui';
import { Textarea } from '@draft-gen/ui';
import { Plus, Copy, Check, X, RotateCw, Minus, Edit } from 'lucide-react';

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
      case 'completed': return 'bg-success';
      case 'running': return 'bg-primary';
      case 'error': return 'bg-destructive';
      case 'skipped': return 'bg-muted-foreground';
      case 'editing': return 'bg-warning';
      default: return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="w-5 h-5" />;
      case 'running': return <RotateCw className="w-5 h-5 animate-spin" />;
      case 'error': return <X className="w-5 h-5" />;
      case 'skipped': return <Minus className="w-5 h-5" />;
      case 'editing': return <Edit className="w-5 h-5" />;
      default: return <div className="w-3 h-3 rounded-full bg-current" />;
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
        <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-border" />
      )}
      
      <div className="flex items-start space-x-4 mb-8">
        {/* Status indicator */}
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${getStatusColor(step.status)}`}>
            {getStatusIcon(step.status)}
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 min-w-0">
          <div className="workflow-step-card rounded-xl p-6">
            {/* Step header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-muted-foreground">Step {step.stepNumber}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  step.status === 'completed' ? 'bg-success/10 text-success' :
                  step.status === 'running' ? 'bg-primary/10 text-primary' :
                  step.status === 'error' ? 'bg-destructive/10 text-destructive' :
                  step.status === 'skipped' ? 'bg-muted/50 text-muted-foreground' :
                  step.status === 'editing' ? 'bg-warning/10 text-warning' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {step.status.charAt(0).toUpperCase() + step.status.slice(1)}
                </span>
                {step.duration && (
                  <span className="text-xs text-muted-foreground">
                    {step.duration}ms
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {step.timestamp.toLocaleTimeString()}
              </span>
            </div>

            {/* Input section */}
            {step.status === 'editing' ? (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-foreground mb-2">New Step</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Task Description</label>
                      <Input
                        type="text"
                        placeholder="Describe what you want to do with this text..."
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <Button
                      onClick={() => onExecute?.(taskDescription, editedText, exampleOutput)}
                      className="text-xs mt-5"
                      size="sm"
                    >
                      Evaluate and Execute
                    </Button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Input Text (from previous step)</label>
                    <Textarea
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Example Output (optional)</label>
                    <Input
                      type="text"
                      placeholder="Provide an example of the expected output..."
                      value={exampleOutput}
                      onChange={(e) => setExampleOutput(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-foreground mb-2">Task</h4>
                <p className="text-sm text-muted-foreground mb-3">{step.input.taskDescription}</p>
                
                {step.input.text && (
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-1">Input Text</h5>
                    <Textarea
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                )}
                
                {step.input.exampleOutput && (
                  <div className="mt-3">
                    <h5 className="text-xs font-medium text-muted-foreground mb-1">Example Output</h5>
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                      <pre className="text-sm text-primary whitespace-pre-wrap max-h-24 overflow-y-auto">
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
                  <h4 className="text-sm font-medium text-foreground">Result</h4>
                  <code className="text-xs bg-success/20 text-success px-2 py-1 rounded">
                    {step.output.result.tool_used}
                  </code>
                </div>
                <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                  <pre className="text-sm text-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {step.output.result.converted_text}
                  </pre>
                </div>
                
              </div>
            )}

            {/* Error section */}
            {step.error && step.status === 'error' && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-destructive mb-2">Error</h4>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-sm text-destructive">{step.error}</p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex space-x-2">
                {step.status === 'completed' && step.output && (
                  <Button
                    onClick={handleAddNewStep}
                    size="sm"
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add new step
                  </Button>
                )}
                
                {step.status === 'completed' && step.output && (
                  <Button
                    onClick={() => step.output && navigator.clipboard.writeText(step.output.result.converted_text)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy result
                  </Button>
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
