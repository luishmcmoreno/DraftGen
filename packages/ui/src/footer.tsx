import * as React from 'react'
import { FileText } from 'lucide-react'
import { cn } from './utils'

export interface FooterProps {
  appName?: string
  logo?: React.ReactNode
  copyrightText?: string
  year?: number
  className?: string
}

export const Footer = React.forwardRef<HTMLElement, FooterProps>(
  ({
    appName = "DocuFlow",
    logo,
    copyrightText = "Built with ❤️ for document automation.",
    year = new Date().getFullYear(),
    className,
    ...props
  }, ref) => {
    return (
      <footer
        ref={ref}
        className={cn("border-t border-border bg-card", className)}
        {...props}
      >
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center gap-2">
            {logo || (
              <div className="p-1 bg-gradient-primary rounded">
                <FileText className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <span className="text-muted-foreground">
              © {year} {appName}. {copyrightText}
            </span>
          </div>
        </div>
      </footer>
    )
  }
)

Footer.displayName = 'Footer'