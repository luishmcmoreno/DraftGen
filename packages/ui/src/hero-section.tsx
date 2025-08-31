import * as React from 'react'
import { Send, Sparkles } from 'lucide-react'
import { Button } from './button'
import { Textarea } from './textarea'
import { Card } from './card'
import { Badge } from './badge'
import { cn } from './utils'

export interface HeroSectionProps {
  title?: React.ReactNode
  subtitle?: string
  badgeText?: string
  placeholderText?: string
  ctaText?: string
  onSubmit?: (message: string) => void
  onGetStarted?: () => void
  className?: string
}

export const HeroSection = React.forwardRef<HTMLElement, HeroSectionProps>(
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
    ctaText = "Start Building Now",
    onSubmit,
    onGetStarted,
    className,
    ...props
  }, ref) => {
    const [message, setMessage] = React.useState("")

    const handleSubmit = () => {
      if (!message.trim()) return
      onSubmit?.(message.trim())
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
        className={cn("bg-gradient-subtle py-20", className)}
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

            {/* Interactive Chat Input */}
            <div className="max-w-2xl mx-auto mb-16">
              <Card shadow="glow" className="p-6 border-border">
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
                <p className="text-sm text-muted-foreground mt-3 text-left">
                  Try: "Create a professional invoice template" or "Help me clean up messy contract data"
                </p>
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