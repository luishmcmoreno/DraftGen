import * as React from 'react'
import { Plus, FileText, Clock, ChevronRight, Search } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { ScrollArea } from './scroll-area'
import { Card } from './card'
import { Badge } from './badge'
import { cn } from './utils'

export interface Routine {
  id: string
  name: string
  type: 'full' | 'conversion'
  description: string
  lastUsed: string
  icon: React.ComponentType<{ className?: string }>
}

export interface RoutinesSidebarProps {
  routines?: Routine[]
  onRoutineSelect?: (routine: Routine) => void
  onNewRoutine?: () => void
  searchPlaceholder?: string
  title?: string
  className?: string
}

export const RoutinesSidebar = React.forwardRef<HTMLDivElement, RoutinesSidebarProps>(
  ({
    routines = [],
    onRoutineSelect,
    onNewRoutine,
    searchPlaceholder = "Search routines...",
    title = "Routines",
    className,
    ...props
  }, ref) => {
    const [searchQuery, setSearchQuery] = React.useState("")
    
    const filteredRoutines = React.useMemo(() => 
      routines.filter(routine =>
        routine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        routine.description.toLowerCase().includes(searchQuery.toLowerCase())
      ), [routines, searchQuery]
    )

    return (
      <div
        ref={ref}
        className={cn("flex flex-col h-full border-r border-border bg-card", className)}
        {...props}
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {onNewRoutine && (
              <Button variant="outline" size="sm" onClick={onNewRoutine}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Routines List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {filteredRoutines.length === 0 ? (
              <EmptyRoutinesState hasSearch={searchQuery.length > 0} />
            ) : (
              filteredRoutines.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  onClick={() => onRoutineSelect?.(routine)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    )
  }
)

RoutinesSidebar.displayName = 'RoutinesSidebar'

// Individual routine card component
interface RoutineCardProps {
  routine: Routine
  onClick?: () => void
}

const RoutineCard = ({ routine, onClick }: RoutineCardProps) => {
  const IconComponent = routine.icon

  return (
    <Card 
      shadow="sm"
      hover="lift"
      className="p-4 cursor-pointer transition-all duration-200 group border-border"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-muted rounded-lg group-hover:bg-primary-muted transition-colors">
            <IconComponent className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground text-sm mb-1 truncate">
              {routine.name}
            </h3>
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {routine.description}
            </p>
            <div className="flex items-center gap-2">
              <Badge 
                variant={routine.type === 'full' ? 'default' : 'secondary'}
                size="sm"
              >
                {routine.type === 'full' ? 'Full Process' : 'Conversion'}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {routine.lastUsed}
              </div>
            </div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Card>
  )
}

// Empty state component
interface EmptyRoutinesStateProps {
  hasSearch: boolean
}

const EmptyRoutinesState = ({ hasSearch }: EmptyRoutinesStateProps) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <div className="p-3 bg-muted rounded-full mb-3">
      {hasSearch ? (
        <Search className="h-6 w-6 text-muted-foreground" />
      ) : (
        <FileText className="h-6 w-6 text-muted-foreground" />
      )}
    </div>
    <h3 className="font-medium text-foreground mb-1">
      {hasSearch ? 'No routines found' : 'No routines yet'}
    </h3>
    <p className="text-xs text-muted-foreground">
      {hasSearch 
        ? 'Try adjusting your search terms'
        : 'Create your first routine to get started'
      }
    </p>
  </div>
)