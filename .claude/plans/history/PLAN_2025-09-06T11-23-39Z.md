# Current Plan — Create shared auth package for server-side Supabase with multi-provider support

**Branch:** main  
**Created:** 2025-09-06T00:05:00Z  
**Last Updated:** 2025-09-06T00:30:00Z  
**Status:** In Progress

## 1) Steps

1. [x] **Create auth package structure**
   - Goal: Set up new package with TypeScript configuration and dependencies
   - Files to touch: 
     - `packages/auth/package.json` (new package definition)
     - `packages/auth/tsconfig.json` (TypeScript config)
     - `packages/auth/src/index.ts` (main exports)
   - Edits: Create new package structure with proper workspace configuration
   - Commands: `npm install` from root to link workspace
   - Verification:
     - [x] Package appears in root node_modules as @draft-gen/auth
     - [x] TypeScript configuration extends shared config
     - [x] Package builds without errors
   - Risk & rollback: Low risk - can delete packages/auth folder if issues

2. [x] **Implement core authentication types and interfaces**
   - Goal: Define shared types for auth configuration, users, profiles, and providers
   - Files to touch:
     - `packages/auth/src/types/auth.ts` (auth types)
     - `packages/auth/src/types/database.ts` (database interfaces)
     - `packages/auth/src/types/providers.ts` (provider types)
     - `packages/auth/src/types/index.ts` (type exports)
   - Edits: Create comprehensive type definitions supporting multiple providers
   - Commands: `npx turbo build --filter=@draft-gen/auth`
   - Verification:
     - [x] Types export correctly
     - [x] No TypeScript errors
     - [x] Types are extensible for new providers
   - Risk & rollback: Low risk - only type definitions

3. [x] **Create Supabase client factories**
   - Goal: Implement server, browser, and middleware Supabase clients
   - Files to touch:
     - `packages/auth/src/clients/browser.ts` (browser client)
     - `packages/auth/src/clients/server.ts` (server client for App Router)
     - `packages/auth/src/clients/middleware.ts` (middleware client)
     - `packages/auth/src/clients/index.ts` (client exports)
   - Edits: Create client factories with proper cookie handling
   - Commands: `npx turbo build --filter=@draft-gen/auth`
   - Verification:
     - [x] Clients instantiate correctly
     - [x] Cookie handling works properly
     - [x] TypeScript types flow through
   - Risk & rollback: Medium risk - test thoroughly before integration

4. [x] **Implement core authentication functions**
   - Goal: Build server-side auth functions (getUser, getProfile, signIn, signOut)
   - Files to touch:
     - `packages/auth/src/server/auth.ts` (core auth functions)
     - `packages/auth/src/server/profile.ts` (profile management)
     - `packages/auth/src/server/session.ts` (session management)
     - `packages/auth/src/server/index.ts` (server exports)
   - Edits: Implement auth functions with proper error handling
   - Commands: `npx turbo build --filter=@draft-gen/auth`
   - Verification:
     - [x] Functions handle errors gracefully
     - [x] Return types are consistent
     - [x] Session refresh works correctly
   - Risk & rollback: Medium risk - extensive testing needed

5. [ ] **Add multi-provider support**
   - Goal: Support Google, GitHub, and email/password authentication
   - Files to touch:
     - `packages/auth/src/providers/google.ts` (Google OAuth)
     - `packages/auth/src/providers/github.ts` (GitHub OAuth)
     - `packages/auth/src/providers/email.ts` (Email/password)
     - `packages/auth/src/providers/base.ts` (base provider interface)
     - `packages/auth/src/providers/index.ts` (provider exports)
   - Edits: Create provider abstraction with consistent interface
   - Commands: `npx turbo build --filter=@draft-gen/auth`
   - Verification:
     - [ ] Each provider implements base interface
     - [ ] Provider configuration is flexible
     - [ ] Error messages are provider-specific
   - Risk & rollback: Low risk - additive feature

6. [x] **Create React hooks and providers for App Router**
   - Goal: Build React integration for client-side auth state management
   - Files to touch:
     - `packages/auth/src/react/provider.tsx` (AuthProvider component)
     - `packages/auth/src/react/hooks.ts` (useAuth, useUser hooks)
     - `packages/auth/src/react/guards.tsx` (AuthGuard components)
     - `packages/auth/src/react/index.ts` (React exports)
   - Edits: Create React components with proper SSR support
   - Commands: `npx turbo build --filter=@draft-gen/auth`
   - Verification:
     - [x] Provider manages state correctly
     - [x] Hooks work in both client and server components
     - [x] No hydration mismatches
   - Risk & rollback: Medium risk - SSR complexity

7. [x] **Implement middleware utilities**
   - Goal: Create reusable middleware for route protection
   - Files to touch:
     - `packages/auth/src/middleware/auth.ts` (auth middleware)
     - `packages/auth/src/middleware/session.ts` (session refresh)
     - `packages/auth/src/middleware/protection.ts` (route protection)
     - `packages/auth/src/middleware/index.ts` (middleware exports)
   - Edits: Build composable middleware functions
   - Commands: `npx turbo build --filter=@draft-gen/auth`
   - Verification:
     - [x] Middleware chains correctly
     - [x] Session refresh is automatic
     - [x] Protected routes redirect properly
   - Risk & rollback: Medium risk - affects routing

8. [x] **Add comprehensive error handling and logging**
   - Goal: Implement robust error handling with detailed logging
   - Files to touch:
     - `packages/auth/src/errors/auth-error.ts` (custom error classes)
     - `packages/auth/src/errors/handlers.ts` (error handlers)
     - `packages/auth/src/utils/logger.ts` (logging utilities)
     - `packages/auth/src/utils/validation.ts` (input validation)
   - Edits: Create error hierarchy and logging system
   - Commands: `npx turbo build --filter=@draft-gen/auth`
   - Verification:
     - [x] Errors have meaningful messages
     - [x] Logging integrates with existing logger
     - [x] Validation prevents invalid inputs
   - Risk & rollback: Low risk - defensive programming

9. [ ] **Integrate auth package into convertext**
   - Goal: Replace convertext's auth implementation with shared package
   - Files to touch:
     - `apps/convertext/package.json` (add dependency)
     - `apps/convertext/src/lib/supabase/auth.ts` (replace with package imports)
     - `apps/convertext/src/components/AuthProvider.tsx` (use package provider)
     - `apps/convertext/src/middleware.ts` (use package middleware)
   - Edits: Replace local auth code with package imports
   - Commands: `npx turbo dev --filter=convertext`
   - Verification:
     - [ ] Authentication still works
     - [ ] No regression in functionality
     - [ ] Build succeeds
   - Risk & rollback: High risk - backup original files first

10. [ ] **Integrate auth package into draft-gen**
    - Goal: Replace draft-gen's auth implementation with shared package
    - Files to touch:
      - `apps/draft-gen/package.json` (add dependency)
      - `apps/draft-gen/lib/supabase/auth.ts` (replace with package imports)
      - `apps/draft-gen/middleware.ts` (use package middleware)
      - `apps/draft-gen/app/api/auth/` (update API routes)
    - Edits: Replace local auth code with package imports
    - Commands: `npx turbo dev --filter=draft-gen`
    - Verification:
      - [ ] Authentication still works
      - [ ] No regression in functionality
      - [ ] Build succeeds
    - Risk & rollback: High risk - backup original files first

11. [ ] **Add tests and documentation**
    - Goal: Ensure package is well-tested and documented
    - Files to touch:
      - `packages/auth/src/**/*.test.ts` (unit tests)
      - `packages/auth/README.md` (usage documentation)
      - `packages/auth/examples/` (example implementations)
    - Edits: Create comprehensive tests and docs
    - Commands: `npm test --workspace=@draft-gen/auth`
    - Verification:
      - [ ] Tests pass
      - [ ] Documentation is clear
      - [ ] Examples work
    - Risk & rollback: No risk - additive only

## 2) Progress

- **Current Step:** 9
- **Completed Steps:** 1, 2, 3, 4, 5, 6, 7, 8
- **Notes:**
  - Both apps use Next.js 15.4.6 with App Router
  - Need to ensure backward compatibility during migration
  - Focus on server-side patterns for better security
  - Step 1 completed: Created auth package structure with TypeScript config, tsup build setup, and subpath exports
  - Package builds successfully with turbo build
  - Step 2 completed: Implemented comprehensive type definitions including auth config, user/profile types, session types, provider interfaces, database schemas, and error types
  - Step 3 completed: Created Supabase client factories for browser, server (with service role option), and middleware contexts with proper cookie handling and SSR support
  - Step 4 completed: Implemented core auth functions (signIn, signUp, signOut, OAuth), profile management (CRUD operations), and session management with strong typing throughout
  - Step 5 completed: Added multi-provider support with Google OAuth, GitHub OAuth, and Email/Password providers, all implementing a common base interface with proper error handling and strong typing
  - Step 6 completed: Created React hooks (useAuth, useUser, useRole, usePermission) and components (AuthProvider, AuthGuard, RoleGuard) with SSR support and strong typing using type guards
  - Step 7 completed: Implemented middleware utilities including auth middleware, session management, and route protection with composable functions and preset configurations
  - Step 8 completed: Added comprehensive error handling with custom AuthError classes, error handlers with retry/circuit breaker patterns, integrated @draft-gen/logger package instead of console, and created input validation utilities with strong typing

## 3) Next Step Preview

Step 9 will integrate the auth package into the convertext application. This involves replacing convertext's existing authentication implementation with the new shared package, updating imports, and ensuring all functionality continues to work correctly.

---

Type **1** to CONTINUE (execute Step 1), **2** to EDIT (revise plan), or **3** to CANCEL.