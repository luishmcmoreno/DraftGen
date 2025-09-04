---
description: Create a comprehensive step-by-step plan; persist & update CURRENT_PLAN.md; pause after each step until I type "1" to CONTINUE.
argument-hint: [task-summary]
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - Write
  - Edit
---

# Context management
- Treat CURRENT_PLAN.md as the single source of truth.
- The CURRENT_PLAN.md is located at .claude/plan/CURRENT_PLAN.md
- On every run: if CURRENT_PLAN.md exists, load and parse it; otherwise create it.
- Keep chat output concise; store details (full plan, checklists, logs, notes) in CURRENT_PLAN.md.

# Context snapshot (for better planning)
- Current branch: !`git branch --show-current`
- Status: !`git status --porcelain=v1`
- Recent commits (last 10): !`git log --oneline -10`/
- Diff vs HEAD (staged+unstaged): !`git diff HEAD`

# Task
You are in Plan Mode. Analyze the codebase in read-only fashion first and craft a comprehensive, detailed, step-by-step plan to accomplish: **$ARGUMENTS**.

# Plan requirements
Produce a numbered list of steps. For each step include:
- Goal (one line)
- Files to touch (paths or globs; explain why)
- Edits (high-level diff summary)
- Commands (lint, typecheck, tests, app run)
- Verification (manual checklist I should test)
- Risk & rollback (what could go wrong + quick revert)

# Create/Update CURRENT_PLAN.md
If CURRENT_PLAN.md does not exist, create it with the following structure. If it exists, keep its header and refresh Steps/Progress as needed.

Title: "Current Plan — $ARGUMENTS"
Header fields:
- Branch: <git branch>
- Created: <ISO timestamp if creating>
- Last Updated: <ISO timestamp now>
- Status: <Planning | In Progress | Paused | Completed | Aborted>

Sections:
1) Steps
   Each step should be:
   N. [ ] <Short title>
      - Goal: ...
      - Files to touch: ...
      - Edits: ...
      - Commands: ...
      - Verification:
        - [ ] ...
        - [ ] ...
      - Risk & rollback: ...

2) Progress
   - Current Step: <number>   (start at 1)
   - Completed Steps: <comma-separated numbers or empty>
   - Notes:
     - <freeform decisions, results, failures, links, etc.>

3) Next Step Preview
   A short paragraph describing what the next step will do, why it is safe, and what it will NOT cover.

After writing CURRENT_PLAN.md (with all checkboxes unchecked and Current Step set), print:
Type **1** to CONTINUE (execute Step 1), **2** to EDIT (revise plan), or **3** to CANCEL.

# Execution rules (strict)
- When I type **1**, execute only the **current** step indicated by CURRENT_PLAN.md.
- Always reload CURRENT_PLAN.md before editing files.
- Make the minimal edits for this step; then run the step’s Commands.
- Build gate: only consider the step finished after running the project build and confirming no build errors.

Build commands (try in order; use the first that exists):
- turbo build

# After each step completes
1) Update CURRENT_PLAN.md:
   - Mark the step checkbox as [x].
   - In Verification, check the items that passed; leave the rest [ ].
   - Increment "Current Step" to the next step number.
   - Append a short result summary under Notes (key changes, command outcomes).
   - Update "Last Updated".
   - Refresh "Next Step Preview" to describe the upcoming step (what it will change, key risks, what it will not cover).

2) Print EXACTLY this banner and menu, followed by the preview:

────────────────────────────────────────────────────────────────
STOP — Step $N completed.
Manual test checklist (from Verification of Step $N):
- <bullet list of the remaining unchecked items, or “All passed.”>

Reply:
- **1** to CONTINUE to Step $(N+1)
- **2** to RE-RUN Step $N
- **3** to EDIT the plan

Next Step Preview (Step $(N+1)):
<short paragraph from CURRENT_PLAN.md>
────────────────────────────────────────────────────────────────

- Do not advance without an explicit **1**.
- On failure: show a short diagnosis and ask whether to **2** RE-RUN or **3** EDIT. Record the failure note in CURRENT_PLAN.md → Notes.

# Editing the plan (option 3)
- Show a concise diff of proposed changes to Steps/Verification.
- Apply changes to CURRENT_PLAN.md, update "Last Updated", reprint the menu and refreshed Next Step Preview.

# Cancel (option 3 at the top level)
- Set Status: Aborted in CURRENT_PLAN.md, note “Aborted at Step <N>,” and stop.