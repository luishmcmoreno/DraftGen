import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ConversionStore } from '../types/store';
import { ConversionRoutineExecution, WorkflowStep } from '../types/conversion';
import { createNewConversionRoutineExecution, addStepToConversionRoutine } from '../utils/workflow';
import { logger } from '@draft-gen/logger';

// Helper function to restore state from sessionStorage
const getInitialState = () => {
  if (typeof window === 'undefined') {
    return {
      pendingConversion: null,
      postAuthRedirect: null,
    };
  }

  // Try to restore from sessionStorage
  let pendingConversion = null;
  let postAuthRedirect = null;

  try {
    const pendingStr = sessionStorage.getItem('pendingConversion');
    if (pendingStr) {
      const parsed = JSON.parse(pendingStr);
      // Check if still valid (within 10 minutes)
      if (Date.now() - parsed.timestamp < 10 * 60 * 1000) {
        pendingConversion = parsed;
      } else {
        sessionStorage.removeItem('pendingConversion');
      }
    }
  } catch (e) {
    logger.error('Failed to restore pendingConversion from sessionStorage:', e);
  }

  try {
    const redirectStr = sessionStorage.getItem('postAuthRedirect');
    if (redirectStr) {
      postAuthRedirect = redirectStr;
    }
  } catch (e) {
    logger.error('Failed to restore postAuthRedirect from sessionStorage:', e);
  }

  return { pendingConversion, postAuthRedirect };
};

const initialPersistedState = getInitialState();

const useConversionStore = create<ConversionStore>()(
  devtools(
    (set, get) => ({
      // Initial state (restored from sessionStorage if available)
      pendingConversion: initialPersistedState.pendingConversion,
      currentRoutine: null,
      showLoginDialog: false,
      postAuthRedirect: initialPersistedState.postAuthRedirect,
      isConverting: false,
      error: null,

      // Pending conversion actions
      setPendingConversion: (taskDescription: string, text: string) => {
        const pendingConversion = {
          taskDescription,
          text,
          timestamp: Date.now(),
        };

        // Persist to sessionStorage for OAuth redirect
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('pendingConversion', JSON.stringify(pendingConversion));
        }

        set({ pendingConversion });
      },

      clearPendingConversion: () => {
        // Clear from sessionStorage too
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('pendingConversion');
        }

        set({ pendingConversion: null });
      },

      // Routine actions
      setCurrentRoutine: (routine: ConversionRoutineExecution) => {
        set({ currentRoutine: routine });
      },

      updateCurrentRoutine: (
        updater: (routine: ConversionRoutineExecution) => ConversionRoutineExecution
      ) => {
        const current = get().currentRoutine;
        if (current) {
          set({ currentRoutine: updater(current) });
        }
      },

      clearCurrentRoutine: () => {
        set({ currentRoutine: null });
      },

      addStepToRoutine: (step: Omit<WorkflowStep, 'id' | 'timestamp' | 'stepNumber'>) => {
        const current = get().currentRoutine;
        if (current) {
          const updated = addStepToConversionRoutine(current, step);
          set({ currentRoutine: updated });
        }
      },

      updateStepInRoutine: (stepId: string, updates: Partial<WorkflowStep>) => {
        const current = get().currentRoutine;
        if (current) {
          const updatedRoutine = {
            ...current,
            steps: current.steps.map((step) =>
              step.id === stepId ? { ...step, ...updates } : step
            ),
          };
          set({ currentRoutine: updatedRoutine });
        }
      },

      // Auth flow actions
      setShowLoginDialog: (show: boolean) => {
        set({ showLoginDialog: show });
      },

      setPostAuthRedirect: (path: string | null) => {
        // Persist to sessionStorage for OAuth redirect
        if (typeof window !== 'undefined') {
          if (path) {
            sessionStorage.setItem('postAuthRedirect', path);
          } else {
            sessionStorage.removeItem('postAuthRedirect');
          }
        }

        set({ postAuthRedirect: path });
      },

      // Loading state actions
      setIsConverting: (isConverting: boolean) => {
        set({ isConverting });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      // Utility actions
      initializeRoutineFromPending: () => {
        const { pendingConversion } = get();

        if (!pendingConversion) {
          return null;
        }

        // Check if pending conversion is still valid (within 10 minutes)
        const isRecent = Date.now() - pendingConversion.timestamp < 10 * 60 * 1000;

        if (!isRecent) {
          set({ pendingConversion: null });
          return null;
        }

        // Create new routine with initial step
        const newRoutine = createNewConversionRoutineExecution();
        const initialStep: Omit<WorkflowStep, 'id' | 'timestamp' | 'stepNumber'> = {
          status: 'editing',
          input: {
            text: pendingConversion.text,
            taskDescription: pendingConversion.taskDescription,
            exampleOutput: undefined,
          },
        };

        const routineWithStep = addStepToConversionRoutine(newRoutine, initialStep);

        // Set the routine and clear pending
        set({
          currentRoutine: routineWithStep,
          pendingConversion: null,
        });

        return routineWithStep;
      },

      reset: () => {
        set({
          pendingConversion: null,
          currentRoutine: null,
          showLoginDialog: false,
          postAuthRedirect: null,
          isConverting: false,
          error: null,
        });
      },
    }),
    {
      name: 'conversion-store',
    }
  )
);

// Selectors for optimized subscriptions
export const selectPendingConversion = (state: ConversionStore) => state.pendingConversion;
export const selectCurrentRoutine = (state: ConversionStore) => state.currentRoutine;
export const selectShowLoginDialog = (state: ConversionStore) => state.showLoginDialog;
export const selectIsConverting = (state: ConversionStore) => state.isConverting;
export const selectError = (state: ConversionStore) => state.error;

export default useConversionStore;
