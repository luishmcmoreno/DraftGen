import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './utils'

const cardVariants = cva(
  'rounded-lg border bg-card text-card-foreground transition-smooth',
  {
    variants: {
      shadow: {
        none: 'shadow-none',
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
        glow: 'shadow-glow',
      },
      hover: {
        none: '',
        lift: 'hover:shadow-lg hover:-translate-y-1',
        glow: 'hover:shadow-glow',
      }
    },
    defaultVariants: {
      shadow: 'sm',
      hover: 'none',
    },
  }
)

export interface CardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, shadow, hover, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ shadow, hover, className }))}
        {...props}
      />
    )
  }
)

Card.displayName = 'Card'

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 p-6', className)}
        {...props}
      />
    )
  }
)

CardHeader.displayName = 'CardHeader'

export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>

export const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-lg font-semibold leading-none tracking-tight', className)}
        {...props}
      />
    )
  }
)

CardTitle.displayName = 'CardTitle'

export type CardContentProps = React.HTMLAttributes<HTMLDivElement>

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  }
)

CardContent.displayName = 'CardContent'