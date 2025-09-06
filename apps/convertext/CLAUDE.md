# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (Next.js)

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Architecture

### High-Level Structure

This is an AI-powered text conversion system that has been **migrated to use Supabase** for persistent data storage and user authentication:

1.  **Frontend**: Next.js/React application using TypeScript and Tailwind CSS
2.  **Database**: Supabase PostgreSQL with Row Level Security (RLS)
3.  **Authentication**: Google OAuth via Supabase Auth

### Frontend Architecture (`src/`)

- **Workflow-based system** (not conversation-based)
- `types/conversion.ts` - Core TypeScript interfaces for workflows, steps, and conversions
- `utils/workflow-supabase.ts` - **NEW**: Supabase-backed workflow management utilities
- `utils/workflow.ts` - Legacy localStorage utilities (still available for fallback)
- Components support multi-step conversion routines with step-by-step execution

### Database Layer (`src/lib/supabase/`)

- `client.ts` - Browser Supabase client configuration
- `server.ts` - Server-side Supabase client for API routes
- `database.types.ts` - TypeScript types for database schema
- `auth.ts` - Authentication utilities (Google OAuth)
- `conversion-routines.ts` - Saved routines management
- `conversion-steps.ts` - Step tracking and execution
- `text-conversions.ts` - Complete conversion history

### API Routes (`src/pages/api/`)

- `convert-with-history.ts` - Enhanced conversion with Supabase tracking
- `evaluate-with-history.ts` - Enhanced evaluation with backend integration
- `conversion-routines/` - Routine management endpoints
- `history/` - Conversion history and analytics
- `auth/callback.ts` - OAuth callback handling

## Environment Variables

### Frontend (Next.js) - Create `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE=your-service-role-key-here
```

## API Architecture

### New Supabase-backed API Routes:

- `POST /api/convert-with-history` - Execute conversion with history tracking
- `POST /api/evaluate-with-history` - Evaluate task with backend integration
- `GET/POST /api/conversion-routines` - Manage saved conversion routines
- `PUT/DELETE /api/conversion-routines/[id]` - Update/delete specific routines
- `GET /api/history` - Retrieve conversion history and statistics
- `POST /api/auth/callback` - Handle Google OAuth callbacks

### Data Flow:

```
User Interface → Next.js API Routes → Supabase (storage) → Response
```

### Authentication:

- Google OAuth via Supabase Auth
- Row Level Security (RLS) ensures users only see their data
- Automatic profile creation on first sign-in
- localStorage migration on authentication

## Migration Status

✅ **COMPLETED**: ConverText has been successfully migrated from localStorage to Supabase

- All conversion routines are now stored persistently
- Complete history tracking for all conversions
- Google authentication integration
- Cross-device data synchronization
- Backward compatibility maintained

### Usage:

1.  **With Authentication**: Full features with persistent data
2.  **Without Authentication**: Works as before but data is not saved
3.  **Migration**: Existing localStorage data automatically migrated on first sign-in
