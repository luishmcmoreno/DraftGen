import * as React from 'react'
import { cn } from './utils'

export interface GoogleSignInButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'light' | 'dark' | 'neutral'
  size?: 'small' | 'medium' | 'large'
  text?: string
}

const GoogleLogo = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z"
      fill="#4285F4"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z"
      fill="#34A853"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z"
      fill="#FBBC05"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z"
      fill="#EA4335"
    />
  </svg>
)

export const GoogleSignInButton = React.forwardRef<
  HTMLButtonElement,
  GoogleSignInButtonProps
>(({ className, variant = 'light', size = 'medium', text = 'Sign in with Google', disabled, ...props }, ref) => {
  const sizeClasses = {
    small: 'h-9 px-3 text-sm gap-2',
    medium: 'h-10 px-4 text-sm gap-3',
    large: 'h-12 px-6 text-base gap-3',
  }

  const variantClasses = {
    light: 'bg-background text-foreground border border-border hover:bg-muted hover:shadow-md dark:bg-white dark:text-gray-700 dark:border-gray-300 dark:hover:bg-gray-50',
    dark: 'bg-[#4285F4] text-white hover:bg-[#357ae8] hover:shadow-md',
    neutral: 'bg-muted text-muted-foreground hover:bg-muted/80 hover:shadow-md border border-border',
  }

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'active:scale-[0.98]',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      disabled={disabled}
      aria-label={text}
      {...props}
    >
      <span className={cn(
        'flex items-center justify-center',
        variant === 'light' ? 'bg-white dark:bg-white rounded-sm p-0.5' : '',
      )}>
        <GoogleLogo />
      </span>
      <span className="font-['Roboto','Helvetica','Arial',sans-serif] font-medium">
        {text}
      </span>
    </button>
  )
})

GoogleSignInButton.displayName = 'GoogleSignInButton'