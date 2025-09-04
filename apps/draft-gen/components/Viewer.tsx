'use client';

import React, { useMemo } from 'react';
import { DocumentSchema } from '@/lib/dslValidator';
import { cn } from '@/lib/utils';
import { PlateEditorWrapper } from './editor/PlateEditorWrapper';
import { dslToPlate } from '@/utils/dsl-to-plate';

interface ViewerProps {
  dsl: DocumentSchema | null;
  className?: string;
  onDslUpdate?: (updater: (dsl: DocumentSchema) => DocumentSchema) => void;
}

export function Viewer({ dsl, className, onDslUpdate }: ViewerProps) {
  // Convert DSL to Plate format
  const plateValue = useMemo(() => {
    if (!dsl) return undefined;
    return dslToPlate(dsl);
  }, [dsl]);

  if (!dsl) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="text-center text-muted-foreground">
          <p className="text-sm">No document to preview</p>
          <p className="text-xs mt-2">Start by entering a prompt in the chat</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('py-8 px-4 bg-gray-100 dark:bg-gray-900 h-full overflow-y-scroll', className)}
    >
      <div className="max-w-[850px] mx-auto">
        <div className="rounded-lg shadow-soft min-h-[1123px]">
          <PlateEditorWrapper
            initialValue={plateValue}
            readOnly={!onDslUpdate}
            placeholder="Start typing..."
            className="prose max-w-none"
            dsl={dsl}
            onDslUpdate={onDslUpdate}
          />
        </div>
      </div>
    </div>
  );
}
