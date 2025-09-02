'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '../../src/components/Topbar';
import WorkflowTimeline from '../../src/components/WorkflowTimeline';
import WorkflowLibrary from '../../src/components/WorkflowLibrary';
import { useAuth } from '../../src/components/AuthProvider';
import { useTheme } from '../../src/components/ThemeProvider';
import { GoogleSignInButton } from '@draft-gen/ui';
import {
  ConversionRoutineExecution,
  WorkflowStep,
  SavedConversionRoutine,
  ToolEvaluation,
} from '../../src/types/conversion';
import {
  createNewConversionRoutineExecution,
  addStepToConversionRoutine,
  updateStepStatus,
  replayConversionRoutine,
} from '../../src/utils/workflow-supabase';
import { logger } from '@draft-gen/logger';

export default function ConvertPage() {
  const { user, signIn } = useAuth();
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [routine, setRoutine] = useState<ConversionRoutineExecution | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialTask, setInitialTask] = useState<string>();
  const [initialText, setInitialText] = useState<string>();
  const [showConversionRoutineLibrary, setShowConversionRoutineLibrary] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isAutoExecuting, setIsAutoExecuting] = useState(false);

  useEffect(() => {
    setRoutine(createNewConversionRoutineExecution());
  }, []);

  const handleSubmit = useCallback(
    async (taskDescription: string, text: string, exampleOutput?: string) => {
      if (!taskDescription.trim() || !routine) return;

      // Check if user is authenticated before proceeding with the conversion
      if (!user) {
        // Store pending conversion in sessionStorage for post-auth retry
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(
            'pendingConversion',
            JSON.stringify({
              taskDescription,
              text,
              exampleOutput,
              timestamp: Date.now(),
            })
          );
        }

        // Show login dialog instead of proceeding
        setShowLoginDialog(true);
        setInitialTask(taskDescription);
        setInitialText(text);
        return;
      }

      // User is authenticated, proceed directly with conversion

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
    },
    [
      routine,
      user,
      setError,
      setLoading,
      setRoutine,
      setShowLoginDialog,
      setInitialTask,
      setInitialText,
    ]
  );

  // Auto-execute conversion from sessionStorage on page load
  useEffect(() => {
    if (typeof window !== 'undefined' && routine) {
      const pendingConversionStr = sessionStorage.getItem('pendingConversion');
      if (pendingConversionStr) {
        try {
          const pendingConversion = JSON.parse(pendingConversionStr);
          const { taskDescription, text, exampleOutput, timestamp } = pendingConversion;

          // Only process if recent (within 10 minutes)
          const isRecent = Date.now() - timestamp < 10 * 60 * 1000;

          if (isRecent && taskDescription && text) {
            logger.log('Auto-executing conversion from landing page:', {
              taskDescription: taskDescription.substring(0, 50) + '...',
              textLength: text.length,
            });

            // Set auto-executing state to prevent showing input form
            setIsAutoExecuting(true);

            // Clear the pending conversion immediately to avoid re-processing
            sessionStorage.removeItem('pendingConversion');

            // Start conversion immediately without showing input form
            handleSubmit(taskDescription, text, exampleOutput);
          } else {
            // Clear expired pending conversion
            sessionStorage.removeItem('pendingConversion');
          }
        } catch (error) {
          logger.error('Failed to parse pending conversion:', error);
          sessionStorage.removeItem('pendingConversion');
        }
      }
    }
  }, [routine, handleSubmit]); // Only depend on routine, remove handleSubmit dependency to avoid hoisting issue

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

    // Redirect to routines/create page for routine saving/management
    if (user) {
      // Store the current routine in sessionStorage for the routine creation page
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          'routineToSave',
          JSON.stringify({
            routine,
            timestamp: Date.now(),
          })
        );
      }
      router.push('/routines/create');
    } else {
      // Show login dialog for unauthenticated users
      setShowLoginDialog(true);
    }
  };

  const handleReplayConversionRoutine = (savedRoutine: SavedConversionRoutine) => {
    const replayedRoutine = replayConversionRoutine(savedRoutine, routine?.provider || 'mock');
    setRoutine(replayedRoutine);
    setError(null);
  };

  const handleAddNewStep = (previousResult: string) => {
    if (!routine) return;

    // Add new step directly in this page - no redirect needed
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

  const handleLoginAndContinue = async () => {
    try {
      setLoading(true);

      // The pending conversion is already stored in sessionStorage
      // Just trigger the sign in, and the conversion will be retried after auth
      await signIn();

      setShowLoginDialog(false);
    } catch (error) {
      logger.error('Login failed:', error);
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  // Effect to retry pending conversion after login
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      // Check for pending conversion
      const pendingConversionStr = sessionStorage.getItem('pendingConversion');
      if (pendingConversionStr) {
        try {
          const pendingConversion = JSON.parse(pendingConversionStr);
          const { taskDescription, text, exampleOutput, timestamp } = pendingConversion;

          // Only retry if the pending conversion is recent (within 10 minutes)
          const isRecent = Date.now() - timestamp < 10 * 60 * 1000;

          if (isRecent && taskDescription && text) {
            logger.log('Retrying pending conversion after authentication:', {
              taskDescription: taskDescription.substring(0, 50) + '...',
              textLength: text.length,
            });

            // Clear the pending conversion
            sessionStorage.removeItem('pendingConversion');

            // Close the login dialog if it's open
            setShowLoginDialog(false);

            // Retry the conversion
            setTimeout(() => {
              handleSubmit(taskDescription, text, exampleOutput);
            }, 500); // Give a bit more time for auth to settle
          } else {
            // Clear expired pending conversion
            sessionStorage.removeItem('pendingConversion');
          }
        } catch (error) {
          logger.error('Failed to parse pending conversion:', error);
          sessionStorage.removeItem('pendingConversion');
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (initialTask || initialText) {
      const timer = setTimeout(() => {
        setInitialTask(undefined);
        setInitialText(undefined);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialTask, initialText]);

  if (!routine) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Topbar
        profile={
          user
            ? {
                display_name: user?.user_metadata?.full_name || null,
                avatar_url: user?.user_metadata?.avatar_url || null,
              }
            : null
        }
      />

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
        isConvertPage={true}
        isAutoExecuting={isAutoExecuting}
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

      {/* Login Dialog */}
      {showLoginDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground mb-4">Sign in to Continue</h2>
              <p className="text-muted-foreground mb-6">
                To start your text conversion, please sign in with Google. This will save your
                conversion history and allow you to reuse workflows.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowLoginDialog(false);
                    setInitialTask(undefined);
                    setInitialText(undefined);
                    // Clear any pending conversion
                    if (typeof window !== 'undefined') {
                      sessionStorage.removeItem('pendingConversion');
                    }
                  }}
                  className="flex-1 px-4 py-2 text-sm text-muted-foreground border border-input rounded hover:bg-muted/50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <GoogleSignInButton
                  onClick={handleLoginAndContinue}
                  variant={resolvedTheme === 'dark' ? 'neutral' : 'light'}
                  size="medium"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
