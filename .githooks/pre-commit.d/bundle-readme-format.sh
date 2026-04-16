#!/usr/bin/env bash
set -e

STAGED=$(git diff --cached --name-only --diff-filter=ACMR)
[ -z "$STAGED" ] && exit 0

if ! echo "$STAGED" | grep -qE '^packages/harness-kit/src/registry/bundles/.+/README\.md$'; then
  exit 0
fi

echo "→ checking bundle README format"
node scripts/check-bundle-readmes-format.mjs
