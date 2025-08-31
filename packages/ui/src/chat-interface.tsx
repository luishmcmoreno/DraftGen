import * as React from 'react'
import { Send, Paperclip, Sparkles } from 'lucide-react'
import { Button } from './button'
import { Textarea } from './textarea'
import { ScrollArea } from './scroll-area'
import { Card } from './card'
import { cn } from './utils'

export interface ChatMessage {
  id: string
  content: string
  type: 'user' | 'assistant'
  timestamp: Date
}

export interface ChatInterfaceProps {
  messages?: ChatMessage[]
  onSendMessage?: (message: string) => void
  placeholder?: string
  title?: string
  subtitle?: string
  isLoading?: boolean
  initialMessage?: string
  className?: string
}

export const ChatInterface = React.forwardRef<HTMLDivElement, ChatInterfaceProps>(
  ({
    messages = [],
    onSendMessage,
    placeholder = "Describe the document template or transformation you need...",
    title = "Document Assistant",
    subtitle = "Create templates, transform data, and generate documents",
    isLoading = false,
    initialMessage,
    className,
    ...props
  }, ref) => {
    const [inputValue, setInputValue] = React.useState(initialMessage || "")
    const messagesEndRef = React.useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    React.useEffect(() => {
      scrollToBottom()
    }, [messages])

    React.useEffect(() => {
      if (initialMessage) {
        setInputValue(initialMessage)
      }
    }, [initialMessage])

    const handleSend = () => {
      if (!inputValue.trim() || isLoading) return
      
      onSendMessage?.(inputValue.trim())
      setInputValue("")
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    }

    return (
      <div
        ref={ref}
        className={cn("flex flex-col h-full", className)}
        {...props}
      >
        {/* Header */}
        <div className="border-b border-border p-4 bg-gradient-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent rounded-lg">
              <Sparkles className="h-4 w-4 text-accent-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <Card
                  shadow={message.type === 'user' ? 'md' : 'sm'}
                  className={cn(
                    "max-w-[80%] p-4",
                    message.type === 'user' 
                      ? 'bg-chat-user text-primary-foreground' 
                      : 'bg-chat-assistant border-border'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                  <p className={cn(
                    "text-xs mt-2 opacity-70",
                    message.type === 'user' 
                      ? 'text-primary-foreground' 
                      : 'text-muted-foreground'
                  )}>
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </Card>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <Card shadow="sm" className="bg-chat-assistant border-border p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-card">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <div className="flex-1 relative">
              <Textarea
                placeholder={placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[50px] resize-none pr-12"
                disabled={isLoading}
                resize="none"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute bottom-2 right-2 p-1 h-8 w-8"
                disabled={isLoading}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              variant="gradient"
              className="self-end h-[50px] px-6"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }
)

ChatInterface.displayName = 'ChatInterface'