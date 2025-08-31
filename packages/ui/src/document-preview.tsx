import * as React from 'react'
import { FileText, Download, Eye, Edit3 } from 'lucide-react'
import { Button } from './button'
import { Card } from './card'
import { ScrollArea } from './scroll-area'
import { cn } from './utils'

export interface DocumentPreviewProps {
  title?: string
  content?: React.ReactNode
  onEdit?: () => void
  onDownload?: () => void
  onPreview?: () => void
  isLoading?: boolean
  className?: string
}

export const DocumentPreview = React.forwardRef<HTMLDivElement, DocumentPreviewProps>(
  ({
    title = "Document Preview",
    content,
    onEdit,
    onDownload,
    onPreview,
    isLoading = false,
    className,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col h-full border-l border-border bg-card", className)}
        {...props}
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">{title}</h3>
            <div className="flex gap-1">
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={onEdit} disabled={isLoading}>
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}
              {onDownload && (
                <Button variant="ghost" size="sm" onClick={onDownload} disabled={isLoading}>
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Document Area */}
        <ScrollArea className="flex-1 p-4">
          <Card 
            shadow="sm" 
            className="p-6 bg-document border-document-border shadow-sm mx-auto max-w-4xl"
          >
            {isLoading ? (
              <DocumentSkeleton />
            ) : content ? (
              content
            ) : (
              <EmptyDocumentState />
            )}
          </Card>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-gradient-subtle">
          <div className="flex gap-2">
            {onPreview && (
              <Button variant="outline" size="sm" className="flex-1" onClick={onPreview} disabled={isLoading}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}
            {onDownload && (
              <Button variant="gradient" size="sm" className="flex-1" onClick={onDownload} disabled={isLoading}>
                <Download className="h-4 w-4 mr-2" />
                Generate
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }
)

DocumentPreview.displayName = 'DocumentPreview'

// Skeleton component for loading state
const DocumentSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex justify-between items-start">
      <div className="space-y-3">
        <div className="w-24 h-12 bg-muted rounded border-2 border-dashed border-border" />
        <div className="h-8 bg-muted rounded w-32" />
        <div className="h-4 bg-muted rounded w-24" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-32" />
        <div className="h-3 bg-muted rounded w-24" />
        <div className="h-3 bg-muted rounded w-28" />
        <div className="h-3 bg-muted rounded w-20" />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-20" />
        <div className="p-3 bg-muted rounded border border-dashed border-border space-y-2">
          <div className="h-3 bg-background rounded w-24" />
          <div className="h-3 bg-background rounded w-32" />
          <div className="h-3 bg-background rounded w-28" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-24" />
        <div className="space-y-1">
          <div className="flex justify-between">
            <div className="h-3 bg-muted rounded w-12" />
            <div className="h-3 bg-muted rounded w-16" />
          </div>
          <div className="flex justify-between">
            <div className="h-3 bg-muted rounded w-10" />
            <div className="h-3 bg-muted rounded w-20" />
          </div>
        </div>
      </div>
    </div>

    <div className="space-y-3">
      <div className="h-4 bg-muted rounded w-16" />
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted p-3 grid grid-cols-12 gap-2">
          <div className="col-span-6 h-3 bg-background rounded" />
          <div className="col-span-2 h-3 bg-background rounded" />
          <div className="col-span-2 h-3 bg-background rounded" />
          <div className="col-span-2 h-3 bg-background rounded" />
        </div>
        <div className="p-3 grid grid-cols-12 gap-2 border-t border-border">
          <div className="col-span-6 h-3 bg-muted rounded" />
          <div className="col-span-2 h-3 bg-muted rounded" />
          <div className="col-span-2 h-3 bg-muted rounded" />
          <div className="col-span-2 h-3 bg-muted rounded" />
        </div>
      </div>
    </div>
  </div>
)

// Empty state component
const EmptyDocumentState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="p-4 bg-muted rounded-full mb-4">
      <FileText className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">No Document Preview</h3>
    <p className="text-sm text-muted-foreground max-w-sm">
      Start a conversation with the assistant to create a document template, and the preview will appear here.
    </p>
  </div>
)