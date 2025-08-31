import * as React from 'react'
import { FileText, Menu, X } from 'lucide-react'
import { Button } from './button'
import { cn } from './utils'

export interface NavigationLink {
  label: string
  href?: string
  onClick?: () => void
}

export interface NavigationHeaderProps {
  appName?: string
  logo?: React.ReactNode
  links?: NavigationLink[]
  onSignIn?: () => void
  onGetStarted?: () => void
  signInLabel?: string
  getStartedLabel?: string
  className?: string
}

export const NavigationHeader = React.forwardRef<HTMLElement, NavigationHeaderProps>(
  ({
    appName = "DocuFlow",
    logo,
    links = [],
    onSignIn,
    onGetStarted,
    signInLabel = "Sign In",
    getStartedLabel = "Get Started",
    className,
    ...props
  }, ref) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

    const toggleMobileMenu = () => {
      setIsMobileMenuOpen(!isMobileMenuOpen)
    }

    const handleLinkClick = (link: NavigationLink) => {
      if (link.onClick) {
        link.onClick()
      }
      setIsMobileMenuOpen(false) // Close mobile menu on link click
    }

    return (
      <header
        ref={ref}
        className={cn(
          "border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50",
          className
        )}
        {...props}
      >
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            {logo || (
              <div className="p-2 bg-gradient-primary rounded-lg">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-foreground">{appName}</h1>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {links.map((link, index) => (
              <button
                key={index}
                onClick={() => handleLinkClick(link)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {onSignIn && (
              <Button variant="ghost" size="sm" onClick={onSignIn}>
                {signInLabel}
              </Button>
            )}
            {onGetStarted && (
              <Button variant="gradient" size="sm" onClick={onGetStarted}>
                {getStartedLabel}
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="container mx-auto px-6 py-4 space-y-4">
              {/* Mobile Navigation Links */}
              {links.map((link, index) => (
                <button
                  key={index}
                  onClick={() => handleLinkClick(link)}
                  className="block w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </button>
              ))}
              
              {/* Mobile Actions */}
              <div className="pt-4 space-y-2 border-t border-border">
                {onSignIn && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      onSignIn()
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    {signInLabel}
                  </Button>
                )}
                {onGetStarted && (
                  <Button 
                    variant="gradient" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      onGetStarted()
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    {getStartedLabel}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    )
  }
)

NavigationHeader.displayName = 'NavigationHeader'