'use client';

import React, { useState } from 'react';
import { SavedConversionRoutine } from '../types/conversion';
import { useLocalizedRouter } from '../utils/navigation';

interface RoutineCardProps {
  routine: SavedConversionRoutine;
  onRun?: (routine: SavedConversionRoutine) => void;
  onDelete?: (routine: SavedConversionRoutine) => void;
  runLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
  createdAtLabel?: string;
  lastUsedLabel?: string;
  usageCountLabel?: string;
  stepsLabel?: string;
  formatDate?: (date: Date) => string;
}

export default function RoutineCard({
  routine,
  onRun,
  onDelete,
  runLabel = 'Run',
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  createdAtLabel = 'Created',
  lastUsedLabel = 'Last used',
  usageCountLabel = 'Used',
  stepsLabel = 'steps',
  formatDate = (date: Date) =>
    new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date),
}: RoutineCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const router = useLocalizedRouter();

  const handleEdit = () => {
    router.push(`/routines/create?routineId=${routine.id}`);
  };

  const handleRun = () => {
    if (onRun) {
      onRun(routine);
    } else {
      // Default behavior: navigate to convert page with routine loaded
      router.push(`/convert?routineId=${routine.id}&run=true`);
    }
  };

  // Create step tags similar to template variables
  const stepTags = routine.steps.map(
    (step, index) =>
      `Step ${index + 1}: ${step.taskDescription.substring(0, 30)}${step.taskDescription.length > 30 ? '...' : ''}`
  );
  const visibleSteps = stepTags.slice(0, 3);
  const remainingSteps = stepTags.slice(3);
  const hasOverflow = remainingSteps.length > 0;

  return (
    <div className="relative bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow flex flex-col h-full gap-4">
      {onDelete && (
        <button
          onClick={() => onDelete(routine)}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-muted"
          aria-label={deleteLabel}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      )}

      <div className="flex-grow flex flex-col gap-4">
        <div className={`flex flex-col gap-1 ${onDelete ? 'pr-8' : ''}`}>
          <h3 className="text-lg font-semibold text-card-foreground">{routine.name}</h3>
          {routine.description && (
            <p className="text-muted-foreground text-sm">{routine.description}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <span>
              {routine.steps.length} {stepsLabel}
            </span>
            <span>•</span>
            <span>
              {usageCountLabel} {routine.usageCount} times
            </span>
          </div>
        </div>

        {routine.steps.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            {visibleSteps.map((stepTag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
              >
                {stepTag}
              </span>
            ))}
            {hasOverflow && (
              <div className="relative">
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  +{remainingSteps.length}
                </button>
                {showTooltip && (
                  <div className="absolute z-10 bottom-full left-0 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-md shadow-lg whitespace-nowrap border max-w-xs">
                    <div className="flex flex-col gap-1">
                      {remainingSteps.map((stepTag, index) => (
                        <span key={index} className="truncate">
                          {stepTag}
                        </span>
                      ))}
                    </div>
                    <div className="absolute bottom-0 left-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-popover border"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-auto flex flex-col gap-1">
          <div>
            {createdAtLabel}: {formatDate(routine.createdAt)}
          </div>
          {routine.lastUsed && (
            <div>
              {lastUsedLabel}: {formatDate(routine.lastUsed)}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleEdit}
          className="flex-1 text-center px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium text-sm"
        >
          {editLabel}
        </button>
        <button
          onClick={handleRun}
          className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
        >
          {runLabel}
        </button>
      </div>
    </div>
  );
}
