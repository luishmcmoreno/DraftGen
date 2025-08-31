# Turborepo Setup

This project has been converted to a Turborepo monorepo structure.

## Structure

```
.
├── apps/
│   ├── draft-gen/    # Main DraftGen Next.js app (port 3000)
│   └── admin/        # Admin app placeholder (port 3001)
├── packages/
│   ├── ui/           # Shared UI components library
│   └── typescript-config/  # Shared TypeScript configurations
├── turbo.json        # Turborepo configuration
└── package.json      # Root workspace configuration
```

## Available Commands

From the root directory:

- `npm run dev` - Start all apps in development mode
- `npm run build` - Build all apps and packages
- `npm run lint` - Lint all apps and packages
- `npm run format` - Format all code
- `npm run type-check` - Type check all TypeScript code

## Adding a New App

1. Create a new directory under `apps/`
2. Add a `package.json` with the app configuration
3. Import shared packages using workspace protocol: `"@draft-gen/ui": "*"`

## Adding Shared Components

1. Add components to `packages/ui/src/`
2. Export them in `packages/ui/src/index.ts`
3. Import in apps: `import { Button } from '@draft-gen/ui'`

## Environment Variables

Each app has its own `.env` file in its directory:
- `apps/draft-gen/.env` - Environment variables for the main app
- `apps/admin/.env` - Environment variables for the admin app

## Benefits

- **Shared code**: UI components and utilities are shared across apps
- **Parallel development**: Multiple apps can be developed simultaneously
- **Optimized builds**: Turborepo caches and optimizes builds
- **Type safety**: Shared TypeScript configurations ensure consistency