description: Create a comprehensive, step-by-step plan with gated execution; pause after each step until I type "1" to CONTINUE.
argument-hint: [task-summary]

# Operations

Read-only ops during planning + safe edits when approved

# Context snapshot (for better planning)

- Current branch: !`git branch --show-current`
- Status: !`git status --porcelain=v1`
- Recent commits: !`git log --oneline -10`
- Diff vs HEAD (staged+unstaged): !`git diff HEAD`

# Task

You are in **Plan Mode**. Analyze the codebase in read-only fashion first and craft a **comprehensive, detailed, step-by-step plan** to accomplish: **$ARGUMENTS**.

## Plan requirements

Produce a numbered list of steps. For EACH step include:

- **Goal** (1 line)
- **Files to touch** (paths or glob; explain why)
- **Edits** (high-level diff summary)
- **Commands** (lint, typecheck, tests, app run)
- **Verification** (what I should manually test)
- **Risk & rollback** (what could go wrong + quick revert path)

Keep the plan precise and implementation-ready, but do **not** edit files yet.

After you print the plan, ask:
**“Type 1 to CONTINUE to execute Step 1, 2 to EDIT to revise the plan, or 3 to CANCEL.”**

## Execution rules (strict)

- When I type 1 to **CONTINUE**, execute **only the current step**.
- Request permissions as needed, then make the minimal edits to complete that step.
- Run any listed commands for this step (lint/test/etc.) and summarize results.
- When finished with the step, output EXACTLY this stop banner:
- Only consider step finished after running turbo build command and making sure the app has no building issues

────────────────────────────────────────────────────────────────
STOP — Step $N completed.
Manual test checklist:

- <bullet list from the step’s Verification>

Reply:

- **1 to CONTINUE** to proceed to Step $(N+1)
- **2 to RE-RUN** to retry this step
- **3 to EDIT** to adjust the plan
  ────────────────────────────────────────────────────────────────

- Do **not** advance to the next step unless I explicitly type 1 to **CONTINUE**.
- If something fails, print a short diagnosis and ask whether to 2 to **RE-RUN** or 3 to **EDIT**.
