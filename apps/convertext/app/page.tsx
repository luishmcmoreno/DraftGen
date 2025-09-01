'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '../src/components/Topbar';
import WorkflowTimeline from '../src/components/WorkflowTimeline';
import WorkflowLibrary from '../src/components/WorkflowLibrary';
import { useAuth } from '../src/components/AuthProvider';
import { useTheme } from '../src/components/ThemeProvider';
import { GoogleSignInButton } from '@draft-gen/ui';
import { 
  FileText, 
  Zap, 
  Users, 
  Shield, 
  Globe, 
  Workflow,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ConversionRoutineExecution, WorkflowStep, SavedConversionRoutine, ToolEvaluation } from '../src/types/conversion';
import { 
  createNewConversionRoutineExecution, 
  addStepToConversionRoutine, 
  updateStepStatus, 
  replayConversionRoutine,
  saveConversionRoutineToStorage
} from '../src/utils/workflow-supabase';

export default function Home() {
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
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    setRoutine(createNewConversionRoutineExecution());
  }, []);

  const handleTryNow = () => {
    if (!taskDescription.trim() || !text.trim()) return;
    setInitialTask(taskDescription);
    setInitialText(text);
    setShowWorkflow(true);
  };

  const handleGetStarted = () => {
    if (user) {
      router.push('/routines');
    } else {
      signIn();
    }
  };

  const examples = [
    { task: "Rewrite this text to be more professional", sample: "hey whats up, can we meet tomorrow?" },
    { task: "Convert this to bullet points", sample: "Our company provides excellent customer service with 24/7 support, multiple contact methods including phone, email, and chat, and we guarantee response within 2 hours." },
    { task: "Make this more concise", sample: "I would like to inform you that we are currently experiencing some technical difficulties with our system, and as a result, we may experience some delays in processing your request." }
  ];

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
    
    // For multi-step routine creation, redirect to the routine creation page
    if (user) {
      // Store the current routine in sessionStorage to continue in the routine creation page
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('routineInProgress', JSON.stringify({
          routine,
          nextStepText: previousResult
        }));
      }
      router.push('/routines/create');
    } else {
      // Show login dialog for unauthenticated users
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pendingRoutineCreation', JSON.stringify({
          routine,
          nextStepText: previousResult,
          timestamp: Date.now()
        }));
      }
      setShowLoginDialog(true);
    }
  };

  const handleLoginAndContinue = async () => {
    try {
      setLoading(true);
      
      // The pending conversion is already stored in sessionStorage
      // Just trigger the sign in, and the conversion will be retried after auth
      await signIn();
      
      setShowLoginDialog(false);
      
    } catch (error) {
      console.error('Login failed:', error);
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  // Effect to retry pending conversion or redirect for routine creation after login
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      // Check for pending routine creation first
      const pendingRoutineStr = sessionStorage.getItem('pendingRoutineCreation');
      if (pendingRoutineStr) {
        try {
          const pendingRoutine = JSON.parse(pendingRoutineStr);
          const { routine, nextStepText, timestamp } = pendingRoutine;
          
          // Only process if recent (within 10 minutes)
          const isRecent = Date.now() - timestamp < 10 * 60 * 1000;
          
          if (isRecent && routine && nextStepText) {
            console.log('Redirecting to routine creation after authentication');
            
            // Store the routine for the creation page
            sessionStorage.setItem('routineInProgress', JSON.stringify({
              routine,
              nextStepText
            }));
            
            // Clear the pending routine creation
            sessionStorage.removeItem('pendingRoutineCreation');
            
            // Close the login dialog if it's open
            setShowLoginDialog(false);
            
            // Redirect to routine creation page
            router.push('/routines/create');
            return;
          } else {
            // Clear expired pending routine
            sessionStorage.removeItem('pendingRoutineCreation');
          }
        } catch (error) {
          console.error('Failed to parse pending routine creation:', error);
          sessionStorage.removeItem('pendingRoutineCreation');
        }
      }
      
      // Check for pending conversion
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Show landing page by default, workflow interface when user tries the feature
  if (!showWorkflow) {
    return (
      <div className="min-h-screen bg-background">
        <Topbar profile={user ? { display_name: user?.user_metadata?.full_name || null, avatar_url: user?.user_metadata?.avatar_url || null } : null} />

        {/* Hero Section */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                AI-Powered Text Conversion
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                Transform Your Text with{' '}
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  AI Precision
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
                Convert, rewrite, and transform any text with powerful AI tools. 
                From casual notes to professional documents, get instant, intelligent text transformations.
              </p>

              {/* Try It Now Section */}
              <div className="bg-card border border-border rounded-xl p-6 mb-8 text-left max-w-4xl mx-auto shadow-lg">
                <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
                  Try ConverText Now
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      What do you want to do?
                    </label>
                    <input
                      type="text"
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      placeholder="e.g., Make this more professional, Convert to bullet points, Summarize this text..."
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Your text
                    </label>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Paste or type your text here..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleTryNow}
                      disabled={!taskDescription.trim() || !text.trim()}
                      className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Transform Text
                    </button>
                    <button
                      onClick={handleGetStarted}
                      className="px-6 py-3 rounded-lg border border-input text-foreground hover:bg-muted/50 transition-colors"
                    >
                      {user ? 'View My Routines' : 'Sign In for More'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Examples Section - Separate from input container */}
              <div className="max-w-4xl mx-auto">
                <h3 className="text-lg font-medium text-foreground mb-4">Not sure where to start? Try these</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {examples.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setTaskDescription(example.task);
                        setText(example.sample);
                      }}
                      className="p-3 text-left rounded-lg border border-input hover:bg-muted/50 transition-colors"
                    >
                      <div className="text-sm font-medium text-foreground mb-1">
                        {example.task}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {example.sample}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Powerful Text Transformation Features
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Everything you need to convert, enhance, and transform your text content with AI precision.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Instant Conversion</h3>
                  <p className="text-muted-foreground">
                    Transform your text in seconds with powerful AI models that understand context and intent.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Workflow className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Multi-Step Workflows</h3>
                  <p className="text-muted-foreground">
                    Chain multiple transformations together to create complex text processing workflows.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Smart Tools</h3>
                  <p className="text-muted-foreground">
                    Access intelligent tools for formatting, rewriting, summarizing, and converting text formats.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Save & Share</h3>
                  <p className="text-muted-foreground">
                    Save your conversion routines and share them with your team for consistent text processing.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Multiple Providers</h3>
                  <p className="text-muted-foreground">
                    Choose from different AI providers to get the best results for your specific use case.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Privacy First</h3>
                  <p className="text-muted-foreground">
                    Your text is processed securely with privacy protection and no permanent storage of content.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Perfect for Every Use Case
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Whether you're writing for business or personal use, ConverText adapts to your needs.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-card border border-border rounded-lg p-8">
                  <h3 className="text-xl font-semibold mb-4">Business & Professional</h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Transform casual emails into professional correspondence</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Convert meeting notes into structured reports</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Rewrite content for different audiences</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Create consistent documentation formats</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-card border border-border rounded-lg p-8">
                  <h3 className="text-xl font-semibold mb-4">Personal & Creative</h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Polish your writing style and tone</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Convert formats (lists, paragraphs, summaries)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Enhance clarity and readability</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Adapt text length and complexity</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Text?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already saving time and improving their writing with ConverText.
            </p>
            <button 
              onClick={handleGetStarted}
              className="bg-white text-slate-900 px-8 py-4 rounded-lg font-semibold text-base hover:bg-gray-100 transition-colors"
            >
              Get Started Now
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-muted/30">
          <div className="container mx-auto px-6 py-12">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-semibold">ConverText</span>
              </div>
              <p className="text-muted-foreground">
                &copy; {new Date().getFullYear()} ConverText. Transform your text with AI precision.
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Main conversion interface for all users

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Topbar profile={user ? { display_name: user?.user_metadata?.full_name || null, avatar_url: user?.user_metadata?.avatar_url || null } : null} />

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

      {/* Login Dialog */}
      {showLoginDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Sign in to Continue
              </h2>
              <p className="text-muted-foreground mb-6">
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