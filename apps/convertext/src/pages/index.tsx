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

export default function Home() {
  const { user, signIn } = useAuth();
  const router = useRouter();
  const [routine, setRoutine] = useState<ConversionRoutineExecution | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialTask, setInitialTask] = useState<string>();
  const [initialText, setInitialText] = useState<string>();
  const [showConversionRoutineLibrary, setShowConversionRoutineLibrary] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  useEffect(() => {
    setRoutine(createNewConversionRoutineExecution());
  }, []);

  const handleSubmit = async (taskDescription: string, text: string, exampleOutput?: string) => {
    if (!taskDescription.trim() || !routine) return;

    // Check if user is authenticated before proceeding with the conversion
    if (!user) {
      // Store pending conversion in sessionStorage for post-auth retry
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pendingConversion', JSON.stringify({
          taskDescription,
          text,
          exampleOutput,
          timestamp: Date.now()
        }));
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
    
    // Create a new step with "editing" status
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
    
    // Set the initial values for the new step
    setInitialTask('');
    setInitialText(previousResult);
  };

  const handleLoginAndContinue = async () => {
    if (!initialTask || !initialText) return;
    
    try {
      setLoading(true);
      
      // Pass pending conversion data to the auth flow
      await signIn({
        taskDescription: initialTask,
        text: initialText,
        exampleOutput: undefined
      });
      
      setShowLoginDialog(false);
      
    } catch (error) {
      console.error('Login failed:', error);
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  // Effect to retry pending conversion after login
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      // Check for pending conversion in sessionStorage
      const pendingConversionStr = sessionStorage.getItem('pendingConversion');
      if (pendingConversionStr) {
        try {
          const pendingConversion = JSON.parse(pendingConversionStr);
          const { taskDescription, text, exampleOutput, timestamp } = pendingConversion;
          
          // Only retry if the pending conversion is recent (within 10 minutes)
          const isRecent = Date.now() - timestamp < 10 * 60 * 1000;
          
          if (isRecent && taskDescription && text) {
            console.log('Retrying pending conversion after authentication:', { taskDescription: taskDescription.substring(0, 50) + '...', textLength: text.length });
            
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
          console.error('Failed to parse pending conversion:', error);
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-slate-600">Loading...</p>
      </div>
    );
  }

  // Simplified interface for authenticated users
  if (user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header with auth */}
        <header className="bg-white border-b border-slate-200 px-4 py-2">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <h1 className="text-lg font-semibold text-slate-900">ConverText</h1>
            <AuthButton showConvertButton />
          </div>
        </header>

        {/* Main content for authenticated users */}
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-2xl w-full mx-4">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome back!</h2>
              <p className="text-gray-600 mb-8">
                Ready to convert some text? Start a new conversion workflow or continue with a saved routine.
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={() => router.push('/convert')}
                  className="w-full px-6 py-3 text-lg text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-semibold"
                >
                  Start Converting
                </button>
                
                <button
                  onClick={() => setShowConversionRoutineLibrary(true)}
                  className="w-full px-6 py-3 text-lg text-blue-600 border-2 border-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-semibold"
                >
                  Browse Saved Routines
                </button>
              </div>

              <div className="mt-8 text-sm text-gray-500">
                <p>Your conversion history and routines are automatically saved.</p>
              </div>
            </div>
          </div>
        </div>

        <WorkflowLibrary
          isOpen={showConversionRoutineLibrary}
          onClose={() => setShowConversionRoutineLibrary(false)}
          onReplayConversionRoutine={(savedRoutine) => {
            const replayedRoutine = replayConversionRoutine(savedRoutine, 'mock');
            // Navigate to convert page with the routine
            router.push('/convert');
          }}
        />
      </div>
    );
  }

  // Full conversion interface for unauthenticated users
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header with auth */}
      <header className="bg-white border-b border-slate-200 px-4 py-2">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-lg font-semibold text-slate-900">ConverText</h1>
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

      {/* Login Dialog */}
      {showLoginDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Sign in to Continue
              </h2>
              <p className="text-gray-600 mb-6">
                To start your text conversion, please sign in with Google. This will save your conversion history and allow you to reuse workflows.
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
                  className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLoginAndContinue}
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in with Google'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
