#!/usr/bin/env bash
set -e

STAGED=$(git diff --cached --name-only --diff-filter=ACMR)
[ -z "$STAGED" ] && exit 0

if ! echo "$STAGED" | grep -qE '^packages/harness-kit/src/registry/bundles/.+/(README\.md|manifest\.ts)$'; then
  exit 0
fi

echo "→ syncing harness-web bundle docs"
(
  cd apps/harness-web
  node scripts/sync-bundle-docs.mjs
)

git add apps/harness-web/content/bundles/index.json
git add apps/harness-web/content/bundles/**/*.mdx
