# GEMINI.md

## Project Overview

This is a Turborepo monorepo for a project called "Draft-Gen". It consists of three Next.js applications and four shared packages. The main application is `draft-gen`, which appears to be a tool for generating drafts of text, likely using AI. It uses Supabase for its backend and authentication, and has a rich text editor built with PlateJS.

The monorepo also includes:

*   `draft-gen`: A tool for generating drafts of text, likely using AI. It uses Next.js 15 and React 19.
*   `convertext`: A Next.js application that seems to be a text conversion tool. It uses Next.js 15 and React 19.
*   `gallery`: A Next.js application that likely serves as a showcase for the UI components in the `@draft-gen/ui` package.
*   `@draft-gen/auth`: A shared authentication package that wraps Supabase authentication.
*   `@draft-gen/logger`: A shared logging package.
*   `@draft-gen/typescript-config`: A shared TypeScript configuration.
*   `@draft-gen/ui`: A shared UI component library that includes a rich text editor and other components.

## Building and Running

The project uses `turbo` to manage the monorepo. The following commands are available in the root `package.json`:

*   `npm run build`: Builds all the applications and packages.
*   `npm run dev`: Runs all the applications in development mode.
*   `npm run lint`: Lints all the applications and packages.
*   `npm run format`: Formats the code in all the applications and packages.
*   `npm run format:check`: Checks the formatting of the code in all the applications and packages.
*   `npm run type-check`: Type-checks all the applications and packages.

Each application can also be run individually. For example, to run the `draft-gen` application in development mode, you can run the following command from the root of the project:

```bash
npm run dev -- --filter=draft-gen
```

## Development Conventions

*   **Monorepo:** The project is a monorepo managed with Turborepo.
*   **Package Manager:** The project uses `npm` as its package manager.
*   **TypeScript:** The project is written in TypeScript. NEVER use `any`. ALWAYS prefer strong types.
*   **Linting:** The project uses ESLint for linting.
*   **Formatting:** The project uses Prettier for code formatting.
*   **UI:** The project uses a shared UI library (`@draft-gen/ui`) that is built with PlateJS, Radix UI, and Tailwind CSS.
*   **Authentication:** The project uses a shared authentication package (`@draft-gen/auth`) that wraps Supabase authentication.
*   **Backend:** The project uses Supabase for its backend for both `draft-gen` and `convertext` applications.