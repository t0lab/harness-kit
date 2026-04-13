# CLI Commands (list, add, status) — Design

> **For agentic workers:** Implement this spec using `superpowers:writing-plans` to create an implementation plan first.

**Goal:** Add 3 commands to the `harness-kit` CLI: `list` (browse registry), `add` (install a bundle into a project), `status` (audit harness health). Also extract `init` command into its own file for consistency.

**Date:** 2026-04-13

---

## Architecture

### Approach

Thin command handlers + engine modules. Reusable logic lives in engine; command files are orchestrators only.

### New Files

**Engine modules:**

| File | Responsibility |
|------|---------------|
| `packages/harness-kit/src/engine/harness-reader.ts` | `readHarnessConfig(cwd)`, `writeHarnessConfig(cwd, config)`, `harnessExists(cwd)` — typed read/write of `harness.json` |
| `packages/harness-kit/src/engine/artifact-installer.ts` | `installBundle(cwd, bundle, role)` — installs mcp artifacts into `.mcp.json`; warns for other artifact types |

**Command handlers:**

| File | Command |
|------|---------|
| `packages/harness-kit/src/commands/init.ts` | Thin wrapper: calls `runWizard()` — extracted from `index.ts` |
| `packages/harness-kit/src/commands/list.ts` | `harness-kit list [--category <cat>] [--installed]` |
| `packages/harness-kit/src/commands/add.ts` | `harness-kit add <bundle> [--role <role>]` |
| `packages/harness-kit/src/commands/status.ts` | `harness-kit status` |

**Modified files:**

- `packages/harness-kit/src/index.ts` — registers all commands; no inline logic
- `packages/core/src/types.ts` — add `bundles?: string[]` and ensure `mcp?: string[]` exists in `HarnessConfig`
- `packages/harness-kit/templates/harness.json.hbs` — add `"bundles": []` to initial output
- `packages/harness-kit/src/wizard/steps/preview-apply.ts` — write `bundles: []` in templateCtx

### harness.json Tracking

`init` writes `bundles: []`. `add` appends bundle name to `bundles[]`.

For MCP bundles specifically, `add` also appends to `mcp[]` (backwards compat — CLAUDE.md template references it).

**Legacy harness.json compatibility:** Projects initialized before `bundles[]` was added will have `undefined` for `bundles`. `harness-reader.ts` normalizes this on read: missing `bundles` field defaults to `[]`. `list --installed` and `status` treat `bundles: undefined` the same as `bundles: []` (empty — user must re-add bundles or re-run init).

---

## `list` Command

### Usage

```
harness-kit list                        # all available bundles, grouped by category
harness-kit list --category <cat>       # filter by one category
harness-kit list --installed            # bundles in harness.json only
```

### Output Format

```
browser (3)
  playwright        Browser automation via MCP
  browser-use       AI-native browser control
  agent-browser     Agent-driven browser [experimental]

search (3)
  tavily     ✓    Agentic search, structured results
  exa             Neural search, semantic queries
  perplexity      Conversational search
```

`✓` = installed in current project (shown when harness.json exists, regardless of flag).

### Behavior

- **Grouping rule:** each bundle appears exactly once, grouped by its `defaultRole` field. Bundles that support multiple roles are not duplicated.
- Groups sorted alphabetically; bundles within each group sorted alphabetically
- `--category <cat>`: validate against known `BundleCategory` values; error if unknown
- `--installed`: requires harness.json (error if not initialized); shows only `bundles[]` entries; if `bundles` is missing (legacy), shows empty list with note "No bundles tracked — re-run init or use add."
- Experimental bundles tagged `[experimental]`
- No side effects — read-only

---

## `add` Command

### Usage

```
harness-kit add <bundle>
harness-kit add <bundle> --role <role>   # override default role
```

### Flow

```
1. harness.json exists?         → No  → error: "Run harness-kit init first"
2. bundle in registry?          → No  → error: "Unknown bundle. Run harness-kit list to see available."
2b. --role provided?            → validate role is a key in bundle.roles
                                  → invalid → error: "<bundle> does not support role <role>. Valid roles: <list>"
3. already in bundles[]?        → Yes → confirm: "<bundle> already added. Re-install? (y/N)"
4. install artifacts:
     mcp    → update .mcp.json (create if missing, merge by bundle name — idempotent)
     tool   → print: "Run: <installCmd>"
     skill/rule/hook/git-hook/file → warn: "artifact type not yet supported — add manually"
5. update harness.json:
     bundles[] ← append bundle name (all bundle types)
     mcp[]     ← append name (mcp bundles only, for template compat)
6. print env vars to set (if any)
```

### Output Example

```
✓  Added tavily (search)
   .mcp.json updated

   Env vars needed:
     TAVILY_API_KEY  — API key from app.tavily.com  [required]

   Set in your shell or .env before running Claude.
```

### `.mcp.json` Update Strategy

- File absent → create with single entry
- File present → read JSON, merge by bundle name as key in `mcpServers` object (idempotent — re-adding the same bundle replaces the existing entry under the same key)
- Written directly via `JSON.stringify` — no Handlebars template

Example `.mcp.json` structure:
```json
{
  "mcpServers": {
    "tavily": { "command": "npx", "args": ["-y", "tavily-mcp@0.1.4"], "env": { "TAVILY_API_KEY": "${TAVILY_API_KEY}" } }
  }
}
```

---

## `status` Command

### Usage

```
harness-kit status
```

### Output Example

```
harness-kit — /path/to/project

── Installed bundles (3) ──────────────────────────
  ✓ tavily       search           mcp
  ✓ tdd          workflow-preset
  ✗ exa          search           mcp  — missing from .mcp.json [drift]

── Config files ───────────────────────────────────
  ✓ CLAUDE.md
  ✓ AGENTS.md
  ✓ harness.json
  ✓ .mcp.json
  ✗ .claude/settings.json — missing

── Env vars ───────────────────────────────────────
  ✗ TAVILY_API_KEY  — not set  (tavily)

── Summary ────────────────────────────────────────
  1 drift  ·  1 env var unset  ·  1 file missing
```

### Audit Checks

| Check | Logic |
|-------|-------|
| Bundle drift (MCP) | bundle name in `harness.json#mcp[]` but name absent as key in `.mcp.json#mcpServers` |
| Bundle status (non-MCP) | bundle in `bundles[]` with no mcp artifacts → always `✓` (nothing to verify on disk); artifact type column shown blank |
| Config file missing | `access()` on: `CLAUDE.md`, `AGENTS.md`, `harness.json`, `.mcp.json`, `.claude/settings.json` |
| Env var unset | `process.env[key] === undefined` for each `env` entry in installed bundles |

**Drift source of truth:** Use `mcp[]` as the canonical list for MCP drift detection (not `bundles[]`), so legacy projects initialized before `bundles[]` existed still get MCP drift checking.

### Exit Codes

- `0` — all clean
- `1` — any issues found (drift / missing files / unset env vars)

CI-friendly: `harness-kit status` can gate pipelines on harness health.

### Error if Not Initialized

```
✗ harness.json not found. Run harness-kit init first.
```

---

## Testing Plan

- `harness-reader.ts`: unit tests — read valid JSON, read missing file (error), write round-trip, normalize missing `bundles` field to `[]`
- `artifact-installer.ts`: unit tests — install mcp into empty `.mcp.json`, install into existing (merge), idempotent re-install (same bundle replaces entry)
- `list.ts`: unit tests — all bundles grouped by `defaultRole`, `--category` filter (valid + invalid category), `--installed` with populated `bundles[]`, `--installed` with legacy harness.json (no `bundles` field)
- `add.ts`: integration tests — add unknown bundle (error), add valid MCP bundle (harness.json + .mcp.json updated), re-add (idempotent confirm), `--role` with invalid role (error), `--role` with valid role (uses role artifacts)
- `status.ts`: unit tests — clean project (exit 0), MCP drift detected (exit 1), missing env var (exit 1), missing config file (exit 1), legacy harness.json without `bundles[]` (graceful)
