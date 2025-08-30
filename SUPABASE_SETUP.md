# Supabase Setup Instructions

## Prerequisites

1. Create a Supabase account at https://supabase.com
2. Create a new project

## Configuration Steps

### 1. Get your Supabase credentials

1. Go to your project dashboard
2. Navigate to Settings > API
3. Copy the following values:
   - Project URL (looks like: https://xxxxx.supabase.co)
   - Anon/Public key (safe to use in browser)
   - Service Role key (keep secret, server-only)

### 2. Create .env.local file

Create a `.env.local` file in the root directory with your credentials:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and add your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE=your-service-role-key-here
```

### 3. Test the connection

After adding your credentials, restart the development server:

```bash
npm run dev
```

Then test the health check endpoint:

```bash
curl http://localhost:3000/api/health
```

You should see a response like:

```json
{
  "status": "healthy",
  "timestamp": "2025-08-18T...",
  "checks": {
    "supabase": "connected",
    "auth": "anonymous",
    "database": "reachable"
  }
}
```

## Database Setup

The database tables will be created via the Supabase MCP tool. The required tables are:

- `profiles` - User profiles
- `templates` - Document templates

These are defined in CLAUDE.md and will be created when running the database setup tasks.
