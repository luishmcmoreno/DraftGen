import { ConversionRoutineExecution, WorkflowStep } from './conversion';

export interface PendingConversion {
  taskDescription: string;
  text: string;
  timestamp: number;
}

export interface RoutineInProgress {
  routine: ConversionRoutineExecution;
  nextStepText: string;
}

export interface ConversionStore {
  // Pending conversion from landing page
  pendingConversion: PendingConversion | null;

  // Current routine being edited/executed
  currentRoutine: ConversionRoutineExecution | null;

  // Multi-step routine in progress
  routineInProgress: RoutineInProgress | null;

  // Auth flow state
  showLoginDialog: boolean;
  postAuthRedirect: string | null;

  // Loading states
  isConverting: boolean;
  error: string | null;

  // Actions
  setPendingConversion: (taskDescription: string, text: string) => void;
  clearPendingConversion: () => void;

  setCurrentRoutine: (routine: ConversionRoutineExecution) => void;
  updateCurrentRoutine: (
    updater: (routine: ConversionRoutineExecution) => ConversionRoutineExecution
  ) => void;
  clearCurrentRoutine: () => void;

  addStepToRoutine: (step: Omit<WorkflowStep, 'id' | 'timestamp' | 'stepNumber'>) => void;
  updateStepInRoutine: (stepId: string, updates: Partial<WorkflowStep>) => void;

  setRoutineInProgress: (routine: ConversionRoutineExecution, nextStepText: string) => void;
  clearRoutineInProgress: () => void;

  setShowLoginDialog: (show: boolean) => void;
  setPostAuthRedirect: (path: string | null) => void;

  setIsConverting: (isConverting: boolean) => void;
  setError: (error: string | null) => void;

  // Utility actions
  initializeRoutineFromPending: () => ConversionRoutineExecution | null;
  reset: () => void;
}
