import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ConversationHeader from '../components/ConversationHeader';
import WorkflowTimeline from '../components/WorkflowTimeline';
import WorkflowLibrary from '../components/WorkflowLibrary';
import { AuthButton, AuthGuard } from '../components/AuthButton';
import { useAuth } from '../components/AuthProvider';
import { ConversionRoutineExecution, WorkflowStep, SavedConversionRoutine, TextConversionResponse, ToolEvaluation } from '../types/conversion';
import { 
  createNewConversionRoutineExecution, 
  addStepToConversionRoutine, 
  updateStepStatus, 
  replayConversionRoutine,
  saveConversionRoutineToStorage
} from '../utils/workflow-supabase';

export default function Convert() {
  const { user } = useAuth();
  const router = useRouter();
  const [routine, setRoutine] = useState<ConversionRoutineExecution | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialTask, setInitialTask] = useState<string>();
  const [initialText, setInitialText] = useState<string>();
  const [showConversionRoutineLibrary, setShowConversionRoutineLibrary] = useState(false);

  // Initialize routine
  useEffect(() => {
    setRoutine(createNewConversionRoutineExecution());
  }, []);

  // Handle URL query parameters (for pending conversions)
  useEffect(() => {
    if (router.isReady && router.query) {
      const { task, text, example } = router.query;
      
      if (typeof task === 'string' && typeof text === 'string') {
        setInitialTask(task);
        setInitialText(text);
        
        // Clear URL parameters after loading them
        router.replace('/convert', undefined, { shallow: true });
      }
    }
  }, [router.isReady, router.query, router]);

  // Redirect non-authenticated users to home
  useEffect(() => {
    if (!user && router.isReady) {
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

  const handleNewConversionRoutine = () => {
    if (!routine) return;
    setRoutine(createNewConversionRoutineExecution(routine.provider));
    setError(null);
  };

  const handleClearConversionRoutine = () => {
    if (!routine) return;
    setRoutine(prev => prev ? ({
      ...prev,
      steps: [],
      name: 'ConverText',
      currentStepIndex: 0,
      status: 'idle',
      lastUpdated: new Date()
    }) : null);
    setError(null);
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header with auth */}
      <header className="bg-white border-b border-slate-200 px-4 py-2">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/')}
              className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors"
            >
              ConverText
            </button>
            <span className="text-sm text-slate-500">Convert</span>
          </div>
          <AuthButton />
        </div>
      </header>

      <ConversationHeader
        title={routine.name}
        provider={routine.provider}
        onProviderChange={handleProviderChange}
        onNewConversation={handleNewConversionRoutine}
        onClearConversation={handleClearConversionRoutine}
        onSaveWorkflow={handleSaveConversionRoutine}
        hasEntries={routine.steps.length > 0}
        loading={loading}
        onOpenWorkflowLibrary={() => setShowConversionRoutineLibrary(true)}
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