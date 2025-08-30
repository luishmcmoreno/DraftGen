# Database Architecture for DraftGen

## Supabase Setup

- **Authentication**: Google OAuth via Supabase Auth
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Required Environment Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL` - Project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anonymous/Public key
  - `SUPABASE_SERVICE_ROLE` - Service role key (server-only)

## Database Schema

### profiles Table

```sql
- id: uuid (primary key, references auth.users)
- org_id: uuid (optional)
- role: text ('GENERATOR' or 'CONSUMER')
- display_name: text
- avatar_url: text
- created_at: timestamptz
- updated_at: timestamptz
```

### templates Table

```sql
- id: uuid (primary key)
- owner_id: uuid (references profiles)
- name: text (required)
- description: text
- tags: text[] (extracted variable names)
- json: jsonb (DSL structure)
- created_at: timestamptz
- updated_at: timestamptz
```

## RLS Policies

- **profiles**: Users can only read/write their own profile
- **templates**: Users can only access their own templates
- All queries automatically filtered by authenticated user

## Indexes

- `templates_owner_idx` - B-tree index on owner_id
- `templates_json_gin` - GIN index on json column for JSONB queries

## DSL Structure

The `json` column stores document templates following this schema:

- Root node type: "document"
- Child nodes: text, heading, list, table, grid, page-break
- Variables: `${VARIABLE_NAME}` format
- Validated with Zod schemas in `/lib/dslValidator.ts`

## Important Notes

- Always use Supabase MCP tools for database migrations
- Never disable RLS on production tables
- Test RLS policies to ensure proper user isolation
- Use JSONB operators for efficient template queries
