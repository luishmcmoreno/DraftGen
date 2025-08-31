import * as React from 'react'
import { FileText, Sparkles } from 'lucide-react'
import { Button } from './button'
import { cn } from './utils'

export interface DocumentHeaderProps {
  appName?: string
  appSubtitle?: string
  onTemplatesClick?: () => void
  onNewProjectClick?: () => void
  templatesLabel?: string
  newProjectLabel?: string
  className?: string
}

export const DocumentHeader = React.forwardRef<HTMLElement, DocumentHeaderProps>(
  ({
    appName = "DocuFlow",
    appSubtitle = "Document Transformation & Generation",
    onTemplatesClick,
    onNewProjectClick,
    templatesLabel = "Templates",
    newProjectLabel = "New Project",
    className,
    ...props
  }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          "border-b border-border bg-gradient-subtle h-16 flex items-center justify-between px-6",
          className
        )}
        {...props}
      >
        {/* Logo and App Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{appName}</h1>
              <p className="text-xs text-muted-foreground">{appSubtitle}</p>
            </div>
          </div>
        </div>
        
        {/* Navigation Actions */}
        <div className="flex items-center gap-3">
          {onTemplatesClick && (
            <Button variant="secondary" size="sm" onClick={onTemplatesClick}>
              <Sparkles className="h-4 w-4 mr-2" />
              {templatesLabel}
            </Button>
          )}
          {onNewProjectClick && (
            <Button variant="gradient" size="sm" onClick={onNewProjectClick}>
              {newProjectLabel}
            </Button>
          )}
        </div>
      </header>
    )
  }
)

DocumentHeader.displayName = 'DocumentHeader'