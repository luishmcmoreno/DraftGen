import {
  SavedConversionRoutine,
  WorkflowStep,
  ConversionRoutineExecution,
} from '../types/conversion';

export const generateId = () => {
  return crypto.randomUUID();
};

export const createNewConversionRoutineExecution = (
  provider: string = 'mock'
): ConversionRoutineExecution => {
  return {
    id: generateId(),
    name: 'ConverText',
    steps: [],
    currentStepIndex: 0,
    status: 'idle',
    provider,
    createdAt: new Date(),
    lastUpdated: new Date(),
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
    stepNumber: routine.steps.length + 1,
  };

  return {
    ...routine,
    steps: [...routine.steps, newStep],
    currentStepIndex: routine.steps.length,
    lastUpdated: new Date(),
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
  const updatedSteps = routine.steps.map((step) =>
    step.id === stepId ? { ...step, status, output, error, duration } : step
  );

  const hasRunningSteps = updatedSteps.some((s) => s.status === 'running');
  const hasErrors = updatedSteps.some((s) => s.status === 'error');
  const allCompleted = updatedSteps.every((s) => s.status === 'completed' || s.status === 'error');

  let newStatus: ConversionRoutineExecution['status'] = 'idle';
  if (hasRunningSteps) newStatus = 'running';
  else if (hasErrors) newStatus = 'error';
  else if (allCompleted) newStatus = 'completed';

  return {
    ...routine,
    steps: updatedSteps,
    status: newStatus,
    lastUpdated: new Date(),
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
      exampleOutput: template.exampleOutput,
    },
    timestamp: new Date(),
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
    savedRoutineId: savedRoutine.id,
  };
};

export const saveConversionRoutineToStorage = (routine: SavedConversionRoutine) => {
  try {
    const routines = getStoredConversionRoutines();
    const existingIndex = routines.findIndex((r) => r.id === routine.id);

    if (existingIndex >= 0) {
      routines[existingIndex] = routine;
    } else {
      routines.unshift(routine);
    }

    localStorage.setItem(
      'convertext_conversion_routines',
      JSON.stringify(routines, (key, value) => {
        if (key === 'timestamp' || key === 'createdAt' || key === 'lastUsed') {
          return value instanceof Date ? value.toISOString() : value;
        }
        return value;
      })
    );
  } catch (error) {
    console.error('Failed to save conversion routine:', error);
  }
};

export const getStoredConversionRoutines = (): SavedConversionRoutine[] => {
  try {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem('convertext_conversion_routines');
    if (!stored) return [];

    const routines = JSON.parse(stored);
    return routines.map((routine: any) => ({
      ...routine,
      createdAt: new Date(routine.createdAt),
      lastUsed: routine.lastUsed ? new Date(routine.lastUsed) : undefined,
    }));
  } catch (error) {
    console.error('Failed to load conversion routines:', error);
    return [];
  }
};

export const deleteConversionRoutine = (routineId: string) => {
  try {
    const routines = getStoredConversionRoutines();
    const filtered = routines.filter((r) => r.id !== routineId);
    localStorage.setItem(
      'convertext_conversion_routines',
      JSON.stringify(filtered, (key, value) => {
        if (key === 'timestamp' || key === 'createdAt' || key === 'lastUsed') {
          return value instanceof Date ? value.toISOString() : value;
        }
        return value;
      })
    );
  } catch (error) {
    console.error('Failed to delete conversion routine:', error);
  }
};

export const updateConversionRoutineUsage = (routineId: string) => {
  try {
    const routines = getStoredConversionRoutines();
    const routineIndex = routines.findIndex((r) => r.id === routineId);

    if (routineIndex >= 0) {
      routines[routineIndex] = {
        ...routines[routineIndex],
        lastUsed: new Date(),
        usageCount: (routines[routineIndex].usageCount || 0) + 1,
      };

      localStorage.setItem(
        'convertext_conversion_routines',
        JSON.stringify(routines, (key, value) => {
          if (key === 'timestamp' || key === 'createdAt' || key === 'lastUsed') {
            return value instanceof Date ? value.toISOString() : value;
          }
          return value;
        })
      );
    }
  } catch (error) {
    console.error('Failed to update conversion routine usage:', error);
  }
};
