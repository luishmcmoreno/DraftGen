'use client'

import * as React from 'react'
import { cn } from './utils'

export interface TemplateCardProps extends React.HTMLAttributes<HTMLDivElement> {
  template: {
    id: string
    name: string
    description?: string | null
    tags: string[]
    created_at: string
    updated_at: string
  }
  onEdit?: (templateId: string) => void
  onGenerate?: (template: Record<string, unknown>) => void
  onDelete?: (template: Record<string, unknown>) => void
  editLabel?: string
  generateLabel?: string
  deleteLabel?: string
  createdAtLabel?: string
  updatedAtLabel?: string
  moreVariablesLabel?: (count: number) => string
  formatDate?: (date: string) => string
}

export const TemplateCard = React.forwardRef<HTMLDivElement, TemplateCardProps>(
  ({ 
    className, 
    template, 
    onEdit,
    onGenerate,
    onDelete,
    editLabel = 'Edit',
    generateLabel = 'Generate',
    deleteLabel = 'Delete',
    createdAtLabel = 'Created',
    updatedAtLabel = 'Updated',
    moreVariablesLabel = (count: number) => `+${count}`,
    formatDate = (date: string) => new Date(date).toLocaleDateString(),
    ...props 
  }, ref) => {
    const [showTooltip, setShowTooltip] = React.useState(false)

    const visibleTags = template.tags.slice(0, 3)
    const remainingTags = template.tags.slice(3)
    const hasOverflow = remainingTags.length > 0

    return (
      <div
        ref={ref}
        className={cn(
          'relative bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow flex flex-col h-full gap-4',
          className
        )}
        {...props}
      >
        {onDelete && (
          <button
            onClick={() => onDelete(template)}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-muted"
            aria-label={deleteLabel}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}

        <div className="flex-grow flex flex-col gap-4">
          <div className={cn("flex flex-col gap-1", onDelete && "pr-8")}>
            <h3 className="text-lg font-semibold text-card-foreground">
              {template.name}
            </h3>
            {template.description && (
              <p className="text-muted-foreground text-sm">{template.description}</p>
            )}
          </div>

          {template.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              {visibleTags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
              {hasOverflow && (
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    {moreVariablesLabel(remainingTags.length)}
                  </button>
                  {showTooltip && (
                    <div className="absolute z-10 bottom-full left-0 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-md shadow-lg whitespace-nowrap border">
                      <div className="flex flex-col gap-1">
                        {remainingTags.map((tag, index) => (
                          <span key={index}>{tag}</span>
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
              {createdAtLabel}: {formatDate(template.created_at)}
            </div>
            <div>
              {updatedAtLabel}: {formatDate(template.updated_at)}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(template.id)}
              className="flex-1 text-center px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium text-sm"
            >
              {editLabel}
            </button>
          )}
          {onGenerate && (
            <button
              onClick={() => onGenerate(template)}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
            >
              {generateLabel}
            </button>
          )}
        </div>
      </div>
    )
  }
)

TemplateCard.displayName = 'TemplateCard'