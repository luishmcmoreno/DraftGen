#!/usr/bin/env bash
set -euo pipefail

mkdir -p .gemini/plans/history

TS=$(date -u +"%Y-%m-%dT%H-%M-%SZ")

if [ -f .gemini/plans/CURRENT_PLAN.md ]; then
  mv .gemini/plans/CURRENT_PLAN.md ".gemini/plans/history/PLAN_${TS}.md"
  echo "Archived CURRENT_PLAN.md -> .gemini/plans/history/PLAN_${TS}.md"
else
  echo "No CURRENT_PLAN.md found to archive."
fi
