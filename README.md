# Draft-Gen

This is a Turborepo monorepo for a project called "Draft-Gen". It consists of three Next.js applications and four shared packages.

## Project Overview

The main application is `draft-gen`, which appears to be a tool for generating drafts of text, likely using AI. It uses Supabase for its backend and authentication, and has a rich text editor built with PlateJS.

The monorepo also includes:

*   `draft-gen`: A tool for generating drafts of text, likely using AI. It uses Next.js 15 and React 19.
*   `convertext`: A Next.js application that seems to be a text conversion tool. It uses Next.js 15 and React 19.
*   `gallery`: A Next.js application that likely serves as a showcase for the UI components in the `@draft-gen/ui` package.
*   `@draft-gen/auth`: A shared authentication package that wraps Supabase authentication.
*   `@draft-gen/logger`: A shared logging package.
*   `@draft-gen/typescript-config`: A shared TypeScript configuration.
*   `@draft-gen/ui`: A shared UI component library that includes a rich text editor and other components.

## Getting Started

### Prerequisites

*   Node.js (v20 or higher)
*   npm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/luishmcmoreno/DraftGen.git
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```

## Available Scripts

The following commands are available in the root `package.json`:

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

## Monorepo Structure

The project is a monorepo managed with Turborepo. The applications are located in the `apps` directory, and the shared packages are in the `packages` directory.

## Technologies Used

*   [Turborepo](https://turbo.build/repo)
*   [Next.js](https://nextjs.org/)
*   [React](https://react.dev/)
*   [TypeScript](https://www.typescriptlang.org/)
*   [Supabase](https://supabase.com/)
*   [PlateJS](https://platejs.org/)
*   [Radix UI](https://www.radix-ui.com/)
*   [Tailwind CSS](https://tailwindcss.com/)
*   [ESLint](https://eslint.org/)
*   [Prettier](https://prettier.io/)