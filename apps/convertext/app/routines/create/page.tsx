'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@draft-gen/logger';

import Topbar from '@/components/Topbar';
import WorkflowTimeline from '@/components/WorkflowTimeline';
import WorkflowLibrary from '@/components/WorkflowLibrary';
import { useAuth } from '@/components/AuthProvider';
import {
  addStepToConversionRoutine,
  createNewConversionRoutineExecution,
  replayConversionRoutine,
  saveConversionRoutineToStorage,
  updateStepStatus,
} from '@/utils/workflow-supabase';
import {
  ConversionRoutineExecution,
  SavedConversionRoutine,
  ToolEvaluation,
  WorkflowStep,
} from '@/types/conversion';

export default function CreateRoutinePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [routine, setRoutine] = useState<ConversionRoutineExecution | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialTask, setInitialTask] = useState<string>();
  const [initialText, setInitialText] = useState<string>();
  const [showConversionRoutineLibrary, setShowConversionRoutineLibrary] = useState(false);
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Initialize routine and check for pending conversion from landing page
  useEffect(() => {
    // Initialize routine if not already initialized
    if (!routine) {
      const newRoutine = createNewConversionRoutineExecution();
      let shouldAddEmptyStep = true;
      let routineToSet = newRoutine;

      // Check for pending conversion from landing page
      if (typeof window !== 'undefined') {
        const pendingConversionStr = sessionStorage.getItem('pendingConversion');
        if (pendingConversionStr) {
          try {
            const pendingConversion = JSON.parse(pendingConversionStr);
            const { taskDescription, text, timestamp } = pendingConversion;

            // Only use if recent (within 10 minutes)
            const isRecent = Date.now() - timestamp < 10 * 60 * 1000;

            if (isRecent && taskDescription && text) {
              logger.log('Loading pending conversion from landing page:', {
                taskDescription: taskDescription.substring(0, 50) + '...',
                textLength: text.length,
              });

              // Set initial values
              setInitialTask(taskDescription);
              setInitialText(text);

              // Clear the pending conversion
              sessionStorage.removeItem('pendingConversion');

              // Set flag to auto-start conversion after component mounts
              setShouldAutoSubmit(true);
              
              // Don't add empty step since we have pending data
              shouldAddEmptyStep = false;
            } else {
              // Clear expired pending conversion
              sessionStorage.removeItem('pendingConversion');
            }
          } catch (error) {
            logger.error('Failed to parse pending conversion:', error);
            sessionStorage.removeItem('pendingConversion');
          }
        }

        // Check for in-progress routine (from multi-step creation)
        const routineInProgressStr = sessionStorage.getItem('routineInProgress');
        if (routineInProgressStr) {
          try {
            const { routine: inProgressRoutine, nextStepText } = JSON.parse(routineInProgressStr);

            // Clear the session storage
            sessionStorage.removeItem('routineInProgress');

            // Create a new step with the text from the previous conversion
            const newStep: Omit<WorkflowStep, 'id' | 'timestamp' | 'stepNumber'> = {
              status: 'editing',
              input: {
                text: nextStepText,
                taskDescription: '',
                exampleOutput: undefined,
              },
            };

            routineToSet = addStepToConversionRoutine(inProgressRoutine, newStep);
            setInitialText(nextStepText);
            setInitialTask('');
            
            // Don't add empty step since we have in-progress routine
            shouldAddEmptyStep = false;
          } catch (error) {
            logger.error('Failed to parse routine in progress:', error);
            sessionStorage.removeItem('routineInProgress');
          }
        }

        // If no pending data, add an empty step so users can start creating
        if (shouldAddEmptyStep) {
          const emptyStep: Omit<WorkflowStep, 'id' | 'timestamp' | 'stepNumber'> = {
            status: 'editing',
            input: {
              text: '',
              taskDescription: '',
              exampleOutput: undefined,
            },
          };
          routineToSet = addStepToConversionRoutine(newRoutine, emptyStep);
        }
      }

      setRoutine(routineToSet);
    }
  }, [routine]);

  // Separate effect for authentication check
  useEffect(() => {
    // Check auth status after a short delay to allow auth to load
    const timer = setTimeout(() => {
      setAuthChecked(true);
      if (!user) {
        // If still no user after check, redirect to home
        router.push('/');
      }
    }, 1000); // Give auth 1 second to load

    return () => clearTimeout(timer);
  }, [user, router]);

  const handleSubmit = useCallback(async (taskDescription: string, text: string, exampleOutput?: string) => {
    if (!taskDescription.trim() || !routine) return;

    const startTime = Date.now();

    const newStep: Omit<WorkflowStep, 'id' | 'timestamp' | 'stepNumber'> = {
      status: 'running',
      input: {
        text,
        taskDescription,
        exampleOutput,
      },
    };

    let updatedRoutine = addStepToConversionRoutine(routine, newStep);
    setRoutine(updatedRoutine);
    setLoading(true);
    setError(null);

    try {
      const stepId = updatedRoutine.steps[updatedRoutine.steps.length - 1].id;

      const evaluateResponse = await fetch(`/api/evaluate-with-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          task_description: taskDescription,
          provider: routine.provider,
        }),
      });

      if (!evaluateResponse.ok) {
        throw new Error('Evaluation failed');
      }

      const evaluationData = await evaluateResponse.json();
      const evaluation: ToolEvaluation = {
        reasoning: evaluationData.reasoning || '',
        tool: evaluationData.tool || '',
        tool_args: evaluationData.tool_args || [],
      };

      const convertResponse = await fetch(`/api/convert-with-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          task_description: taskDescription,
          example_output: exampleOutput,
          provider: routine.provider,
        }),
      });

      if (!convertResponse.ok) {
        throw new Error('Conversion failed');
      }

      const conversionData = await convertResponse.json();
      const duration = Date.now() - startTime;

      updatedRoutine = updateStepStatus(
        updatedRoutine,
        stepId,
        'completed',
        {
          result: conversionData,
          evaluation,
        },
        undefined,
        duration
      );

      setRoutine(updatedRoutine);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);

      const stepId = updatedRoutine.steps[updatedRoutine.steps.length - 1].id;
      const duration = Date.now() - startTime;

      updatedRoutine = updateStepStatus(
        updatedRoutine,
        stepId,
        'error',
        undefined,
        errorMessage,
        duration
      );

      setRoutine(updatedRoutine);
    } finally {
      setLoading(false);
    }
  }, [routine]);

  const handleProviderChange = (newProvider: string) => {
    if (!routine) return;
    setRoutine((prev) =>
      prev
        ? {
            ...prev,
            provider: newProvider,
          }
        : null
    );
  };

  const handleExampleSelect = (task: string, sampleInput?: string) => {
    setInitialTask(task);
    setInitialText(sampleInput || '');
  };

  const handleUseAsInput = (text: string) => {
    setInitialText(text);
  };

  const handleSaveConversionRoutine = () => {
    if (!routine) return;
    const savedRoutine: SavedConversionRoutine = {
      id: routine.id,
      name: routine.name,
      steps: routine.steps.map((step) => ({
        id: step.id,
        stepNumber: step.stepNumber,
        taskDescription: step.input.taskDescription,
        exampleOutput: step.input.exampleOutput,
      })),
      createdAt: new Date(),
      usageCount: 0,
    };
    saveConversionRoutineToStorage(savedRoutine);
  };

  const handleReplayConversionRoutine = (savedRoutine: SavedConversionRoutine) => {
    const replayedRoutine = replayConversionRoutine(savedRoutine, routine?.provider || 'mock');
    setRoutine(replayedRoutine);
    setError(null);
  };

  const handleAddNewStep = (previousResult: string) => {
    if (!routine) return;

    const newStep: Omit<WorkflowStep, 'id' | 'timestamp' | 'stepNumber'> = {
      status: 'editing',
      input: {
        text: previousResult,
        taskDescription: '',
        exampleOutput: undefined,
      },
    };

    const updatedRoutine = addStepToConversionRoutine(routine, newStep);
    setRoutine(updatedRoutine);

    setInitialTask('');
    setInitialText(previousResult);
  };

  // Handle auto-submit for pending conversions
  useEffect(() => {
    if (shouldAutoSubmit && initialTask && initialText && handleSubmit) {
      setShouldAutoSubmit(false);
      handleSubmit(initialTask, initialText);
    }
  }, [shouldAutoSubmit, initialTask, initialText, handleSubmit]);

  // Clear initial values after they are used
  useEffect(() => {
    if (initialTask || initialText) {
      const timer = setTimeout(() => {
        setInitialTask(undefined);
        setInitialText(undefined);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialTask, initialText]);

  // Show loading while checking auth or initializing routine
  if (!authChecked || !routine) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-muted-foreground">
          {!authChecked ? 'Checking authentication...' : 'Loading routine...'}
        </p>
      </div>
    );
  }

  // If auth checked and no user, will redirect (handled in useEffect)
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Topbar
        profile={{
          display_name: user?.user_metadata?.full_name || null,
          avatar_url: user?.user_metadata?.avatar_url || null,
        }}
      />

      {/* Page Header */}
      <div className="px-4 py-6 bg-card border-b border-border">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-2">Create Conversion Routine</h1>
          <p className="text-muted-foreground">
            Build and test multi-step text conversion workflows that can be saved and reused.
          </p>
        </div>
      </div>

      <WorkflowTimeline
        steps={routine.steps}
        provider={routine.provider}
        onProviderChange={handleProviderChange}
        onContinue={handleSubmit}
        onExampleSelect={handleExampleSelect}
        onUseAsInput={handleUseAsInput}
        onSaveWorkflow={handleSaveConversionRoutine}
        onSaveConversionRoutine={handleSaveConversionRoutine}
        onOpenWorkflowLibrary={() => setShowConversionRoutineLibrary(true)}
        initialTask={initialTask}
        initialText={initialText}
        loading={loading}
        onAddNewStep={handleAddNewStep}
      />

      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
          <div className="max-w-4xl mx-auto">
            <div className="text-destructive text-sm">{error}</div>
          </div>
        </div>
      )}

      <WorkflowLibrary
        isOpen={showConversionRoutineLibrary}
        onClose={() => setShowConversionRoutineLibrary(false)}
        onReplayConversionRoutine={handleReplayConversionRoutine}
      />
    </div>
  );
}