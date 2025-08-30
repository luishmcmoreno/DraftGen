# DraftGen Project Overview

## Purpose

DraftGen is a document generation platform that allows users to create, manage, and generate documents from JSON-based templates using AI assistance. The MVP features a Lovable-style UI with a left chat panel for prompts and a right viewer for HTML preview.

## Tech Stack

- **Framework**: Next.js 15.4.6 with App Router and TypeScript
- **Styling**: Tailwind CSS (minimalist, neutral grayscale palette)
- **Authentication & Database**: Supabase (Google OAuth, PostgreSQL)
- **Internationalization**: next-intl 4.3.4
- **AI Integration**: Google Generative AI (@google/generative-ai)
- **UI Components**: Radix UI (@radix-ui/react-dialog)
- **Icons**: Lucide React
- **Validation**: Zod 3.23.8
- **Build Tools**: PostCSS, Autoprefixer

## Core Features

1. **Authentication**: Google login via Supabase Auth
2. **Template Management**: Create, list, edit JSON-based templates (DSL)
3. **Generator Page**: Chat interface for AI-powered template generation
4. **Document Generation**: Fill variables and generate PDF client-side
5. **Full i18n Support**: English and Portuguese translations

## Project Structure

- `/app` - Next.js App Router pages and layouts
- `/components` - React components
- `/lib` - Core libraries (Supabase client, i18n, DSL validator)
- `/utils` - Utility functions (variable extraction, substitution, etc.)
- `/messages` - i18n translation files (en.json, pt.json)
- `/contexts` - React contexts
- `/hooks` - Custom React hooks
- `/styles` - Global styles and Tailwind configuration
- `/types` - TypeScript type definitions
- `/public` - Static assets
