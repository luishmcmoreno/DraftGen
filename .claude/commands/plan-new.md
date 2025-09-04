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

# Delegate to canonical /plan
You will now generate a comprehensive, gated plan for **$ARGUMENTS**, persisting to a fresh CURRENT_PLAN.md.

# Reuse the single source of truth (no duplication)
@.claude/commands/plan.md