import * as React from 'react'
import { Sparkles, Paperclip, Upload } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { Textarea } from './textarea'
import { Select, SelectOption } from './select'
import { Card } from './card'
import { cn } from './utils'

export interface HeroSectionRef {
  setMessage: (message: string) => void
  setInputs: (task: string, text: string) => void
}

export interface HeroSectionProps {
  title?: React.ReactNode
  subtitle?: string
  badgeText?: string
  placeholderText?: string
  examplesText?: string
  ctaText?: string
  onSubmit?: (message: string) => void
  onGetStarted?: () => void
  className?: string
  // Dual input mode props
  showDualInput?: boolean
  taskLabel?: string
  taskPlaceholder?: string
  textLabel?: string
  textPlaceholder?: string
  onDualSubmit?: (task: string, text: string, files?: FileList | null, provider?: string) => void
  // New props for enhanced input
  apiProviders?: SelectOption[]
  defaultProvider?: string
  allowFileUpload?: boolean
  onFileUpload?: (files: FileList) => void
}

export const HeroSection = React.forwardRef<HeroSectionRef, HeroSectionProps>(
  ({
    title = (
      <>
        The Future of
        <span className="bg-gradient-primary bg-clip-text text-transparent"> Document </span>
        Creation
      </>
    ),
    subtitle = "Create templates, transform data, and generate documents with AI. From invoices to contracts, automate your document workflow in minutes.",
    badgeText = "Transform documents with AI",
    placeholderText = "Describe the document template you need... (e.g., 'Create an invoice template for my consulting business')",
    examplesText,
    ctaText = "Start Building Now",
    onSubmit,
    onGetStarted,
    className,
    // Dual input props
    showDualInput = false,
    taskLabel,
    taskPlaceholder,
    textLabel,
    textPlaceholder,
    onDualSubmit,
    // Enhanced input props
    apiProviders,
    defaultProvider,
    allowFileUpload = true,
    onFileUpload,
    ...props
  }, ref) => {
    const [message, setMessage] = React.useState("")
    const [taskDescription, setTaskDescription] = React.useState("")
    const [text, setText] = React.useState("")
    const [selectedProvider, setSelectedProvider] = React.useState(defaultProvider || apiProviders?.[0]?.value || "")
    const [attachedFiles, setAttachedFiles] = React.useState<FileList | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    React.useImperativeHandle(ref, () => ({
      setMessage: (newMessage: string) => {
        setMessage(newMessage)
      },
      setInputs: (task: string, textContent: string) => {
        setTaskDescription(task)
        setText(textContent)
      }
    }))

    const handleSubmit = () => {
      if (showDualInput) {
        if (!taskDescription.trim() || !text.trim()) return
        onDualSubmit?.(taskDescription.trim(), text.trim(), attachedFiles, selectedProvider)
      } else {
        if (!message.trim()) return
        onSubmit?.(message.trim())
      }
    }

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (files && files.length > 0) {
        setAttachedFiles(files)
        onFileUpload?.(files)
      }
    }

    const handleAttachClick = () => {
      fileInputRef.current?.click()
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    }

    return (
      <section
        className={cn("bg-gradient-subtle py-8", className)}
        {...props}
      >
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary-muted/50 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              {badgeText}
            </div>
            
            {/* Title */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              {title}
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>

            {/* Interactive Input */}
            <div className="max-w-2xl mx-auto mb-16 mt-4">
              <Card shadow="glow" className="p-6 border-border bg-card/95 backdrop-blur-sm">
                {showDualInput ? (
                  <div className="space-y-4">
                    {/* Task Input Row - Full Width */}
                    <div>
                      <Input
                        placeholder={taskPlaceholder}
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        className="w-full border border-border/40 shadow-sm focus-visible:ring-2 focus-visible:ring-ring text-base bg-background"
                      />
                    </div>
                    
                    {/* Text Area */}
                    <Textarea
                      placeholder={textPlaceholder}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={4}
                      className="w-full border border-border/40 shadow-sm focus-visible:ring-2 focus-visible:ring-ring text-base resize-none bg-background"
                    />
                    
                    {/* File attachments indicator */}
                    {attachedFiles && attachedFiles.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Upload className="h-3 w-3" />
                        <span>{attachedFiles.length} file(s) attached</span>
                      </div>
                    )}
                    
                    {/* Bottom Row - Attach, Model Selector, and Convert Button */}
                    <div className="flex items-center gap-3 pt-2">
                      {allowFileUpload && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-full bg-muted hover:bg-muted/80 border-border"
                            onClick={handleAttachClick}
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleFileUpload}
                            accept=".txt,.csv,.json,.md,.docx,.pdf"
                          />
                        </>
                      )}
                      
                      {apiProviders && apiProviders.length > 0 && (
                        <Select
                          options={apiProviders}
                          value={selectedProvider}
                          onValueChange={setSelectedProvider}
                          className="w-32 text-sm border border-border/40 shadow-sm bg-background"
                        />
                      )}
                      
                      <div className="flex-1" />
                      
                      <Button
                        onClick={handleSubmit}
                        disabled={!taskDescription.trim() || !text.trim()}
                        variant="gradient"
                        size="sm"
                        className="px-6"
                      >
                        {ctaText}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-3">
                      <Textarea
                        placeholder={placeholderText}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 min-h-[60px] resize-none border-0 shadow-none focus-visible:ring-0 text-base"
                        resize="none"
                      />
                      <Button
                        onClick={handleSubmit}
                        disabled={!message.trim()}
                        variant="gradient"
                        size="lg"
                        className="self-end px-8"
                      >
                        Create
                      </Button>
                    </div>
                    {examplesText && (
                      <p className="text-sm text-muted-foreground mt-3 text-left">
                        {examplesText}
                      </p>
                    )}
                  </>
                )}
              </Card>
            </div>

          </div>
        </div>
      </section>
    )
  }
)

HeroSection.displayName = 'HeroSection'