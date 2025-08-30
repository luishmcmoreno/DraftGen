# Code Style and Conventions for DraftGen

## TypeScript Configuration

- **Strict Mode**: Enabled (`strict: true`)
- **Target**: ES2017
- **Module Resolution**: Bundler mode with ESNext modules
- **Path Alias**: `@/*` maps to project root
- **JSX**: Preserve mode for Next.js

## Code Formatting (Prettier)

- **Semicolons**: Disabled (`semi: false`)
- **Quotes**: Single quotes (`singleQuote: true`)
- **Tab Width**: 2 spaces
- **Trailing Comma**: ES5 style
- **Print Width**: 100 characters
- **Arrow Parens**: Always include parentheses
- **Line Endings**: LF (Unix-style)

## ESLint Rules

- **Console Warnings**: `console.log` statements trigger warnings
- **Unused Variables**: TypeScript unused vars warning (args with `_` prefix ignored)
- **Explicit Any**: Warnings for `any` type usage
- **Next.js**: Core Web Vitals and TypeScript configs extended

## Naming Conventions

- **Components**: PascalCase (e.g., `TemplateCard.tsx`)
- **Utilities**: camelCase (e.g., `extractVariables.ts`)
- **Constants**: UPPER_SNAKE_CASE for environment variables
- **Files**: camelCase for utilities, PascalCase for components
- **CSS Classes**: Tailwind utility classes preferred

## Project Patterns

- **Internationalization**: No hardcoded strings; all UI text uses i18n keys
- **Validation**: Zod schemas for data validation
- **State Management**: React contexts for global state
- **Styling**: Tailwind CSS utility-first approach
- **Components**: Functional components with TypeScript
- **Async Operations**: Server Components where possible, Client Components when needed

## Import Organization

1. React/Next.js imports
2. Third-party libraries
3. Local components
4. Local utilities/libs
5. Types
6. Styles

## Comments and Documentation

- Minimal comments; code should be self-documenting
- JSDoc for complex utility functions
- README files for setup instructions
