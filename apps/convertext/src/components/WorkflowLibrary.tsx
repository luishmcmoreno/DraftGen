import React, { useState, useEffect } from 'react';
import { SavedConversionRoutine } from '../types/conversion';
import {
  getStoredConversionRoutines,
  deleteConversionRoutine,
  updateConversionRoutineUsage,
} from '../utils/workflow-supabase';
import { useAuth } from './AuthProvider';

interface WorkflowLibraryProps {
  onReplayConversionRoutine: (routine: SavedConversionRoutine) => void;
  onClose: () => void;
  isOpen: boolean;
}

const WorkflowLibrary: React.FC<WorkflowLibraryProps> = ({
  onReplayConversionRoutine,
  onClose,
  isOpen,
}) => {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<SavedConversionRoutine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'lastUsed' | 'usageCount'>(
    'lastUsed'
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadRoutines();
    }
  }, [isOpen, user]);

  const loadRoutines = async () => {
    setLoading(true);
    try {
      const storedRoutines = await getStoredConversionRoutines();
      setRoutines(storedRoutines);
    } catch (error) {
      console.error('Failed to load routines:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoutines = routines
    .filter(
      (routine) =>
        routine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (routine.description &&
          routine.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'lastUsed':
          if (!a.lastUsed && !b.lastUsed) return 0;
          if (!a.lastUsed) return 1;
          if (!b.lastUsed) return -1;
          return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
        case 'usageCount':
          return (b.usageCount || 0) - (a.usageCount || 0);
        default:
          return 0;
      }
    });

  const handleReplayConversionRoutine = async (routine: SavedConversionRoutine) => {
    try {
      await updateConversionRoutineUsage(routine.id);
      onReplayConversionRoutine(routine);
      onClose();
    } catch (error) {
      console.error('Failed to update routine usage:', error);
      // Continue with replay even if usage update fails
      onReplayConversionRoutine(routine);
      onClose();
    }
  };

  const handleDeleteConversionRoutine = async (routineId: string) => {
    if (
      confirm(
        'Are you sure you want to delete this conversion routine? This action cannot be undone.'
      )
    ) {
      try {
        await deleteConversionRoutine(routineId);
        await loadRoutines(); // Reload the list
      } catch (error) {
        console.error('Failed to delete routine:', error);
        alert('Failed to delete routine. Please try again.');
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-card rounded-xl shadow-xl max-w-md w-full mx-4 p-6 text-center">
          <h2 className="text-2xl font-bold text-card-foreground mb-4">Sign in Required</h2>
          <p className="text-muted-foreground mb-4">
            Please sign in to access your saved conversion routines.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-card-foreground">Saved Routines</h2>
            <p className="text-muted-foreground mt-1">
              {routines.length} saved conversion routine{routines.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Search and Sort */}
        <div className="p-6 border-b border-border">
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search conversion routines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:border-ring focus:ring-ring"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:border-ring focus:ring-ring"
            >
              <option value="lastUsed">Last Used</option>
              <option value="name">Name</option>
              <option value="createdAt">Created</option>
              <option value="usageCount">Most Used</option>
            </select>
          </div>
        </div>

        {/* Conversion Routines List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredRoutines.length === 0 ? (
            <div className="text-center py-12">
              {searchTerm ? (
                <div>
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No conversion routines found
                  </h3>
                  <p className="text-muted-foreground">Try adjusting your search terms</p>
                </div>
              ) : (
                <div>
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No conversion routines yet
                  </h3>
                  <p className="text-muted-foreground">
                    Create and save your first conversion routine to see it here
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredRoutines.map((routine) => (
                <div
                  key={routine.id}
                  className="bg-muted/50 border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{routine.name}</h3>
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                          {routine.steps.length} step{routine.steps.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {routine.description && (
                        <p className="text-muted-foreground mb-3">{routine.description}</p>
                      )}

                      <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                        <span>Created: {formatDate(routine.createdAt)}</span>
                        {routine.lastUsed && (
                          <span>
                            Last used: {formatDate(routine.lastUsed)} at{' '}
                            {formatTime(routine.lastUsed)}
                          </span>
                        )}
                        <span>
                          Used {routine.usageCount || 0} time
                          {(routine.usageCount || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleReplayConversionRoutine(routine)}
                        className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Replay
                      </button>
                      <button
                        onClick={() => handleDeleteConversionRoutine(routine.id)}
                        className="px-3 py-2 text-destructive hover:text-destructive-foreground hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowLibrary;
