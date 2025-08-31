# Gallery App - UI Components Showcase

This is the UI components gallery application within the DraftGen monorepo. It serves as a visual showcase and testing environment for all shared UI components from the `@draft-gen/ui` package.

## 🎯 Purpose

**UI Components Gallery**: A comprehensive showcase application for testing, documenting, and demonstrating all available UI components in the design system.

## 🏗️ Technical Stack

- **Framework**: Next.js 15 (App Router)
- **React**: 19.0.0
- **TypeScript**: Fully typed with shared configurations
- **Styling**: Tailwind CSS with animations
- **UI Components**: `@draft-gen/ui` shared package
- **Port**: 3002 (configured to avoid conflicts)

## 📁 Project Structure

```
apps/gallery/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main gallery page
│   └── globals.css         # Global styles
├── next.config.js          # Next.js configuration
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── CLAUDE.md              # This documentation
```

## 🎨 Components Showcased

### Current Components
1. **Button Component**
   - All variants: default, destructive, outline, secondary, ghost, link, gradient
   - All sizes: small, default, large, icon
   - States: normal, disabled

2. **Card Component**
   - Basic card with header and content
   - Content-only cards
   - Custom styling examples

3. **TemplateCard Component**
   - Full template cards with actions (edit, generate, delete)
   - Minimal template cards (limited actions)
   - Read-only template cards (no actions)

4. **Color System**
   - Basic color palette showcase
   - Gray scale variations

## 🚀 Development Commands

```bash
# From monorepo root
npx turbo dev --filter=gallery

# From gallery directory
npm run dev        # Start development server on port 3002
npm run build      # Build for production
npm run start      # Start production server on port 3002
npm run lint       # Run ESLint
```

## 🔧 Configuration

### Next.js Configuration
- **Transpile Packages**: Configured to transpile `@draft-gen/ui` package
- **Port**: 3002 (configured in package.json scripts)

### TypeScript
- Extends shared TypeScript config from `@draft-gen/typescript-config/nextjs.json`
- Full type safety with React 19 types

### Dependencies
- **Core**: Next.js 15, React 19, TypeScript 5
- **UI**: `@draft-gen/ui` (shared UI components package)
- **Styling**: Tailwind CSS with animations
- **Dev Tools**: ESLint, Next.js ESLint config

## 📋 Usage Guidelines

### Adding New Components
1. Import component from `@draft-gen/ui`
2. Create a new section in `app/page.tsx`
3. Showcase all variants, sizes, and states
4. Add proper documentation and examples

### Component Sections Structure
```tsx
<section className="mb-12">
  <Card>
    <CardHeader>
      <CardTitle>Component Name</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Component examples and variations */}
    </CardContent>
  </Card>
</section>
```

### Mock Data Pattern
```tsx
const mockTemplate = {
  id: '1',
  name: 'Sample Template',
  description: 'Description text',
  tags: ['tag1', 'tag2'],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z'
}
```

## 🎯 Best Practices

1. **Component Testing**: Use this gallery to visually test all component states
2. **Documentation**: Each component section should show all possible variations
3. **Consistency**: Follow the established section structure for new components
4. **Interactivity**: Include working examples with console.log handlers
5. **Responsive Design**: Test components at different screen sizes

## 🔄 Integration with Monorepo

- **Shared Components**: Pulls all components from `@draft-gen/ui`
- **Shared Config**: Uses `@draft-gen/typescript-config` for consistency
- **Turbo**: Integrated with Turbo for efficient development and builds
- **Independent Port**: Runs on port 3002 to avoid conflicts with other apps

## 🎨 Design System Features

The gallery demonstrates the complete design system including:
- **Component Variants**: All available button, card, and other component variants
- **Color Palette**: System colors and their usage
- **Typography**: Text styles and hierarchies
- **Spacing**: Consistent spacing patterns
- **Animations**: Tailwind CSS animations integration

## 📝 Development Notes

- **Client Components**: Uses `'use client'` directive for interactivity
- **Mock Handlers**: All interactive elements use console.log for demonstration
- **Styling**: Follows Tailwind utility-first approach with design tokens
- **Accessibility**: Components inherit accessibility features from `@draft-gen/ui`

This gallery serves as both a development tool for testing UI components and a living documentation of the design system used across all DraftGen applications.