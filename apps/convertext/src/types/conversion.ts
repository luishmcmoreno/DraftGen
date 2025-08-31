export interface TextConversionResponse {
  original_text: string;
  converted_text: string;
  diff: string;
  tool_used: string;
  confidence: number;
  render_mode: 'diff' | 'output';
  tool_args?: string[];
  error?: string;
}

export interface ToolEvaluation {
  reasoning: string;
  tool: string;
  tool_args: { name: string; value: string }[];
}

export interface ConversionResult {
  original_text: string;
  converted_text: string;
  diff: string;
  tool_used: string;
  confidence: number;
  render_mode: 'diff' | 'output';
  tool_args?: { name: string; value: string }[];
  error?: string;
}

export interface ConversationEntry {
  id: string;
  type: 'user_input' | 'agent_evaluation' | 'conversion_result' | 'error';
  content: {
    text?: string;
    taskDescription?: string;
    exampleOutput?: string;
    evaluation?: ToolEvaluation;
    result?: ConversionResult;
    error?: string;
  };
  timestamp: Date;
  provider: string;
}

export interface WorkflowStep {
  id: string;
  stepNumber: number;
  status: 'pending' | 'running' | 'completed' | 'error' | 'skipped' | 'editing';
  input: {
    text: string;
    taskDescription: string;
    exampleOutput?: string;
  };
  output?: {
    result: ConversionResult;
    evaluation?: ToolEvaluation;
  };
  error?: string;
  timestamp: Date;
  duration?: number; // in milliseconds
}

export interface SavedConversionRoutine {
  id: string;
  name: string;
  description?: string;
  steps: ConversionRoutineStepTemplate[];
  createdAt: Date;
  lastUsed?: Date;
  usageCount: number;
}

export interface ConversionRoutineStepTemplate {
  id: string;
  stepNumber: number;
  taskDescription: string;
  exampleOutput?: string;
  // Input will be dynamic - either user input or output from previous step
}

export interface ConversionRoutineExecution {
  id: string;
  name: string;
  steps: WorkflowStep[];
  currentStepIndex: number;
  status: 'idle' | 'running' | 'completed' | 'error';
  provider: string;
  createdAt: Date;
  lastUpdated: Date;
  savedRoutineId?: string; // Reference to SavedConversionRoutine if replaying
}

export interface Conversation {
  id: string;
  title: string;
  entries: ConversationEntry[];
  provider: string;
  createdAt: Date;
  lastUpdated: Date;
}
