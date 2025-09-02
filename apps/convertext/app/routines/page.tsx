'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '../../src/components/Topbar';
import RoutineCard from '../../src/components/RoutineCard';
import { useAuth } from '../../src/components/AuthProvider';
import { useTheme } from '../../src/components/ThemeProvider';
import { SavedConversionRoutine } from '../../src/types/conversion';
import { GoogleSignInButton } from '@draft-gen/ui';
import {
  getStoredConversionRoutines,
  deleteConversionRoutine,
  updateConversionRoutineUsage,
} from '../../src/lib/supabase/conversion-routines';

export default function RoutinesPage() {
  const { user, signIn } = useAuth();
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [routines, setRoutines] = useState<SavedConversionRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routineToDelete, setRoutineToDelete] = useState<SavedConversionRoutine | null>(null);

  useEffect(() => {
    if (user) {
      loadRoutines();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadRoutines = async () => {
    try {
      setLoading(true);
      setError(null);
      const storedRoutines = await getStoredConversionRoutines();
      setRoutines(storedRoutines || []);
    } catch (err) {
      console.error('Error loading routines:', err);
      // If it's a Supabase "no rows" error, just set empty array
      if (
        err instanceof Error &&
        (err.message.includes('Cannot coerce the result to a single JSON object') ||
          err.message.includes('PGRST116'))
      ) {
        setRoutines([]);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load routines');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async (routine: SavedConversionRoutine) => {
    try {
      // Update usage statistics
      await updateConversionRoutineUsage(routine.id);
      // Navigate to convert page with routine loaded and auto-run
      router.push(`/convert?routineId=${routine.id}&run=true`);
    } catch (err) {
      console.error('Failed to update routine usage:', err);
      // Still navigate even if usage update fails
      router.push(`/convert?routineId=${routine.id}&run=true`);
    }
  };

  const handleDelete = (routine: SavedConversionRoutine) => {
    setRoutineToDelete(routine);
  };

  const handleCloseDeleteModal = () => {
    setRoutineToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!routineToDelete) return;

    try {
      await deleteConversionRoutine(routineToDelete.id);
      // Remove routine from local state
      setRoutines((prev) => prev.filter((r) => r.id !== routineToDelete.id));
      setRoutineToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete routine');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  // Require authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Topbar profile={null} />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-card rounded-lg p-16 text-center">
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Sign in Required</h3>
              <p className="text-muted-foreground mb-4">
                You need to sign in to view your saved conversion routines.
              </p>
              <GoogleSignInButton
                onClick={() => signIn()}
                variant={resolvedTheme === 'dark' ? 'neutral' : 'light'}
                size="large"
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Topbar
        profile={{
          display_name: user?.user_metadata?.full_name || null,
          avatar_url: user?.user_metadata?.avatar_url || null,
        }}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">Conversion Routines</h1>
            <button
              onClick={() => router.push('/routines/create')}
              className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-semibold"
            >
              Create New Routine
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-3 text-muted-foreground">Loading routines...</p>
            </div>
          ) : error ? (
            <div className="bg-card rounded-lg p-16 text-center">
              <h3 className="text-xl font-semibold text-destructive mb-2">
                Error Loading Routines
              </h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <button
                onClick={loadRoutines}
                className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-semibold"
              >
                Try Again
              </button>
            </div>
          ) : routines && routines.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {routines.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  onRun={handleRun}
                  onDelete={handleDelete}
                  runLabel="Run"
                  editLabel="Edit"
                  deleteLabel="Delete"
                  createdAtLabel="Created"
                  lastUsedLabel="Last used"
                  usageCountLabel="Used"
                  stepsLabel="steps"
                  formatDate={formatDate}
                />
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-lg p-16 text-center">
              <h3 className="text-xl font-semibold text-card-foreground mb-2">
                No Conversion Routines Yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Create your first conversion routine to get started with automated text processing
                workflows.
              </p>
              <button
                onClick={() => router.push('/routines/create')}
                className="px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-semibold"
              >
                Create Your First Routine
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {routineToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-card-foreground mb-4">Delete Routine</h2>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to delete &quot;<strong>{routineToDelete.name}</strong>&quot;?
                This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleCloseDeleteModal}
                  className="flex-1 px-4 py-2 text-sm text-muted-foreground border border-input rounded hover:bg-muted/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2 text-sm text-white bg-destructive hover:bg-destructive/90 rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
