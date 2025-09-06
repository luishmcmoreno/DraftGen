# Current Plan — Integrate @draft-gen/auth package into draft-gen app

**Branch:** main  
**Created:** 2025-09-06T11:30:00Z  
**Last Updated:** 2025-09-06T12:00:00Z  
**Status:** In Progress

## 1) Steps

1. [x] **Analyze current auth implementation**
   - Goal: Map all existing auth code in draft-gen to understand replacement scope
   - Files to touch: 
     - `apps/draft-gen/lib/supabase/auth.ts` (read - current auth functions)
     - `apps/draft-gen/lib/supabase/middleware.ts` (read - middleware client)
     - `apps/draft-gen/lib/supabase/server.ts` (read - server client)
     - `apps/draft-gen/lib/supabase/client.ts` (read - browser client)
     - `apps/draft-gen/middleware.ts` (read - current middleware)
   - Edits: None - analysis only
   - Commands: None
   - Verification:
     - [x] Document all auth touchpoints
     - [x] Identify database schema dependencies
     - [x] Map API routes using auth
   - Risk & rollback: No risk - read-only analysis

2. [x] **Add @draft-gen/auth dependency**
   - Goal: Install auth package and verify it builds with draft-gen
   - Files to touch:
     - `apps/draft-gen/package.json` (add @draft-gen/auth dependency)
   - Edits: Add `"@draft-gen/auth": "*"` to dependencies
   - Commands: 
     - `npm install` (from root)
     - `npx turbo build --filter=draft-gen`
   - Verification:
     - [x] Package resolves correctly
     - [x] No version conflicts
     - [x] Build succeeds
   - Risk & rollback: Low risk - can remove dependency if issues

3. [x] **Keep client creation in draft-gen**
   - Goal: Maintain client creation in draft-gen with its own Database types
   - Files to touch:
     - `apps/draft-gen/lib/supabase/server.ts` (keep original)
     - `apps/draft-gen/lib/supabase/client.ts` (keep original)
     - `apps/draft-gen/lib/supabase/middleware.ts` (keep original)
   - Edits: Reverted to original implementations
   - Commands: `npx turbo build --filter=draft-gen`
   - Verification:
     - [x] Clients use draft-gen's Database types
     - [x] No dependency on auth package for client creation
     - [x] Strong typing maintained
   - Risk & rollback: No risk - using original approach

4. [ ] **Migrate auth functions to use package with client injection**
   - Goal: Use auth package functions by passing Supabase client
   - Files to touch:
     - `apps/draft-gen/lib/supabase/auth.ts` (update to use auth package functions)
   - Edits: Import functions from `@draft-gen/auth/server` and pass client as parameter
   - Commands: `npx turbo build --filter=draft-gen`
   - Verification:
     - [ ] getUser function works with injected client
     - [ ] getProfile function works with injected client
     - [ ] requireAuth function works with injected client
     - [ ] upsertProfile function works with injected client
   - Risk & rollback: Medium risk - maintains type safety

5. [ ] **Update middleware integration**
   - Goal: Use auth package middleware utilities
   - Files to touch:
     - `apps/draft-gen/middleware.ts` (integrate package middleware)
   - Edits: Use `@draft-gen/auth/middleware` functions for session and protection
   - Commands: `npx turbo dev --filter=draft-gen`
   - Verification:
     - [ ] Session refresh works
     - [ ] Protected routes redirect correctly
     - [ ] Public routes remain accessible
     - [ ] Locale handling preserved
   - Risk & rollback: High risk - affects all routing

6. [ ] **Update API auth routes**
   - Goal: Migrate API routes to use auth package
   - Files to touch:
     - `apps/draft-gen/app/api/auth/login/route.ts` (use package auth)
     - `apps/draft-gen/app/api/auth/logout/route.ts` (use package auth)
     - `apps/draft-gen/app/[locale]/auth/callback/route.ts` (use package auth)
   - Edits: Replace local auth logic with package functions
   - Commands: `npx turbo dev --filter=draft-gen`
   - Verification:
     - [ ] Google OAuth login works
     - [ ] Logout clears session
     - [ ] Callback handles auth correctly
   - Risk & rollback: High risk - critical auth flow

7. [ ] **Integrate React providers and hooks**
   - Goal: Add auth context to the app layout
   - Files to touch:
     - `apps/draft-gen/app/[locale]/layout.tsx` (add AuthProvider)
     - `apps/draft-gen/components/Topbar.tsx` (use auth hooks)
   - Edits: Wrap app with AuthProvider, use useAuth/useUser hooks
   - Commands: `npx turbo dev --filter=draft-gen`
   - Verification:
     - [ ] Auth state available in components
     - [ ] No hydration mismatches
     - [ ] User info displays correctly
   - Risk & rollback: Medium risk - UI components affected

8. [ ] **Update protected page components**
   - Goal: Use auth package guards and hooks in pages
   - Files to touch:
     - `apps/draft-gen/app/[locale]/templates/page.tsx` (use auth guards)
     - `apps/draft-gen/app/[locale]/generator/page.tsx` (use auth guards)
   - Edits: Replace local auth checks with AuthGuard components
   - Commands: `npx turbo dev --filter=draft-gen`
   - Verification:
     - [ ] Protected pages require auth
     - [ ] Unauthorized users redirect
     - [ ] Authorized users see content
   - Risk & rollback: Medium risk - page functionality

9. [ ] **Test end-to-end auth flow**
   - Goal: Verify complete auth integration works
   - Files to touch: None - testing only
   - Edits: None
   - Commands: 
     - `npx turbo dev --filter=draft-gen`
     - Manual testing of all auth flows
   - Verification:
     - [ ] Login with Google works
     - [ ] Profile creation/update works
     - [ ] Session persists across refreshes
     - [ ] Logout works correctly
     - [ ] Protected routes enforce auth
     - [ ] API routes respect auth
   - Risk & rollback: No risk - testing phase

10. [ ] **Clean up deprecated auth code**
    - Goal: Remove old auth implementation files
    - Files to touch:
      - Remove unused functions from `apps/draft-gen/lib/supabase/auth.ts`
      - Clean up redundant client code
    - Edits: Delete deprecated code, keep only what's needed
    - Commands: 
      - `npx turbo build --filter=draft-gen`
      - `npx turbo lint --filter=draft-gen`
    - Verification:
      - [ ] No unused imports
      - [ ] Build succeeds
      - [ ] No lint errors
    - Risk & rollback: Low risk - cleanup phase

## 2) Progress

- **Current Step:** 4
- **Completed Steps:** 1, 2, 3
- **Notes:**
  - Auth package has been built with steps 1-8 from previous plan
  - Package includes server/client/middleware/React integrations
  - Draft-gen currently uses direct Supabase implementation
  - Need to maintain compatibility with existing database schema
  - Must preserve i18n middleware integration
  - Step 1 completed: Analysis shows auth is used in:
    - Supabase clients (server.ts, client.ts, middleware.ts)
    - Auth functions (auth.ts: getUser, getProfile, requireAuth, upsertProfile)
    - Middleware for session refresh and protected routes
    - API routes (login/logout/callback)
    - Pages (templates, generator use requireAuth)
    - Components (GeneratorContent uses client directly)
    - Database: profiles table with id, role, display_name, avatar_url
  - Step 2 completed: Added @draft-gen/auth dependency to package.json
    - Package resolves correctly in node_modules
    - Build succeeds with auth package included
  - Step 3 completed: Decided to keep client creation in draft-gen
    - Better architecture: auth package receives clients instead of creating them
    - Each app maintains its own Database types
    - Reverted to original client implementations

## 3) Next Step Preview

Step 4 will migrate the auth functions in draft-gen to use the auth package functions with client injection. This means updating the auth.ts file to import functions from @draft-gen/auth/server and passing the Supabase client as a parameter. This approach maintains strong typing while leveraging the shared auth logic.

---

Type **1** to CONTINUE (execute Step 1), **2** to EDIT (revise plan), or **3** to CANCEL.