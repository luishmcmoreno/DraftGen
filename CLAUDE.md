# DraftGen — MVP Implementation Guide (claude.md)

This document defines the plan, architecture, database schema, tasks, and acceptance criteria for the DraftGen MVP. The UI follows a Lovable-style layout: **left chat (prompts)** + **right viewer (HTML preview)**. All strings must use i18n keys (no hardcoded UI text).

---

## 🎯 Goal

- **Auth:** Google login via Supabase Auth; store user profile (name, avatar, role).
- **Templates:** Create, list, edit (via prompts only in MVP) JSON-based templates (DSL).
- **Generator Page:** Chat on the left (prompts → JSON), Viewer on the right (HTML preview).
- **Generate Document:** Fill variables → client-side PDF download (no DB persistence in MVP).
- **Design:** Minimalist, sober palette, neutral typography.
- **i18n:** Full coverage from day one (no raw strings).

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS (light, neutral grayscale)
- **Auth/DB/Storage:** Supabase
- **i18n:** `next-intl` (or `next-i18next`) — choose one and stick to it
- **AI:** Server-side API route calling your LLM provider
- **PDF (MVP):** Client-side html2pdf.js (html2canvas + jsPDF)
- **Validation:** Zod for DSL schema

---

## 🌍 i18n Rules

- No raw strings in UI; only translation keys.
- Organize translations by namespace: `common`, `auth`, `templates`, `generator`, `viewer`.
- Files:
  - `/messages/en.json`
  - `/messages/pt.json`
- Provide helpers for server and client components.
- Dev-time warnings for missing keys.

---

## 📂 Project Structure (proposed)

```
/app
  /login
    page.tsx
  /templates
    page.tsx
  /generator
    page.tsx
  /api
    /ai
      generate-template/route.ts
/messages
  en.json
  pt.json
/components
  Topbar.tsx
  TemplateCard.tsx
  ChatPanel.tsx
  VariableFormModal.tsx
  Viewer.tsx
/lib
  supabaseClient.ts
  i18n.ts
  dslValidator.ts
/utils
  extractVariables.ts
  substituteVariables.ts
  formatDate.ts
/styles
  globals.css
```

---

## 🔐 Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE` (server only)
- `AI_API_KEY` (server only)

---

## 🗄️ Supabase Schema (MCP SQL)

Run via Supabase MCP:

```sql
-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid,
  role text check (role in ('GENERATOR','CONSUMER')) default 'GENERATOR',
  display_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "self profile read"
on public.profiles for select
using (auth.uid() = id);

create policy "self profile upsert"
on public.profiles for insert with check (auth.uid() = id);

create policy "self profile update"
on public.profiles for update using (auth.uid() = id);

-- TEMPLATES
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  description text,
  tags text[] default '{}',        -- derived variable names (max 3 shown in UI)
  json jsonb not null,             -- DSL
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists templates_owner_idx on public.templates (owner_id);
create index if not exists templates_json_gin on public.templates using gin (json);

alter table public.templates enable row level security;

create policy "owner read"
on public.templates for select
using (owner_id = auth.uid());

create policy "owner write"
on public.templates for insert with check (owner_id = auth.uid());

create policy "owner update"
on public.templates for update using (owner_id = auth.uid());
```

RLS is mandatory. All app queries must operate under the authenticated user.

---

## 📜 DSL (Document Schema v1) + Validation

**Minimal DSL** for MVP (prompts-only editing):

```json
{
  "type": "document",
  "children": [
    { "type": "text", "content": "Employment Contract for ${EMPLOYEE_NAME}" },
    { "type": "text", "content": "Start Date: ${START_DATE}" }
  ]
}
```

**Zod schema (`/lib/dslValidator.ts`):**

```ts
import { z } from 'zod';

export const TextNode = z.object({
  type: z.literal('text'),
  content: z.string(),
});

export const DocumentNode = z.object({
  type: z.literal('document'),
  children: z.array(TextNode),
});

export type DocumentSchema = z.infer<typeof DocumentNode>;
```

- Validate all AI outputs against this schema before updating the viewer or saving.
- Reject invalid JSON and surface i18n’d errors.

---

## 🧩 Utilities

**Variable extraction (`/utils/extractVariables.ts`):**

```ts
export const extractVariables = (dsl: unknown): string[] => {
  const result = new Set<string>();
  const visit = (node: any) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'text' && typeof node.content === 'string') {
      const re = /\$\{([A-Z0-9_]+)\}/g;
      let m;
      while ((m = re.exec(node.content))) result.add(m[1]);
    }
    if (Array.isArray(node.children)) node.children.forEach(visit);
  };
  visit(dsl);
  return Array.from(result);
};
```

**Variable substitution (`/utils/substituteVariables.ts`):**

```ts
export const substituteVariables = (dsl: any, values: Record<string, string>) => {
  const clone = structuredClone(dsl);
  const replace = (text: string) => text.replace(/\$\{([A-Z0-9_]+)\}/g, (_, k) => values[k] ?? '');

  const walk = (node: any) => {
    if (node.type === 'text' && typeof node.content === 'string') {
      node.content = replace(node.content);
    }
    if (Array.isArray(node.children)) node.children.forEach(walk);
  };

  walk(clone);
  return clone;
};
```

**Date formatting (`/utils/formatDate.ts`):**

```ts
export const formatDate = (d: string | number | Date) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(d));
```

---

## 🧭 Routes & API

**/login** — Google Sign-In via Supabase.  
**/templates** — List user templates as cards.  
**/generator** — Lovable-style page (chat + viewer).  
**/api/ai/generate-template** — Server route that:

- Receives `{ prompt, existingJson? }`
- Calls LLM with system instructions to output **only** valid JSON matching the DSL
- Validates with Zod; on success returns the JSON; on failure returns an error

**Security:** AI key only server-side; never exposed to client.

---

## 🧱 Components

**Topbar.tsx**

- Left: app name/logo (i18n key)
- Links: `/generator`, `/templates` (highlight active)
- Right: user avatar (from `profiles.avatar_url`) with dropdown (Profile placeholder, Logout)
- i18n keys: `common.nav.generator`, `common.nav.templates`, `common.nav.logout`, `common.appName`

**TemplateCard.tsx**

- Shows: name, description, createdAt, updatedAt, up to 3 variable chips.
- If more than 3, show `+X` and on hover a tooltip lists remaining.
- Buttons: **Edit** → `/generator?templateId=...`; **Generate** → opens variable modal.
- i18n: `templates.card.*`

**ChatPanel.tsx**

- Textarea input; send button; messages list (user vs system).
- On send: POST to `/api/ai/generate-template` with `{ prompt, existingJson }`.
- Validate JSON; update viewer state or surface error toast.
- i18n: `generator.chat.placeholder`, `generator.chat.send`, `generator.chat.error.invalidJson`

**Viewer.tsx**

- Renders DSL to HTML.
- A4 simulation:
  - `.page { width: 794px; min-height: 1123px; margin: 1rem auto; background: white; box-shadow: 0 0 5px rgba(0,0,0,0.15); }`
- Variables depict as subtle tokens while in preview (non-editable in MVP).
- Print CSS scaffold:
  - `@page { size: A4; margin: 2cm; }`
  - `.page-break { break-before: page; }`
- i18n: content is user data; labels/tooltips use keys if any.

**VariableFormModal.tsx**

- Dynamically builds a form from `extractVariables(dsl)`.
- Input types: all text in MVP (date/time later).
- On submit: `substituteVariables(dsl, values)` → HTML → client PDF download.
- i18n: `templates.generate.*`

---

## 📄 Pages — Functional Specs & Acceptance Criteria

### 1) Login Page (`/login`)

**Description:** Google Sign-In using Supabase; on success, upsert profile and redirect to `/templates`.

**AC:**

- “Continue with Google” button triggers OAuth.
- On first login, `profiles` upsert with `display_name`, `avatar_url`, default `role='GENERATOR'`.
- After login, redirect to `/templates`.
- Logout from avatar menu returns to `/login`.

**i18n:** `auth.login.title`, `auth.login.googleCta`, `auth.logout`

---

### 2) Templates Page (`/templates`)

**Description:** List user’s templates as cards.

**AC:**

- Fetch templates with RLS (only owner’s rows).
- Card shows: name, description, createdAt, updatedAt (formatted).
- Variable chips show up to 3; `+X` on overflow with tooltip listing remaining names.
- Buttons:
  - **Edit** → `/generator?templateId=:id`
  - **Generate** → opens VariableFormModal
- Empty state with CTA to “Create in Generator”.

**i18n:** `templates.list.title`, `templates.card.createdAt`, `templates.card.updatedAt`, `templates.card.edit`, `templates.card.generate`, `templates.empty.title`, `templates.empty.cta`

---

### 3) Draft Generator (`/generator`)

**Description:** Lovable-style. Prompts change the draft JSON; no manual editing in MVP.

**AC:**

- Two panes: left Chat (≈22.5%), right Viewer (≈77.5%).
- If `templateId` is provided, preload DSL JSON into viewer and chat context.
- Sending prompt calls API; API returns **full** valid JSON DSL.
- Valid JSON replaces current draft; invalid shows error toast (no state change).
- “Save Template” button opens modal: name, description. On save:
  - Extract variables → `tags` column
  - Write to `templates` with `owner_id` = current user
  - Success toast + optional redirect
- Loading existing template allows prompts like “add confidentiality clause” to transform JSON (AI returns full updated JSON).

**i18n:** `generator.title`, `generator.save.cta`, `generator.save.name`, `generator.save.description`, `generator.save.success`, `generator.save.failure`, `generator.load.success`, `generator.load.failure`, `generator.chat.*`

---

### 4) Generate Document (from Template Card or Generator)

**Description:** Client-only PDF generation; no DB persistence.

**AC:**

- Clicking **Generate** opens a modal showing inputs for every `${VAR}`.
- On submit:
  - Substitute variables into DSL
  - Render to HTML (hidden container or use viewer snapshot)
  - Use html2pdf.js to download a PDF
  - Filename: `<templateName>_<YYYYMMDD_HHmmss>.pdf`
- Errors are handled with toasts.

**i18n:** `templates.generate.modal.title`, `templates.generate.submit`, `templates.generate.cancel`, `templates.generate.success`, `templates.generate.failure`

---

## 🧪 Validation & Error Handling

- Zod validates DSL for AI outputs and before saving templates.
- Clear i18n’d toasts for:
  - Network failures
  - Invalid JSON
  - Unauthorized (403 via RLS)
  - Generic unknown error bucket

---

## 🎨 Design Guidelines

- Neutral grayscale palette with adequate contrast.
- Plenty of whitespace; soft shadows for cards and page preview.
- Typography: Inter or system stack; comfortable line height.
- Focus indicators and keyboard navigation work across critical inputs.

---

## 🔒 Security

- RLS **enabled** on all tables; verify the authenticated user accesses only their rows.
- AI provider keys strictly server-side (API route / Edge Function).
- No PII leaves the browser when generating PDFs in MVP (client-side generation).

---

## 📦 Seed (Optional)

Insert one example template (via MCP or UI):

```json
{
  "type": "document",
  "children": [
    { "type": "text", "content": "Employment Contract for ${EMPLOYEE_NAME}" },
    { "type": "text", "content": "Start Date: ${START_DATE}" }
  ]
}
```

---

## 🚀 Implementation Order (Suggested)

1. Project bootstrap: Next.js, Tailwind, i18n, Supabase client
2. Auth: Google login, profile upsert
3. Topbar (nav + avatar + logout)
4. Templates page (list + variable tags + actions)
5. Generator page (chat → AI → JSON, save template, preload by ID)
6. Viewer (JSON → HTML, A4 simulation, print CSS scaffold)
7. Generate Document (variable modal → client PDF)
8. Toaster + error handling polish
9. RLS sanity checks and general QA

---

## 📋 Detailed Task List (AI-Ready)

### G-01 — Bootstrap Project

- Next.js (App Router), TS, Tailwind, ESLint/Prettier
- Minimal layout + neutral theme

**AC:** Dev server runs, Tailwind ready, base font & `<html lang>` set.

---

### G-02 — i18n Wiring

- Integrate `next-intl` (or `next-i18next`)
- Set up `/messages/{en,pt}.json`
- Create helpers for server/client translations
- Replace all UI strings with keys

**AC:** Sample component renders from `common.appName`. Missing keys warn in dev.

---

### G-03 — Supabase Client & Env

- Configure public anon client for client-side
- Configure server-side client for secure calls
- Env vars documented

**AC:** Health check route to read a public table without errors.

---

### A-01 — Google Auth

- `/login` with “Continue with Google”
- `/auth/callback` handling (if needed)
- Redirect to `/templates` on success
- Logout action

**AC:** OAuth flow works; session persists.

---

### A-02 — Profiles Upsert

- After login, upsert `profiles` with display_name, avatar_url, role
- Show avatar/name in topbar

**AC:** Profile row exists; topbar displays data.

---

### N-01 — Topbar

- App name (i18n)
- Links: `/generator`, `/templates`
- Avatar dropdown: Profile (placeholder), Logout

**AC:** Active route highlighted; logout returns to `/login`.

---

### T-01 — Templates Table (MCP)

- Create table & RLS policies as defined
- Create indexes

**AC:** Policies enforced; owner-only access.

---

### T-02 — Templates List Page

- Fetch and display cards
- Variable tags (max 3 + `+X` tooltip)
- Buttons: **Edit**, **Generate**

**AC:** Correct data render; tooltips show overflow variable names.

---

### T-03 — Variable Extraction Util

- Implement recursive extraction (`${VAR}`)
- Export util; unit tests

**AC:** Handles duplicates, none, and edge cases.

---

### GNR-01 — Generator Layout

- Split page: Chat left (22.5%), Viewer right (77.5%)
- If `templateId` present, preload DSL

**AC:** Layout matches spec; preloading works.

---

### GNR-02 — AI Chat → JSON

- `/api/ai/generate-template` route
- Prompt with optional `existingJson`
- Validate Zod; update viewer or show error

**AC:** Valid JSON updates viewer; invalid shows toast.

---

### GNR-03 — Save Template

- Modal for name + description
- Extract variables to `tags`
- Insert into DB; toast + update list or redirect

**AC:** New template visible on `/templates`.

---

### GNR-04 — Modify Existing via Prompt

- If loaded template, prompts apply changes
- Use full JSON replacement (MVP), merge later if needed

**AC:** User can iteratively refine draft via prompts.

---

### V-01 — DSL → HTML Viewer

- Render `document` + `text`
- Variables as styled tokens
- A4 simulation `.page` + soft shadow

**AC:** Readable rendering; tokens are visually distinct.

---

### V-02 — Print CSS Scaffold

- `@page { size: A4; margin: 2cm; }`
- `.page-break` support (future types)

**AC:** Print preview shows expected margins.

---

### D-01 — Generate Document (Client-only PDF)

- Modal with dynamic inputs for variables
- Substitute values → HTML snapshot
- html2pdf.js to download the PDF
- No DB persistence

**AC:** File downloads with timestamped filename.

---

### U-01 — Minimalist Theme

- Neutral palette, accessible contrast, spacing scale
- Card/viewer shadows; consistent typographic scale

**AC:** Pass basic a11y contrast checks.

---

### U-02 — Toasts & Errors

- Add toast system
- Surface success/error for: login, save, AI call, generate

**AC:** Clear feedback for all critical actions.

---

### S-01 — RLS Sanity

- Attempt cross-user access returns 403 (manual test)
- Normal owner operations unaffected

**AC:** RLS blocks cross-tenant reads/writes.

---

### S-02 — Secrets Handling

- AI keys only server-side (route/edge function)
- Confirm no secrets in client bundle

**AC:** Build artifacts clean of secrets.

---

## 🧭 MCP Guidance (for Claude Code)

1. **Create tables/policies** exactly as in the SQL above (profiles, templates).
2. **Enable RLS** on both tables; verify with a quick select under different users.
3. **Seed** one example template (optional) using the provided DSL.
4. **Indexes**: ensure `owner_id` B-tree and `json` GIN exist.
5. Ensure the app reads/writes only the current user’s rows (owner-only).

---

## 🧱 Viewer CSS Snippet (A4 Simulation + Print)

```css
.page {
  width: 794px; /* A4 @ 96dpi ≈ 210mm */
  min-height: 1123px; /* A4 @ 96dpi ≈ 297mm */
  margin: 1rem auto;
  background: #fff;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.15);
  padding: 2rem;
}

@page {
  size: A4;
  margin: 2cm;
}

@media print {
  body {
    background: transparent;
  }
  .page {
    box-shadow: none;
    margin: 0 auto;
  }
}
```

---

## ✅ Definition of Done (MVP)

- Google login works; profile stored and topbar shows avatar/name.
- Templates page lists user’s templates with variable tags and actions.
- Generator page lets user build/modify templates **via prompts only**.
- Viewer renders DSL to HTML with A4 styling.
- Generate Document opens a variable form and downloads a PDF client-side.
- All UI strings use i18n keys.
- RLS and secret handling confirmed.
