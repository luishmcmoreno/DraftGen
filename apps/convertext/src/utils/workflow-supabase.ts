import { 
  saveConversionRoutine as saveRoutineToSupabase,
  getStoredConversionRoutines as getRoutinesFromSupabase,
  deleteConversionRoutine as deleteRoutineFromSupabase,
  updateConversionRoutineUsage as updateUsageInSupabase,
  createRoutineExecution,
  updateRoutineExecution
} from '../lib/supabase/conversion-routines';
import { 
  createConversionStep,
  updateConversionStep
} from '../lib/supabase/conversion-steps';
import type { 
  SavedConversionRoutine, 
  WorkflowStep, 
  ConversionRoutineExecution,
  ConversionRoutineStepTemplate
} from '../types/conversion';

export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export const createNewConversionRoutineExecution = (provider: string = 'mock'): ConversionRoutineExecution => {
  return {
    id: generateId(),
    name: 'ConverText',
    steps: [],
    currentStepIndex: 0,
    status: 'idle',
    provider,
    createdAt: new Date(),
    lastUpdated: new Date()
  };
};

export const addStepToConversionRoutine = (
  routine: ConversionRoutineExecution,
  step: Omit<WorkflowStep, 'id' | 'timestamp' | 'stepNumber'>
): ConversionRoutineExecution => {
  const newStep: WorkflowStep = {
    ...step,
    id: generateId(),
    timestamp: new Date(),
    stepNumber: routine.steps.length + 1
  };

  return {
    ...routine,
    steps: [...routine.steps, newStep],
    currentStepIndex: routine.steps.length,
    lastUpdated: new Date()
  };
};

export const updateStepStatus = (
  routine: ConversionRoutineExecution,
  stepId: string,
  status: WorkflowStep['status'],
  output?: WorkflowStep['output'],
  error?: string,
  duration?: number
): ConversionRoutineExecution => {
  const updatedSteps = routine.steps.map(step => 
    step.id === stepId 
      ? { ...step, status, output, error, duration }
      : step
  );

  const hasRunningSteps = updatedSteps.some(s => s.status === 'running');
  const hasErrors = updatedSteps.some(s => s.status === 'error');
  const allCompleted = updatedSteps.every(s => s.status === 'completed' || s.status === 'error');

  let newStatus: ConversionRoutineExecution['status'] = 'idle';
  if (hasRunningSteps) newStatus = 'running';
  else if (hasErrors) newStatus = 'error';
  else if (allCompleted) newStatus = 'completed';

  return {
    ...routine,
    steps: updatedSteps,
    status: newStatus,
    lastUpdated: new Date()
  };
};

export const replayConversionRoutine = (
  savedRoutine: SavedConversionRoutine,
  provider: string = 'mock'
): ConversionRoutineExecution => {
  const steps: WorkflowStep[] = savedRoutine.steps.map((template, index) => ({
    id: generateId(),
    stepNumber: index + 1,
    status: 'pending',
    input: {
      text: '', // Will be filled by user during execution
      taskDescription: template.taskDescription,
      exampleOutput: template.exampleOutput
    },
    timestamp: new Date()
  }));

  return {
    id: generateId(),
    name: savedRoutine.name,
    steps,
    currentStepIndex: 0,
    status: 'idle',
    provider,
    createdAt: new Date(),
    lastUpdated: new Date(),
    savedRoutineId: savedRoutine.id
  };
};

// Supabase-backed operations (replacing localStorage)
export const saveConversionRoutineToStorage = async (routine: SavedConversionRoutine): Promise<void> => {
  try {
    await saveRoutineToSupabase(routine);
  } catch (error) {
    console.error('Failed to save conversion routine to Supabase:', error);
    throw error;
  }
};

export const getStoredConversionRoutines = async (): Promise<SavedConversionRoutine[]> => {
  try {
    return await getRoutinesFromSupabase();
  } catch (error) {
    console.error('Failed to load conversion routines from Supabase:', error);
    return [];
  }
};

export const deleteConversionRoutine = async (routineId: string): Promise<void> => {
  try {
    await deleteRoutineFromSupabase(routineId);
  } catch (error) {
    console.error('Failed to delete conversion routine from Supabase:', error);
    throw error;
  }
};

export const updateConversionRoutineUsage = async (routineId: string): Promise<void> => {
  try {
    await updateUsageInSupabase(routineId);
  } catch (error) {
    console.error('Failed to update conversion routine usage in Supabase:', error);
    throw error;
  }
};

// Enhanced operations with Supabase execution tracking
export const createAndSaveRoutineExecution = async (
  execution: Omit<ConversionRoutineExecution, 'id' | 'createdAt' | 'lastUpdated'>
): Promise<ConversionRoutineExecution> => {
  try {
    return await createRoutineExecution(execution);
  } catch (error) {
    console.error('Failed to create routine execution in Supabase:', error);
    throw error;
  }
};

export const updateAndSaveRoutineExecution = async (
  executionId: string,
  updates: Partial<ConversionRoutineExecution>
): Promise<ConversionRoutineExecution> => {
  try {
    return await updateRoutineExecution(executionId, updates);
  } catch (error) {
    console.error('Failed to update routine execution in Supabase:', error);
    throw error;
  }
};

export const createAndSaveConversionStep = async (
  executionId: string,
  step: Omit<WorkflowStep, 'id' | 'timestamp'>
): Promise<WorkflowStep> => {
  try {
    return await createConversionStep(executionId, step);
  } catch (error) {
    console.error('Failed to create conversion step in Supabase:', error);
    throw error;
  }
};

export const updateAndSaveConversionStep = async (
  stepId: string,
  updates: {
    status?: WorkflowStep['status'];
    output?: WorkflowStep['output'];
    error?: string;
    duration?: number;
  }
): Promise<WorkflowStep> => {
  try {
    return await updateConversionStep(stepId, updates);
  } catch (error) {
    console.error('Failed to update conversion step in Supabase:', error);
    throw error;
  }
};

// Utility to migrate from localStorage to Supabase (one-time operation)
export const migrateLocalStorageToSupabase = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  try {
    // Get existing localStorage data
    const stored = localStorage.getItem('convertext_conversion_routines');
    if (!stored) return;

    const routines = JSON.parse(stored);
    const migratedRoutines: SavedConversionRoutine[] = routines.map((routine: any) => ({
      ...routine,
      createdAt: new Date(routine.createdAt),
      lastUsed: routine.lastUsed ? new Date(routine.lastUsed) : undefined
    }));

    // Save each routine to Supabase
    for (const routine of migratedRoutines) {
      try {
        await saveRoutineToSupabase(routine);
      } catch (error) {
        console.warn(`Failed to migrate routine ${routine.id}:`, error);
      }
    }

    // Clear localStorage after successful migration
    localStorage.removeItem('convertext_conversion_routines');
    console.log(`Successfully migrated ${migratedRoutines.length} routines from localStorage to Supabase`);

  } catch (error) {
    console.error('Failed to migrate localStorage data to Supabase:', error);
  }
};