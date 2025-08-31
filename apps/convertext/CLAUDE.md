# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (Next.js)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

### Backend (FastAPI)
- `cd backend && python -m uvicorn main:app --reload` - Start backend server (if using original setup)
- `cd backend && python test_tools.py` - Run basic tool tests

## Project Architecture

### High-Level Structure
This is an AI-powered text conversion system that has been **migrated to use Supabase** for persistent data storage and user authentication:

1. **Frontend**: Next.js/React application using TypeScript and Tailwind CSS
2. **Database**: Supabase PostgreSQL with Row Level Security (RLS)
3. **Authentication**: Google OAuth via Supabase Auth
4. **Backend Integration**: FastAPI server for AI processing + Supabase for data persistence
5. **Agent System**: LLM-powered conversion agents with deterministic tools

### Core Components

#### Backend Agent System (`/backend/agent/`)
- `conversion_agent.py` - Main agent that processes text conversion requests
- `providers.py` - LLM provider abstractions (OpenAI, Gemini, Mock)
- Agent uses custom prompt template and output parser to select appropriate tools

#### Text Tools (`/backend/tools/`)
- `text_tools.py` - Deterministic text manipulation utilities
- Tools include uppercase/lowercase, deduplication, word/line counting, CSV to JSON conversion
- Tools are dynamically exposed to the agent system

#### Frontend Architecture (`src/`)
- **Workflow-based system** (not conversation-based)
- `types/conversion.ts` - Core TypeScript interfaces for workflows, steps, and conversions
- `utils/workflow-supabase.ts` - **NEW**: Supabase-backed workflow management utilities
- `utils/workflow.ts` - Legacy localStorage utilities (still available for fallback)
- Components support multi-step conversion routines with step-by-step execution

#### Database Layer (`src/lib/supabase/`)
- `client.ts` - Browser Supabase client configuration
- `server.ts` - Server-side Supabase client for API routes
- `database.types.ts` - TypeScript types for database schema
- `auth.ts` - Authentication utilities (Google OAuth)
- `conversion-routines.ts` - Saved routines management
- `conversion-steps.ts` - Step tracking and execution
- `text-conversions.ts` - Complete conversion history

#### API Routes (`src/pages/api/`)
- `convert-with-history.ts` - Enhanced conversion with Supabase tracking
- `evaluate-with-history.ts` - Enhanced evaluation with backend integration  
- `conversion-routines/` - Routine management endpoints
- `history/` - Conversion history and analytics
- `auth/callback.ts` - OAuth callback handling

### Key Concepts

#### Workflow vs Conversation
The system transitioned from conversation-based to workflow-based management:
- **WorkflowStep**: Individual conversion steps with status tracking
- **ConversionRoutineExecution**: Multi-step workflow execution
- **SavedConversionRoutine**: Reusable workflow templates

#### Provider System
Backend supports multiple LLM providers:
- **OpenAI**: Via `OPENAI_API_KEY` environment variable
- **Gemini**: Via Google Generative AI
- **Mock**: For development/testing
- Provider selection via `LLM_PROVIDER` environment variable or `X-LLM-Provider` header

#### Agent Tool Selection
The conversion agent:
1. Receives text and task description
2. Uses LLM to evaluate which tool to use
3. Executes the selected tool with parsed arguments
4. Returns results with diff visualization

## Environment Variables

### Frontend (Next.js) - Create `.env.local`:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE=your-service-role-key-here

# ConverText Backend Integration
CONVERTEXT_BACKEND_URL=http://localhost:8000
```

### Backend (FastAPI) - Optional if using original setup:
- `LLM_PROVIDER` - "openai", "gemini", or "mock" 
- `OPENAI_API_KEY` - OpenAI API key (if using OpenAI)
- `OPENAI_MODEL` - Model name (default: "gpt-4o-mini")
- `OPENAI_TEMPERATURE` - Temperature setting (default: 0.7)

## API Architecture

### New Supabase-backed API Routes:
- `POST /api/convert-with-history` - Execute conversion with history tracking
- `POST /api/evaluate-with-history` - Evaluate task with backend integration
- `GET/POST /api/conversion-routines` - Manage saved conversion routines
- `PUT/DELETE /api/conversion-routines/[id]` - Update/delete specific routines
- `GET /api/history` - Retrieve conversion history and statistics
- `POST /api/auth/callback` - Handle Google OAuth callbacks

### Original FastAPI endpoints (still used internally):
- `POST /convert` - Execute text conversion (called by API routes)
- `POST /evaluate` - Evaluate task and suggest tools (called by API routes)
- `GET /tool_signatures` - Get available tool signatures

### Data Flow:
```
User Interface → Next.js API Routes → FastAPI Backend (AI) + Supabase (storage) → Response
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
1. **With Authentication**: Full features with persistent data
2. **Without Authentication**: Works as before but data is not saved
3. **Migration**: Existing localStorage data automatically migrated on first sign-in