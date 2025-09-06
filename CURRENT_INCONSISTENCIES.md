# Current Inconsistencies

This file documents the inconsistencies found between the `CLAUDE.md` files and the actual project state. All inconsistencies have been resolved.

## `apps/draft-gen/CLAUDE.md`

- **Resolved:** The `npm run start` command description is not precise about the port.

## `apps/convertext/CLAUDE.md`

- **Resolved:** The `start` script is missing from the development commands.
- **Resolved:** The entire backend section is incorrect. The project does not have a FastAPI backend.
- **Resolved:** The `package.json` shows `next: "15.4.6"` and `react: "19.0.0"`, but the `CLAUDE.md` file was not updated with this information.

## `CLAUDE.md` (root)

- **Resolved:** It mentions an `apps/admin/` application that does not exist.
- **Resolved:** It mentions that `convertext` uses Next.js 14 and React 18, but it uses Next.js 15 and React 19.
