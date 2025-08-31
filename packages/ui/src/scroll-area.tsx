import * as React from 'react'
import { cn } from './utils'

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal' | 'both'
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, orientation = 'vertical', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          {
            'overflow-y-auto': orientation === 'vertical',
            'overflow-x-auto': orientation === 'horizontal',
            'overflow-auto': orientation === 'both',
          },
          className
        )}
        {...props}
      >
        <div className="h-full w-full rounded-[inherit]">
          {children}
        </div>
        {/* Custom scrollbar styles */}
        <style jsx>{`
          div::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          div::-webkit-scrollbar-track {
            background: hsl(var(--muted));
            border-radius: 4px;
          }
          
          div::-webkit-scrollbar-thumb {
            background: hsl(var(--muted-foreground) / 0.3);
            border-radius: 4px;
            transition: background 0.2s;
          }
          
          div::-webkit-scrollbar-thumb:hover {
            background: hsl(var(--muted-foreground) / 0.5);
          }
          
          div::-webkit-scrollbar-corner {
            background: hsl(var(--muted));
          }
        `}</style>
      </div>
    )
  }
)

ScrollArea.displayName = 'ScrollArea'