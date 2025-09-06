# DraftGen Monorepo

This is a Turbo monorepo containing multiple applications and shared packages. This document provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🏗️ Project Structure

```
DraftGen/
├── apps/
│   ├── draft-gen/           # Document generation MVP app (Next.js App Router)
│   ├── convertext/          # Text conversion tool (Next.js Pages Router)
│   └── gallery/             # UI components showcase
├── packages/
│   ├── typescript-config/   # Shared TypeScript configurations
│   └── ui/                 # Shared UI components
├── CLAUDE.md               # This file (monorepo overview)
├── package.json            # Root package.json with workspaces
└── turbo.json             # Turbo configuration
```

## 📱 Applications

### 🔧 Draft-Gen (`apps/draft-gen/`)
**Main MVP Application**: Document generation system with AI-powered template creation
- **Framework**: Next.js 15 (App Router), TypeScript, React 19
- **Features**: Google Auth, Supabase, PDF generation, i18n support
- **Key Dependencies**: Supabase, next-intl, Gemini AI
- **Documentation**: `apps/draft-gen/CLAUDE.md` (comprehensive implementation guide)

### 🔄 Convertext (`apps/convertext/`)
**Text Conversion Tool**: AI-powered text manipulation system
- **Framework**: Next.js 15 (Pages Router), TypeScript, React 19
- **Features**: Workflow-based conversions, Supabase integration
- **Key Dependencies**: diff library, Tailwind CSS
- **Documentation**: `apps/convertext/CLAUDE.md` (architecture and API guide)

### 🎨 Gallery (`apps/gallery/`)
**UI Components Showcase**: A visual gallery of the UI components in the `@draft-gen/ui` package.
- **Framework**: Next.js 15, React 19
- **Documentation**: `apps/gallery/CLAUDE.md`

## 🛠️ Development Commands

For a complete list of development commands, see the [.project_scripts.md](/.project_scripts.md) file.

## 🎯 Key Features by App

### Draft-Gen
- **Google OAuth**: Supabase authentication
- **Templates**: JSON-based DSL for document templates
- **AI Integration**: Gemini AI for template generation
- **PDF Export**: Client-side PDF generation
- **Internationalization**: English/Portuguese support
- **Database**: Supabase with RLS policies

### Convertext  
- **Text Processing**: AI-powered text manipulation
- **Workflow System**: Multi-step conversion routines
- **Database**: Supabase with RLS policies

## 🔧 Technology Stack

### Frontend (Common)
- **Next.js**: 15
- **TypeScript**: Shared configs via `@draft-gen/typescript-config`
- **Tailwind CSS**: Consistent styling
- **React**: 19.0.0

### Backend Services
- **Supabase**: Database, auth, and storage for all applications.

### Shared Packages
- **@draft-gen/typescript-config**: Shared TypeScript configurations
- **@draft-gen/ui**: Shared UI components library
- **Prettier**: Consistent code formatting

## 🗂️ Working with Apps

### App-Specific Documentation
Each app has its own detailed CLAUDE.md file:
- **draft-gen**: Comprehensive MVP implementation guide with database schema, components, and acceptance criteria
- **convertext**: Architecture overview, API documentation, and environment variables
- **gallery**: UI component showcase and usage guidelines

### Making Changes
1. **Single App Changes**: Navigate to the specific app and work within its context
2. **Cross-App Changes**: Use turbo commands from root to affect multiple apps
3. **Shared Code**: Modify packages for components/configs used across apps

### Environment Variables
Each app manages its own environment variables.

## 🚀 Deployment Strategy

Each app can be deployed independently.

## 📋 Common Workflows

### Adding a New App
1. Create new directory in `apps/`
2. Set up package.json with turbo-compatible scripts
3. Add shared TypeScript config: `"@draft-gen/typescript-config": "*"`
4. Update root workspace configuration if needed

### Debugging Issues
1. Check individual app's CLAUDE.md for app-specific guidance
2. Use turbo filtering to isolate issues: `--filter=appname`
3. Review shared package dependencies for conflicts

## 🎯 Best Practices

1. **Use Turbo Filtering**: Always specify which apps you're working on
2. **Respect App Boundaries**: Don't cross-pollinate app-specific code
3. **Leverage Shared Packages**: Use common configs and components
4. **Consistent Formatting**: Run `npm run format` before commits
5. **Type Safety**: Each app extends shared TypeScript configs

## 📝 TypeScript Guidelines

### Strong Typing Requirements
- **NEVER use `any` type**: Always define proper types for all variables, parameters, and return values. NEVER use `any`. ALWAYS prefer strong types.
- **NEVER use `unknown` without type guards**: If you must use `unknown`, immediately narrow it with proper type guards
- **Always define explicit types** for:
  - Function parameters and return types
  - Component props and state
  - API responses and request payloads
  - Database schemas and models
- **Prefer interfaces over type aliases** for object shapes
- **Use union types and type guards** instead of `any` for multiple possible types
- **Enable strict mode** in tsconfig.json for all apps

---

For app-specific implementation details, database schemas, and detailed technical guidance, see the individual CLAUDE.md files in each app directory.
