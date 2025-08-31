# ConverText Backend Migration Guide

This document describes the migration from the original FastAPI + localStorage setup to a Supabase-based backend with persistent history management.

## Migration Overview

### Before Migration
- **Backend**: FastAPI server with agent system
- **Storage**: localStorage for conversion routines
- **Authentication**: None
- **History**: Lost on browser refresh/clear

### After Migration  
- **Backend**: FastAPI server + Supabase database + Next.js API routes
- **Storage**: PostgreSQL database with RLS policies
- **Authentication**: Google OAuth via Supabase Auth
- **History**: Persistent across devices and sessions

## New Features

### 1. User Authentication
- Google Sign-in integration
- User profiles with avatar and display name
- Row-level security for data isolation

### 2. Persistent Storage
- All conversion routines saved to database
- Complete conversion history tracking
- Cross-device synchronization
- Usage statistics and analytics

### 3. Enhanced API
- New API endpoints for history management
- Integration with existing FastAPI backend
- Automatic migration from localStorage

### 4. Database Schema
```sql
-- User profiles (shared with draft-gen)
profiles (id, display_name, avatar_url, role, created_at, updated_at)

-- Saved conversion routines (replaces localStorage)
conversion_routines (id, owner_id, name, description, steps, usage_count, created_at, last_used)

-- Workflow execution tracking
routine_executions (id, owner_id, name, saved_routine_id, current_step_index, status, provider, created_at, last_updated)

-- Individual step tracking
conversion_steps (id, execution_id, step_number, status, input_data, output_data, error_message, duration_ms, created_at, completed_at)

-- Complete conversion history
text_conversions (id, owner_id, step_id, original_text, converted_text, task_description, tool_used, tool_args, confidence, diff_result, render_mode, provider, error_message, created_at)
```

## API Endpoints

### New Supabase-backed Endpoints
- `GET/POST /api/conversion-routines` - Manage saved routines
- `PUT/DELETE /api/conversion-routines/[id]` - Update/delete routines
- `POST /api/convert-with-history` - Convert text with history tracking
- `POST /api/evaluate-with-history` - Evaluate tasks with history
- `GET /api/history` - Get conversion history and statistics
- `POST /api/auth/callback` - Handle OAuth callbacks

### Existing FastAPI Endpoints (Still Used)
- `POST /convert` - Text conversion (called by new API routes)
- `POST /evaluate` - Task evaluation (called by new API routes)
- `GET /tool_signatures` - Available tools

## Environment Variables

Create `.env.local` with:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE=your-service-role-key-here

# ConverText Backend (existing FastAPI server)
CONVERTEXT_BACKEND_URL=http://localhost:8000
```

## Migration Process

### For Users
1. **Automatic Migration**: When users first sign in, their localStorage data is automatically migrated to Supabase
2. **No Data Loss**: Existing workflows continue to work seamlessly
3. **Optional Authentication**: Users can continue using the app without signing in (data won't be saved)

### For Developers
1. **Database Setup**: Tables are created via Supabase MCP
2. **Code Updates**: Import utilities from `utils/workflow-supabase.ts` instead of `utils/workflow.ts`
3. **API Integration**: New API routes handle both Supabase operations and FastAPI calls

## Key Implementation Details

### 1. Backward Compatibility
- Original localStorage functions still work for non-authenticated users
- Existing FastAPI backend continues to handle AI operations
- No breaking changes to existing workflows

### 2. Data Flow
```
User Input → Next.js API Route → FastAPI Backend (AI processing) → Supabase (history storage) → User Interface
```

### 3. Authentication Flow
```
User clicks Sign In → Google OAuth → Supabase Auth → Profile Creation → localStorage Migration → App Ready
```

### 4. History Management
- Every conversion is saved with full metadata
- Users can search and filter their history
- Usage statistics track tool effectiveness
- Complete audit trail for all operations

## Testing

### Manual Testing
1. **Without Authentication**: App works as before, no data persistence
2. **With Authentication**: All operations are saved and retrievable
3. **Migration**: localStorage data appears after first sign-in
4. **Cross-device**: Sign in on different device shows same data

### API Testing
```bash
# Test conversion with history
curl -X POST /api/convert-with-history -H "Content-Type: application/json" -d '{
  "text": "hello world",
  "task_description": "convert to uppercase",
  "provider": "mock"
}'

# Test history retrieval
curl /api/history?type=conversions&limit=10
```

## Benefits

1. **Data Persistence**: Never lose conversion routines or history
2. **Multi-device**: Access data from any device
3. **Analytics**: Track usage patterns and tool effectiveness  
4. **Scalability**: Database can handle millions of conversions
5. **Security**: Row-level security ensures data privacy
6. **Backup**: Automatic database backups via Supabase

## Rollback Strategy

If issues arise:
1. **Frontend**: Revert imports to use `utils/workflow.ts`
2. **Backend**: Continue using existing FastAPI endpoints
3. **Data**: localStorage data remains intact
4. **Authentication**: Remove auth components

The migration is designed to be non-destructive and fully reversible.