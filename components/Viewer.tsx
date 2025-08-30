'use client';

import { DocumentSchema } from '@/lib/dslValidator';
import { cn } from '@/lib/utils';
import { AutoPaginatedDocument } from './AutoPaginatedDocument';

interface ViewerProps {
  dsl: DocumentSchema | null;
  className?: string;
  onDslUpdate?: (updater: (dsl: unknown) => unknown) => void;
}

export function Viewer({ dsl, className, onDslUpdate }: ViewerProps) {
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
        <AutoPaginatedDocument
          content={dsl}
          showVariables={true}
          forPdf={false}
          onDslUpdate={onDslUpdate}
        />
      </div>
    </div>
  );
}
