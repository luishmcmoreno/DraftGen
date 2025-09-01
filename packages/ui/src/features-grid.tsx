import * as React from 'react'
import { FileText, Zap, Users, LucideIcon } from 'lucide-react'
import { Card } from './card'
import { cn } from './utils'

export interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

export interface FeaturesGridProps {
  title?: string
  subtitle?: string
  features?: Feature[]
  className?: string
}

const defaultFeatures: Feature[] = [
  {
    icon: FileText,
    title: "Smart Templates",
    description: "Create document templates with AI assistance. Just describe what you need and we'll build it."
  },
  {
    icon: Zap,
    title: "Data Transformation",
    description: "Clean, convert, and transform your data automatically. From messy spreadsheets to perfect documents."
  },
  {
    icon: Users,
    title: "Batch Generation",
    description: "Generate hundreds of documents at once. Perfect for invoices, contracts, and reports."
  }
]

export const FeaturesGrid = React.forwardRef<HTMLElement, FeaturesGridProps>(
  ({
    title = "Everything you need for document automation",
    subtitle = "Powerful features that make document creation, transformation, and generation effortless.",
    features = defaultFeatures,
    className,
    ...props
  }, ref) => {
    return (
      <section
        ref={ref}
        className={cn("py-20", className)}
        {...props}
      >
        <div className="container mx-auto px-6">
          <div className="mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {title}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {subtitle}
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <FeatureCard key={index} feature={feature} />
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }
)

FeaturesGrid.displayName = 'FeaturesGrid'

// Individual feature card component
interface FeatureCardProps {
  feature: Feature
}

const FeatureCard = ({ feature }: FeatureCardProps) => {
  const IconComponent = feature.icon

  return (
    <Card 
      shadow="sm"
      hover="lift"
      className="p-8 text-center transition-all duration-300 border-border"
    >
      {/* Icon */}
      <div className="w-16 h-16 bg-gradient-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
        <IconComponent className="h-8 w-8 text-accent-foreground" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-foreground mb-4">
        {feature.title}
      </h3>

      {/* Description */}
      <p className="text-muted-foreground leading-relaxed">
        {feature.description}
      </p>
    </Card>
  )
}