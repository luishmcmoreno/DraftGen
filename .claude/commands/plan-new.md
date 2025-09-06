---
description: Archive CURRENT_PLAN.md (if present) and start a fresh plan using the existing /plan command content.
argument-hint: [new-task-summary]
allowed-tools:
  - Bash(mkdir:*)
  - Bash(mv:*)
  - Bash(echo:*)
  - Bash(date:*)
---

# Archive any existing CURRENT_PLAN.md (idempotent)
- Compute a UTC timestamp and ensure an archive folder exists.
- If CURRENT_PLAN.md exists, move it into plans/history/ with a timestamped name.
- Print a short confirmation, then proceed to create a brand-new plan.

# Run archive helper
Archival commands:
`bash .claude/commands/scripts/archive-plan.sh`

# Before starting
- Verify if there are any uncommitted changes. If found, confirm whether they should be discarded or kept.
- Create a new branch from the latest `main` (unless a different base branch is explicitly requested).
- Use the following naming pattern for the branch name:
  - `chore/update-dependencies`
  - `fix/button-alignment`
  - `feature/user-authentication`
- Use the following naming pattern for the commit message:
  - `chore(all): Update dependencies`
  - `feature(draft-gen): Add authentication flow`
  - `fix(convertext): Correct parsing error`

# Delegate to canonical /plan
You will now generate a comprehensive, gated plan for **$ARGUMENTS**, persisting to a fresh CURRENT_PLAN.md.

# Reuse the single source of truth (no duplication)
@.claude/commands/plan.md