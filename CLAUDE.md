# DraftGen Monorepo

This is a Turbo monorepo containing multiple applications and shared packages. This document provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🏗️ Project Structure

```
DraftGen/
├── apps/
│   ├── draft-gen/           # Document generation MVP app (Next.js App Router)
│   ├── convertext/          # Text conversion tool (Next.js Pages Router)
│   └── admin/              # Admin dashboard
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
- **Key Dependencies**: Supabase, next-intl, Gemini AI, Radix UI
- **Documentation**: `apps/draft-gen/CLAUDE.md` (comprehensive implementation guide)

### 🔄 Convertext (`apps/convertext/`)
**Text Conversion Tool**: AI-powered text manipulation system
- **Framework**: Next.js 14 (Pages Router), TypeScript, React 18
- **Features**: Workflow-based conversions, multiple LLM providers, tool system
- **Key Dependencies**: diff library, Tailwind CSS
- **Documentation**: `apps/convertext/CLAUDE.md` (architecture and API guide)

### 👤 Admin (`apps/admin/`)
**Admin Dashboard**: Management interface
- **Status**: Basic structure in place

## 🛠️ Development Commands

### Root Level (All Apps)
```bash
# Install all dependencies
npm install

# Run all apps in development
npm run dev

# Build all apps
npm run build

# Lint all apps
npm run lint

# Format all code
npm run format

# Type check all apps
npm run type-check
```

### Individual App Commands
```bash
# Run specific app
npx turbo dev --filter=draft-gen
npx turbo dev --filter=convertext
npx turbo dev --filter=admin

# Build specific app
npx turbo build --filter=draft-gen

# Run multiple apps
npx turbo dev --filter=draft-gen --filter=convertext
```

### Port Assignments
- **draft-gen**: Usually runs on `http://localhost:3000` or `http://localhost:3001`
- **convertext**: Usually runs on `http://localhost:3000` or `http://localhost:3001`
- Turbo automatically handles port conflicts by assigning available ports

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
- **Multiple LLM Support**: OpenAI, Gemini, Mock providers
- **Tool System**: Deterministic text transformation tools
- **Backend API**: FastAPI server with agent system

## 🔧 Technology Stack

### Frontend (Common)
- **Next.js**: Different versions (14 for convertext, 15 for draft-gen)
- **TypeScript**: Shared configs via `@draft-gen/typescript-config`
- **Tailwind CSS**: Consistent styling
- **React**: Different versions (18 vs 19) - both supported

### Backend Services
- **Draft-Gen**: Supabase (database, auth, storage)
- **Convertext**: FastAPI backend with agent system
- **AI Providers**: Gemini AI, OpenAI (depending on app)

### Shared Packages
- **@draft-gen/typescript-config**: Shared TypeScript configurations
- **@draft-gen/ui**: Shared UI components library
- **Prettier**: Consistent code formatting

## 🗂️ Working with Apps

### App-Specific Documentation
Each app has its own detailed CLAUDE.md file:
- **draft-gen**: Comprehensive MVP implementation guide with database schema, components, and acceptance criteria
- **convertext**: Architecture overview, API documentation, and environment variables

### Making Changes
1. **Single App Changes**: Navigate to the specific app and work within its context
2. **Cross-App Changes**: Use turbo commands from root to affect multiple apps
3. **Shared Code**: Modify packages for components/configs used across apps

### Environment Variables
Each app manages its own environment variables:
- **draft-gen**: Supabase keys, AI keys
- **convertext**: LLM provider keys, model settings

## 🚀 Deployment Strategy

Each app can be deployed independently:
- **draft-gen**: Optimized for Vercel deployment with Supabase backend
- **convertext**: Frontend + separate FastAPI backend deployment
- **Shared assets**: Can be deployed to CDN if needed

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

---

For app-specific implementation details, database schemas, and detailed technical guidance, see the individual CLAUDE.md files in each app directory.