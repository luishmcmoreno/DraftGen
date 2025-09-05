import * as React from 'react'
import { Send, Sparkles } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { Textarea } from './textarea'
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
  onDualSubmit?: (task: string, text: string) => void
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
    examplesText = "Try: \"Create a professional invoice template\" or \"Help me clean up messy contract data\"",
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
    ...props
  }, ref) => {
    const [message, setMessage] = React.useState("")
    const [taskDescription, setTaskDescription] = React.useState("")
    const [text, setText] = React.useState("")

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
        onDualSubmit?.(taskDescription.trim(), text.trim())
      } else {
        if (!message.trim()) return
        onSubmit?.(message.trim())
      }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    }

    return (
      <section
        ref={ref}
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
              <Card shadow="glow" className="p-6 border-border">
                {showDualInput ? (
                  <div className="space-y-4">
                    <div>
                      {taskLabel && (
                        <label className="block text-sm font-medium text-foreground mb-2">
                          {taskLabel}
                        </label>
                      )}
                      <div className="flex gap-3">
                        <Input
                          placeholder={taskPlaceholder}
                          value={taskDescription}
                          onChange={(e) => setTaskDescription(e.target.value)}
                          className="flex-1 border-0 shadow-none focus-visible:ring-0 text-base"
                        />
                        <Button
                          onClick={handleSubmit}
                          disabled={!taskDescription.trim() || !text.trim()}
                          variant="gradient"
                          size="lg"
                          className="px-8"
                        >
                          {ctaText}
                        </Button>
                      </div>
                    </div>
                    <div>
                      {textLabel && (
                        <label className="block text-sm font-medium text-foreground mb-2">
                          {textLabel}
                        </label>
                      )}
                      <Textarea
                        placeholder={textPlaceholder}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={4}
                        className="w-full border-0 shadow-none focus-visible:ring-0 text-base resize-none"
                      />
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
                        <Send className="h-5 w-5" />
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

            {/* Additional CTA */}
            {onGetStarted && (
              <div className="flex justify-center">
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={onGetStarted}
                  className="px-8 py-4 text-base"
                >
                  {ctaText}
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }
)

HeroSection.displayName = 'HeroSection'