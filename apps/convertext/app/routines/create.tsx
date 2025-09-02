'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Topbar from '../../src/components/Topbar';
import WorkflowTimeline from '../../src/components/WorkflowTimeline';
import WorkflowLibrary from '../../src/components/WorkflowLibrary';
import { useAuth } from '../../src/components/AuthProvider';
import { ConversionRoutineExecution, WorkflowStep, SavedConversionRoutine, ToolEvaluation } from '../../src/types/conversion';
import { 
  createNewConversionRoutineExecution, 
  addStepToConversionRoutine, 
  updateStepStatus, 
  replayConversionRoutine,
  saveConversionRoutineToStorage
} from '../../src/utils/workflow-supabase';

function CreateRoutineContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [routine, setRoutine] = useState<ConversionRoutineExecution | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialTask, setInitialTask] = useState<string>();
  const [initialText, setInitialText] = useState<string>();
  const [showConversionRoutineLibrary, setShowConversionRoutineLibrary] = useState(false);

  // Initialize routine - check for routines to save or in-progress routines
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for routine to save (from convert page)
      const routineToSaveStr = sessionStorage.getItem('routineToSave');
      if (routineToSaveStr) {
        try {
          const { routine: routineToSave, timestamp } = JSON.parse(routineToSaveStr);
          
          // Only process if recent (within 10 minutes)
          const isRecent = Date.now() - timestamp < 10 * 60 * 1000;
          
          if (isRecent && routineToSave) {
            // Clear the session storage
            sessionStorage.removeItem('routineToSave');
            
            // Load the routine for saving/editing
            setRoutine(routineToSave);
            return;
          } else {
            // Clear expired routine
            sessionStorage.removeItem('routineToSave');
          }
        } catch (error) {
          console.error('Failed to parse routine to save:', error);
          sessionStorage.removeItem('routineToSave');
        }
      }
      
      // Check for in-progress routine (from old flow - keeping for compatibility)
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
              exampleOutput: undefined
            }
          };
          
          const updatedRoutine = addStepToConversionRoutine(inProgressRoutine, newStep);
          setRoutine(updatedRoutine);
          setInitialText(nextStepText);
          setInitialTask('');
          return;
        } catch (error) {
          console.error('Failed to parse routine in progress:', error);
          sessionStorage.removeItem('routineInProgress');
        }
      }
    }
    
    // Default: create new routine
    setRoutine(createNewConversionRoutineExecution());
  }, []);

  // Handle URL query parameters (for pending conversions)
  useEffect(() => {
    const task = searchParams.get('task');
    const text = searchParams.get('text');
    
    if (task && text) {
      setInitialTask(task);
      setInitialText(text);
      
      // Clear URL parameters after loading them
      router.replace('/routines/create');
    }
  }, [searchParams, router]);

  // Redirect non-authenticated users to home with login prompt
  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (taskDescription: string, text: string, exampleOutput?: string) => {
    if (!taskDescription.trim() || !routine || !user) return;

    const startTime = Date.now();

    const newStep: Omit<WorkflowStep, 'id' | 'timestamp' | 'stepNumber'> = {
      status: 'running',
      input: {
        text,
        taskDescription,
        exampleOutput
      }
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
        tool_args: evaluationData.tool_args || []
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
          evaluation
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
  };

  const handleProviderChange = (newProvider: string) => {
    if (!routine) return;
    setRoutine(prev => prev ? ({
      ...prev,
      provider: newProvider
    }) : null);
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
      steps: routine.steps.map(step => ({
        id: step.id,
        stepNumber: step.stepNumber,
        taskDescription: step.input.taskDescription,
        exampleOutput: step.input.exampleOutput
      })),
      createdAt: new Date(),
      usageCount: 0
    };
    saveConversionRoutineToStorage(savedRoutine);
    
    // After saving, redirect to routines gallery
    router.push('/routines');
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
        exampleOutput: undefined
      }
    };
    
    const updatedRoutine = addStepToConversionRoutine(routine, newStep);
    setRoutine(updatedRoutine);
    
    setInitialTask('');
    setInitialText(previousResult);
  };

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

  // Show loading while waiting for user auth or routine initialization
  if (!user || !routine) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Topbar profile={{ display_name: user?.user_metadata?.full_name || null, avatar_url: user?.user_metadata?.avatar_url || null }} />
      
      {/* Page Header */}
      <div className="px-4 py-6 bg-card border-b border-border">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-2">Create Conversion Routine</h1>
          <p className="text-muted-foreground">Build and test multi-step text conversion workflows that can be saved and reused.</p>
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
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <div className="max-w-4xl mx-auto">
            <div className="text-red-700 text-sm">{error}</div>
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

export default function CreateRoutinePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateRoutineContent />
    </Suspense>
  );
}