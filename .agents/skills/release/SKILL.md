---
name: release
description: End-to-end release workflow for repositories using Conventional Commits. Use when preparing a new version, tagging a release, generating changelog/release notes, bumping version, or when the user asks "release", "new version", "bump version", "publish release", "chuẩn bị release", or "tạo tag release".
---

# Release Workflow

Create a safe, repeatable release from current branch state: analyze changes, propose version bump, update changelog, create release commit and tag, then optionally push and publish.

## Defaults and safety rules

- Prefer `--dry-run` behavior first: show planned actions before writing files
- Never push or publish without explicit user confirmation
- Never rewrite old changelog entries; only prepend new content
- Do not include merge commits or bot/dependabot noise in changelog bullets
- Treat `BREAKING CHANGE` or `type!` as highest-priority signal
- Never use `--no-verify`; fix hook failures before retry
- Never amend or force-push as part of normal release flow
- Keep release commit style Conventional Commits

## Pre-release quality gates

Before creating release commit/tag, require fresh verification evidence:

- Run tests for changed behavior (or canonical project verify command)
- Run lint/typecheck/build when scripts exist
- Confirm verification was run after the latest edits
- If any gate cannot run, report residual risk explicitly and ask user whether to proceed

Do not claim release-ready status without fresh command output.

## Step 1 - Detect project release config

Run:

```bash
# Optional override
test -f .releaserc.yml && echo "found .releaserc.yml"

# Version file autodetect (priority order)
test -f package.json && echo package.json
test -f pyproject.toml && echo pyproject.toml
test -f Cargo.toml && echo Cargo.toml
test -f marketplace.json && echo marketplace.json
test -f .claude-plugin/marketplace.json && echo .claude-plugin/marketplace.json
test -f VERSION && echo VERSION
test -f version.txt && echo version.txt

# Changelog file autodetect
ls CHANGELOG*.md HISTORY*.md CHANGES*.md 2>/dev/null
```

If no changelog exists, default to `CHANGELOG.md`.

## Step 2 - Determine release range

Run:

```bash
LAST_TAG=$(git tag --sort=-v:refname | head -1)
if [ -n "$LAST_TAG" ]; then
  git log "${LAST_TAG}"..HEAD --oneline --no-merges
else
  git log --oneline --no-merges | head -100
fi
```

If user gave explicit range (tag/date/window), use that instead of auto range.

## Step 3 - Classify commits and detect breaking changes

Include in user-facing release output:

- `feat`, `fix`, `perf`, `revert`
- user-facing `docs`
- any commit with `BREAKING CHANGE` or `!`

Exclude or collapse:

- Exclude: merges, bot commits, `test`, `style`
- Collapse into Notes: routine `chore`, `ci`, `build`, internal `docs`, `refactor`

Breaking-change triggers:

- subject contains `!` after type/scope (`feat!`, `refactor(api)!`)
- body/footer contains `BREAKING CHANGE:`

## Step 4 - Recommend version bump

Priority order:

1. User flag `--major|--minor|--patch`
2. Breaking changes -> major
3. Any `feat` -> minor
4. Otherwise -> patch

Show current -> proposed version and why.

SemVer reminder:

- major: incompatible API/behavior changes
- minor: backward-compatible features
- patch: backward-compatible fixes only

## Step 5 - Draft changelog entry (Keep a Changelog style)

Write user-readable entries, not raw commit subjects.
Translate, do not transcribe: rewrite each bullet so a non-developer can
understand the change and its impact.

Section order (omit empty):

1. Breaking Changes
2. Added
3. Changed
4. Deprecated
5. Removed
6. Fixed
7. Security
8. Notes

Rules:

- Max ~80 chars per bullet when possible
- Prefer `**scope**: user impact`
- No vague bullets like "misc fixes"
- Imperative voice, no trailing period
- If breaking exists, include migration guidance with before/after snippet

Entry template:

```markdown
## [x.y.z] - YYYY-MM-DD

### Added
- **cli**: add `--dry-run` support for safer previews

### Fixed
- **wizard**: prevent duplicate init crash on reopen
```

Rewrite examples:

- `fix(cli): resolve symlink in isMain check`
  -> `**cli**: npx wrapper now works when installed via symlink`
- `feat(registry): wire react bundle with vercel skill`
  -> `**registry**: React bundles auto-wire Vercel best-practices skill`

## Step 6 - Update files

### CHANGELOG.md

- If missing, create:

```markdown
# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---
```

- Insert new entry directly below header block, above previous entries
- Keep old entries unchanged
- Show entry preview to user before writing if they requested review/edit pass

### Optional RELEASE_NOTES.md

Generate only if user asks for release notes (GitHub/email/store):

- Use plain language and narrative tone
- Suggested headings: `✨ What's New`, `🐛 Fixes`, `🔒 Security`
- Add upgrade instructions for breaking changes
- Link back to `CHANGELOG.md`

## Step 7 - Show preview and request confirmation

Before committing, present:

- detected version file and current version
- release range (`LAST_TAG..HEAD` or explicit range)
- proposed version bump with rationale
- changelog preview
- files to be changed
- whether push/publish will be performed
- verification summary (tests/lint/typecheck/build and outcomes)

Ask two confirmations:

1. Version to release (recommended + alternatives)
2. Push/publish action:
   - local only
   - push git refs
   - push + create remote release

For protected branches (for example `main`/`master`):

- Prefer release on a dedicated branch and open PR
- If releasing directly on protected branch, ask explicit confirmation

## Step 7.5 - Add comparison links

At the end of `CHANGELOG.md`, append Keep a Changelog reference links:

```markdown
[1.4.0]: https://github.com/owner/repo/compare/v1.3.0...v1.4.0
```

Resolve repo URL with:

```bash
git remote get-url origin
```

If there is no previous tag, use commits page link:

```markdown
[1.4.0]: https://github.com/owner/repo/commits/v1.4.0
```

## Step 8 - Commit and tag (after approval)

Stage only release artifacts:

```bash
git add <version-file> CHANGELOG*.md RELEASE_NOTES.md
git commit -m "chore: release v{VERSION}"
git tag -a "v{VERSION}" -m "release v{VERSION}"
```

Commit message rules:

- Use Conventional Commits format
- Subject in imperative mood, no trailing period, <=72 chars when possible
- Include body when needed to explain why/impact

If user approved push:

```bash
git push
git push origin "v{VERSION}"
```

## Step 9 - Create remote release (optional)

If user asks for GitHub release creation and `gh` is available:

```bash
gh release create "v{VERSION}" --notes-file RELEASE_NOTES.md --title "v{VERSION}"
```

Fallback if no `RELEASE_NOTES.md`: use generated temp notes file.

## Step 10 - Final report

Return:

- released version and tag
- commit hash of release commit
- pushed or local-only status
- changed files
- short upgrade notes (if breaking)

## Multi-language changelog (optional)

If project has multiple changelog files (`CHANGELOG.zh.md`, `CHANGELOG.ja.md`, etc.):

- keep same version/date across languages
- localize section titles and text naturally
- keep contributor attribution format `(by @username)` unchanged

## Dry-run mode

When user requests dry run:

- perform full analysis and previews
- do not edit files
- do not commit/tag/push/publish
- print exact commands that would run

## Command examples

```text
/release
/release --dry-run
/release --minor
/release --major
```

## Output quality checklist

- Release notes are understandable by end users
- Changelog bullets describe impact, not implementation detail
- Version bump rationale is explicit
- Breaking changes include migration guidance
- No push/publish performed without explicit confirmation
