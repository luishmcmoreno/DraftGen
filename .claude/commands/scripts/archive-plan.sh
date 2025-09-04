
#!/usr/bin/env bash
set -euo pipefail

mkdir -p .claude/plans/history

TS=$(date -u +"%Y-%m-%dT%H-%M-%SZ")

if [ -f .claude/plans/CURRENT_PLAN.md ]; then
  mv .claude/plans/CURRENT_PLAN.md ".claude/plans/history/PLAN_${TS}.md"
  echo "Archived CURRENT_PLAN.md -> .claude/plans/history/PLAN_${TS}.md"
else
  echo "No CURRENT_PLAN.md found to archive."
fi