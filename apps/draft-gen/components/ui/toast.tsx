import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  onClose?: () => void;
}

export function Toast({ title, description, variant = 'default', onClose }: ToastProps) {
  return (
    <div
      className={cn(
        'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
        'animate-in slide-in-from-bottom-full duration-300',
        {
          'border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50':
            variant === 'default',
          'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-50':
            variant === 'destructive',
        }
      )}
    >
      <div className="grid gap-1">
        <div className="text-sm font-semibold">{title}</div>
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={cn(
            'absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100',
            {
              'hover:bg-gray-100 focus:ring-gray-400 dark:hover:bg-gray-800 dark:focus:ring-gray-600':
                variant === 'default',
              'hover:bg-red-100 focus:ring-red-400 dark:hover:bg-red-800 dark:focus:ring-red-600':
                variant === 'destructive',
            }
          )}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
