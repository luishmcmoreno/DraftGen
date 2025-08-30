# Task Completion Checklist for DraftGen

## Before Marking a Task as Complete

### 1. Code Quality Checks (MANDATORY)

- [ ] Run `npm run lint:fix` and fix any errors
- [ ] Run `npm run format` to ensure consistent formatting
- [ ] Verify no TypeScript errors in the IDE
- [ ] Remove any `console.log` statements (they trigger warnings)

### 2. Internationalization

- [ ] Verify all UI strings use i18n keys (no hardcoded text)
- [ ] Check that translation keys exist in both `/messages/en.json` and `/messages/pt.json`
- [ ] Test with both English and Portuguese locales

### 3. Type Safety

- [ ] All functions have proper TypeScript types
- [ ] Avoid using `any` type (triggers warnings)
- [ ] Zod schemas validate any JSON/DSL structures

### 4. Component Standards

- [ ] Components follow PascalCase naming
- [ ] Files are in the correct directory structure
- [ ] Tailwind classes used for styling (no inline styles)
- [ ] Components are properly exported

### 5. Database Operations (if applicable)

- [ ] RLS policies are in place for new tables
- [ ] Queries respect user authentication boundaries
- [ ] Migrations use the Supabase MCP tool

### 6. Testing Locally

- [ ] Start dev server: `npm run dev`
- [ ] Test the feature/fix in the browser
- [ ] Check browser console for errors
- [ ] Verify responsive design if UI changes

### 7. Git Hygiene

- [ ] Stage only relevant files
- [ ] Write clear commit messages
- [ ] Reference any related issues or tasks

## Post-Task Verification

- Development server runs without errors
- No ESLint warnings or errors
- Code formatted with Prettier
- All i18n keys are defined
- Feature works as expected in the browser
