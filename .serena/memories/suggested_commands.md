# Suggested Commands for DraftGen Development

## Development Commands

- `npm run dev` - Start the development server (http://localhost:3000)
- `npm run build` - Build the production application
- `npm start` - Start the production server

## Code Quality Commands (IMPORTANT: Run these after completing tasks)

- `npm run lint` - Run ESLint to check for code issues
- `npm run lint:fix` - Run ESLint and automatically fix issues
- `npm run format` - Format all code with Prettier
- `npm run format:check` - Check if code formatting is correct

## Git Commands (Darwin/macOS)

- `git status` - Check current branch and changes
- `git add .` - Stage all changes
- `git commit -m "message"` - Commit staged changes
- `git push` - Push commits to remote
- `git pull` - Pull latest changes from remote
- `git diff` - View unstaged changes
- `git log --oneline -n 10` - View recent commits

## System Utilities (Darwin/macOS)

- `ls -la` - List all files with details
- `cd [directory]` - Change directory
- `pwd` - Print working directory
- `cat [file]` - Display file contents
- `grep -r "pattern" .` - Search for pattern in files
- `find . -name "*.ts"` - Find files by name pattern

## Database (via Supabase MCP)

- Use the Supabase MCP tools for database operations
- Tables: profiles, templates
- RLS (Row Level Security) is enabled on all tables

## Testing

- No test framework is currently configured in the project
- Consider adding Jest, Vitest, or Playwright for testing in the future

## Health Check

- `curl http://localhost:3000/api/health` - Check Supabase connection status
