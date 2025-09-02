'use client'

import { Button } from '@draft-gen/ui'
import { Card, CardHeader, CardTitle, CardContent } from '@draft-gen/ui'
import { TemplateCard } from '@draft-gen/ui'

export default function Gallery() {
  const mockTemplate = {
    id: '1',
    name: 'Sample Template',
    description: 'This is a sample template card to showcase the component',
    tags: ['React', 'TypeScript', 'UI', 'Components', 'Design', 'Gallery'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            UI Components Gallery
          </h1>
          <p className="text-lg text-muted-foreground">
            Visual showcase of all available UI components
          </p>
          <div className="mt-6">
            <a
              href="/plate-editor"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Test Plate.js Editor →
            </a>
          </div>
        </header>

        {/* Button Component */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Button Component</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Variants</h4>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="default">Default</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                    <Button variant="gradient">Gradient</Button>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Sizes</h4>
                  <div className="flex items-center gap-3">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon">🔥</Button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">States</h4>
                  <div className="flex gap-3">
                    <Button>Normal</Button>
                    <Button disabled>Disabled</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Card Component */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Card Component</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Card</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      This is a basic card with header and content.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">Content Only</h3>
                    <p className="text-sm text-muted-foreground">
                      This card only has content without a separate header.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle>Custom Style</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      This card has a dashed border style applied.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Template Card Component */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Template Card Component</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <TemplateCard 
                  template={mockTemplate}
                  onEdit={() => { /* Edit template */ }}
                  onGenerate={() => { /* Generate template */ }}
                  onDelete={() => { /* Delete template */ }}
                />
                
                <TemplateCard 
                  template={{
                    ...mockTemplate,
                    id: '2',
                    name: 'Minimal Template',
                    description: null,
                    tags: ['Simple']
                  }}
                  onEdit={() => { /* Edit template */ }}
                  onGenerate={() => { /* Generate template */ }}
                />

                <TemplateCard 
                  template={{
                    ...mockTemplate,
                    id: '3',
                    name: 'Read-only Template',
                    description: 'This template has no actions available',
                    tags: ['Read-only', 'View']
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Color Palette */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Color System</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Primary Colors */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Primary Colors</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="h-16 bg-primary rounded-md"></div>
                      <p className="text-xs font-medium">Primary</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-16 bg-primary-muted rounded-md"></div>
                      <p className="text-xs font-medium">Primary Muted</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-16 bg-secondary rounded-md"></div>
                      <p className="text-xs font-medium">Secondary</p>
                    </div>
                  </div>
                </div>

                {/* Status Colors */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Status Colors</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="h-16 bg-accent rounded-md"></div>
                      <p className="text-xs font-medium">Accent</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-16 bg-success rounded-md"></div>
                      <p className="text-xs font-medium">Success</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-16 bg-warning rounded-md"></div>
                      <p className="text-xs font-medium">Warning</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-16 bg-destructive rounded-md"></div>
                      <p className="text-xs font-medium">Destructive</p>
                    </div>
                  </div>
                </div>

                {/* Surface Colors */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Surface Colors</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="h-16 bg-background border rounded-md"></div>
                      <p className="text-xs font-medium">Background</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-16 bg-card border rounded-md"></div>
                      <p className="text-xs font-medium">Card</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-16 bg-muted rounded-md"></div>
                      <p className="text-xs font-medium">Muted</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-16 bg-popover border rounded-md shadow-sm"></div>
                      <p className="text-xs font-medium">Popover</p>
                    </div>
                  </div>
                </div>

                {/* Gradients */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Gradients</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="h-16 bg-gradient-primary rounded-md"></div>
                      <p className="text-xs font-medium">Primary Gradient</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-16 bg-gradient-secondary rounded-md"></div>
                      <p className="text-xs font-medium">Secondary Gradient</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-16 bg-gradient-subtle rounded-md"></div>
                      <p className="text-xs font-medium">Subtle Gradient</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <footer className="text-center text-sm text-muted-foreground mt-12">
          UI Components Gallery - DraftGen Design System
        </footer>
      </div>
    </div>
  )
}