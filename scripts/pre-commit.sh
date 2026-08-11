#!/usr/bin/env sh
# Cerefy pre-commit hook — runs secret scan + dependency audit on staged files.
# Wire it up in a repo with:
#   git config core.hooksPath .githooks
# (or copy to .git/hooks/pre-commit and make it executable)
set -eu

echo "=== Cerefy pre-commit: secret scan (staged files) ==="
node scripts/scan-staged.cjs

echo "=== Cerefy pre-commit: dependency audit (high/critical) ==="
npm audit --audit-level=high --omit=dev || echo "npm audit reports findings — review before pushing."

echo "=== Cerefy pre-commit: frontend typecheck ==="
npm run typecheck

echo "Pre-commit checks passed."