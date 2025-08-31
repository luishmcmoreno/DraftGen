'use client'

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
          'relative overflow-hidden scrollbar-thin scrollbar-track-muted scrollbar-thumb-muted-foreground/30 hover:scrollbar-thumb-muted-foreground/50',
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
      </div>
    )
  }
)

ScrollArea.displayName = 'ScrollArea'