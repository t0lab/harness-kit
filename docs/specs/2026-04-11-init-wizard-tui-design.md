# harness-kit init Wizard TUI — Design Spec

**Date:** 2026-04-11
**Status:** Approved
**Author:** Liam Lee

---

## Problem Statement

`harness-kit init` cần một wizard TUI cho phép user khai báo tech stack, chọn harness config, và scaffold môi trường agent trong vài phút. Spec hiện tại (`2026-04-10-harness-kit-design.md`) có skeleton wizard nhưng chưa đủ chi tiết để implement.

> **Note:** Zone-based multi-column layout từ spec 2026-04-10 được thay thế bởi flat searchable multi-select trong spec này. Database được giữ lại nhưng là category trong searchable list, không phải zone selection bắt buộc.

---

## Goals

- Wizard flow đầy đủ, từ project info → tech stack → detection → harness config → preview → apply
- Tech stack selection: searchable multi-select, không zone-gating (Next.js vừa FE vừa BE)
- Project description đủ phong phú để làm context cho AI generation và agent coding
- Harness config bao phủ git workflow, memory, workflow presets, browser tools, web content tools, MCP
- AI generation CLAUDE.md khi detect API key từ `.env`, fallback Handlebars khi không có
- BACK navigation: user có thể quay lại từ preview về harness config

---

## Non-Goals

- Multi-IDE support (v1 target Claude Code only)
- `harness-kit sync`, `harness-kit audit` (v2+)
- Local/custom module registry (v2+)
- Web docs site (v2+)
- Conflict resolution "diff" mode (v2+)

---

## Architecture

### Dependencies to add

Before implementing, add to `packages/harness-kit/package.json`:

```json
{
  "dependencies": {
    "xstate": "^5.18.0",
    "@clack/core": "^0.3.4"
  }
}
```

`@clack/prompts` (already present) is built on `@clack/core` — they are separate packages. `@clack/core` v0.3.x exposes a stable `Prompt` class for subclassing; verify against this pinned minor version.

### State Machine (xstate v5)

```
[start]  ← CLI calls runWizard(), creates xstate actor, starts it
   │ ENTER
   ▼
[projectInfo]        → name, description fields
   │ NEXT
   ▼
[techStackSelect]    → SearchableMultiselect
   │ NEXT
   ├─ guard: noTechSelected → [harnessConfig]
   │
   ▼
[detectTooling]      → scan filesystem + offer install
   │ NEXT / SKIP_DETECT
   ▼
[harnessConfig]      → git, memory, docs, presets, browser, MCP
   │ NEXT
   ▼
[preview]            → file list + token estimate
   │ CONFIRM         │ BACK
   ▼                 └──► [harnessConfig]
[apply]
   │ DONE / ERROR
   ▼
[done]
```

**Error handling:** `detectTooling` and `apply` states handle errors via `onError` transition → surface error message via `@clack/prompts` `outro()` + `process.exit(1)`. No retry loop in v1.

### WizardContext and Events

```ts
// src/wizard/types.ts

interface WizardContext {
  projectName: string
  projectPurpose: string        // what it does
  projectUsers: string          // who uses it (optional, may be empty)
  projectConstraints: string    // tech constraints/goals (optional)
  selectedTech: string[]        // e.g. ['nextjs', 'docker', 'langchain']
  detectedIssues: DetectedIssue[]
  installSelected: boolean
  gitWorkflow: string[]
  memory: 'file-based' | 'mem0' | 'obsidian' | 'none'
  docsAsCode: boolean
  workflowPresets: string[]
  browserTools: string[]
  webSearch: string[]
  webCrawl: string[]
  libraryDocs: string[]
  docConversion: string[]
  otherMcp: string[]
  aiGenerationEnabled: boolean  // set during apply, based on .env detection
}

type WizardEvent =
  | { type: 'ENTER' }
  | { type: 'NEXT'; data: Partial<WizardContext> }
  | { type: 'BACK' }
  | { type: 'CONFIRM' }
  | { type: 'SKIP_DETECT' }
  | { type: 'DONE' }
  | { type: 'ERROR'; error: Error }

// Guard
function noTechSelected(ctx: WizardContext): boolean {
  return ctx.selectedTech.length === 0
}
```

### Tech Stack

| Component | Library | Notes |
|-----------|---------|-------|
| State machine | `xstate` v5 | BACK navigation, guard conditions |
| Searchable multi-select | `@clack/core` v0.3.x | Custom `Prompt` subclass |
| All other prompts | `@clack/prompts` | text, select, multiselect, confirm |
| Progress / apply | `listr2` | Multi-task runner with spinners |
| AI generation | `@anthropic-ai/sdk` | Detect from `.env`, graceful skip |
| Static templates | `handlebars` | Fallback when no API key |

---

## Step 1 — Project Info

Project description is the primary context for both AI generation (CLAUDE.md) and the coding agent throughout all future sessions. A vague description produces a vague CLAUDE.md. The wizard guides user to fill in three aspects:

```
┌─ harness-kit init ────────────────────────────────────────────┐

  ? Project name: my-app

  ? What does this project do?
    Hint: Core purpose in 1-3 sentences — what problem it solves,
    what it produces. The agent will reference this in every session.
  › An e-commerce platform for independent fashion brands.
    Handles product listings, checkout, and order management.

  ? Who are the users / stakeholders? (optional)
    Hint: End users, customers, internal teams, external APIs.
  › Independent fashion brand owners and their customers.

  ? Key technical goals or constraints? (optional)
    Hint: Performance targets, compliance, architecture decisions,
    things the agent must never do or always prioritize.
  › Must be mobile-first. PCI-DSS compliant checkout.
    No vendor lock-in on payment provider.

└───────────────────────────────────────────────────────────────┘
```

All four prompts use `@clack/prompts` `text()`. The three description fields are concatenated into a structured project context block injected into the AI generation prompt and written as the opening section of CLAUDE.md.

**Context block format (written to CLAUDE.md header):**
```markdown
## Project

**Purpose:** An e-commerce platform for independent fashion brands.
Handles product listings, checkout, and order management.

**Users:** Independent fashion brand owners and their customers.

**Constraints:** Must be mobile-first. PCI-DSS compliant checkout.
No vendor lock-in on payment provider.
```

---

## Step 2 — Tech Stack Selection

### UX

```
? Select your tech stack (type to search):

  Search: ▌

  ── Web Frameworks ────────────────────────────────────────────
  ◉  Next.js                fullstack React framework
  ◯  Nuxt                   fullstack Vue framework
  ◯  SvelteKit              fullstack Svelte framework
  ◯  React                  frontend only
  ◯  Vue                    frontend only
  ◯  Angular                frontend only
  ◯  Vanilla TypeScript     no framework
  ── Backend ───────────────────────────────────────────────────
  ◯  Node.js + Express
  ◯  Node.js + Fastify
  ◯  Python + FastAPI
  ◯  Python + Django
  ◯  Go
  ◯  Rust
  ◯  Java + Spring
  ── Platform ──────────────────────────────────────────────────
  ◯  Docker
  ◯  GitHub Actions
  ◯  Terraform
  ◯  Kubernetes
  ◯  AWS CDK
  ── Database ──────────────────────────────────────────────────
  ◯  PostgreSQL
  ◯  MySQL
  ◯  MongoDB
  ◯  SQLite
  ◯  Redis
  ◯  DynamoDB
  ◯  Supabase               PostgreSQL + auth + storage
  ── AI ────────────────────────────────────────────────────────
  ◯  LangChain              Python / JavaScript
  ◯  LangGraph              graph-based agent workflows
  ◯  Anthropic SDK          direct API
  ◯  OpenAI SDK             direct API
  ◯  Vercel AI SDK          edge-optimized
  ◯  CrewAI                 multi-agent framework
  ◯  LlamaIndex             RAG / data pipelines
  ─────────────────────────────────────────────────────────────
  3 selected   [↑↓] navigate   [Space] toggle   [Enter] confirm
```

### Implementation

Custom `SearchableMultiselect` class extending `@clack/core` `Prompt`:

- Maintains `query: string` state — updated on each keystroke
- Filters item list in realtime: match against name + description + tags
- Renders filtered list with ANSI color, category separators
- Tracks `selected: Set<string>` for multi-select state
- `Space` → toggle, `Enter` → resolve, `Backspace` → edit query

File: `src/wizard/steps/tech-stack-select.ts`

### Zone labels

Zones (Web Frameworks / Backend / Platform / AI) are **visual separators only** — not a required selection step. Next.js appears under "Web Frameworks" and covers both frontend + backend; user does not need to select an additional backend entry.

---

## Step 3 — Smart Detection

Runs after tech stack selection. Skipped if `selectedTech.length === 0` (xstate guard `noTechSelected`).

Scans filesystem based on selected tech:

| Tech | Detect |
|------|--------|
| React / Next.js / Vue / Svelte | `tsconfig.json`, ESLint config, Prettier config |
| Python | `pyproject.toml`, `ruff.toml`, `mypy.ini` |
| Go | `go.mod`, `.golangci.yml` |
| Docker | `Dockerfile`, `.dockerignore` |
| GitHub Actions | `.github/workflows/` |
| PostgreSQL / MySQL / SQLite | Prisma schema, Drizzle config, migration folders |
| MongoDB | Mongoose in `package.json`, `requirements.txt` |
| Redis | `ioredis` / `redis` in dependencies |
| Supabase | `@supabase/supabase-js` in `package.json` |
| LangChain / LangGraph | entry in `package.json` or `requirements.txt` |

Output:
```
  Scanning your project...
  ✓ package.json found
  ✓ tsconfig.json found
  ✗ ESLint not configured
  ✗ Prettier not configured

  Recommendations:
  ◉ Install ESLint + @typescript-eslint?
  ◉ Install Prettier?

? Install selected? (Y/n)
```

Runs installs via `execa` using detected package manager (`pnpm` / `npm` / `yarn` / `pip`). On `execa` failure: log error with `@clack/prompts` `log.warn()`, continue wizard (non-fatal).

File: `src/wizard/steps/detect-tooling.ts`

---

## Step 4 — Harness Config

All prompts via `@clack/prompts`.

### Git Workflow

```
? Git workflow: (multi-select)
  ◉ Conventional Commits      commit message format, semantic versioning
  ◉ Branch strategy           feature/fix/chore/* naming, PR < 400 lines rule
  ◉ Pre-commit hooks          lint + typecheck + test before commit
  ◯ Commit signing            GPG / SSH signing
  ◯ Skip
```

### Long-term Memory

```
? Long-term memory:
  ◉ File-based    .claude/memory/ — local, zero dependency
  ◯ Mem0 MCP      cloud, cross-session, 90% token reduction (needs API key)
  ◯ Obsidian MCP  sync with Obsidian vault (needs Obsidian + plugin)
  ◯ None
```

### Docs as Code

```
? Docs as code? (AGENTS.md, spec template, ADR structure, llms.txt)
  ◉ Yes  ◯ No
```

When Yes: scaffolds `docs/DESIGN.md`, `docs/design-docs/decisions/` (ADR structure), `llms.txt`.

### Workflow Presets

```
? Workflow presets: (multi-select)
  ◉ Spec-driven         brainstorm → spec → plan → implement
  ◉ TDD                 failing test before implementation
  ◉ Planning-first      draft plan → staff review → implement
  ◉ Quality gates       tests pass before done (Stop hook)
  ◯ Parallel agents     subagents for independent tasks
  ◯ Systematic debugging reproduce → isolate → verify → fix
  ◯ Code review gates   review before commit/merge
  ◯ Security review     validate bash, block dangerous ops
  ◯ Context discipline  fresh session rules, task decomp guide
```

Defaults: Spec-driven, TDD, Planning-first, Quality gates pre-ticked.

### Browser Automation

```
? Browser automation: (multi-select)
  ◉ Playwright MCP      Microsoft, accessibility snapshots, E2E test gen
  ◯ agent-browser       Vercel Labs, Chrome DevTools Protocol, sessions
  ◯ Stagehand           AI-native, natural language commands, Browserbase
  ◯ browser-use         Python, open-source, vision-enabled
  ◯ None
```

### Web Search

```
? Web search: (multi-select)
  ◉ Tavily MCP          real-time search + extract in one call, free tier
  ◯ Exa MCP             semantic search, code/GitHub/docs optimized
  ◯ Brave Search MCP    privacy-focused
  ◯ None
```

### Web Crawl & Scrape

```
? Web crawl & scrape: (multi-select)
  ◉ Firecrawl MCP       HTML→markdown, JS-enabled, managed service
  ◯ Crawl4AI MCP        open-source, self-hosted Docker, 62k ⭐
  ◯ Spider.cloud MCP    Rust-based, anti-bot, full-site crawl
  ◯ Apify MCP           1000+ pre-built actors (Amazon, LinkedIn...)
  ◯ Bright Data MCP     residential proxies, bypass anti-bot
  ◯ None
```

### Library Docs & Document Tools

```
? Library docs:
  ◉ Context7 MCP        version-specific docs for any package
  ◯ None

? Document conversion:
  ◯ MarkItDown          PDF/Word/HTML/audio → markdown (Python, local)
  ◯ None
```

### Other MCP Integrations

```
? Other MCP integrations: (multi-select)
  ◉ GitHub MCP
  ◯ Supabase MCP
  ◯ Vercel MCP
  ◯ None
```

---

## Step 5 — Preview & Apply

```
  Will scaffold the following:

  ── Core ────────────────────────────────────────────────────
  ✦ CLAUDE.md                (AI-generated via claude-sonnet-4-6)
  ✦ AGENTS.md                (template, ~100 lines)
  ✦ harness.json
  ✦ .env.local               (gitignored)
  ✦ llms.txt

  ── Claude config ───────────────────────────────────────────
  ✦ .claude/settings.json
  ✦ .claude/rules/typescript.md
  ✦ .claude/rules/git-conventional.md
  ✦ .claude/hooks/pre-commit.sh
  ✦ .claude/hooks/quality-gate.sh
  ✦ .claude/skills/tdd-workflow/SKILL.md
  ✦ .claude/skills/brainstorming/SKILL.md

  ── MCP config ──────────────────────────────────────────────
  ✦ .mcp.json                (Playwright + Firecrawl + Context7 + Tavily)

  ── Docs ────────────────────────────────────────────────────
  ✦ docs/DESIGN.md
  ✦ docs/design-docs/decisions/

  Estimated context load: ~14k tokens/session
  (sum of tokenEstimate fields from selected module manifests)

  ⚠ CLAUDE.md already exists → overwrite / skip

? Apply? (Y/n)
```

### Conflict resolution

Per-file when existing file detected: `overwrite` / `skip`. "diff" mode is v2.

### Apply progress (listr2)

```
✔ Generating CLAUDE.md with Claude claude-sonnet-4-6...
✔ Writing core files...
✔ Writing Claude config...
✔ Configuring MCP servers...
✔ Writing docs structure...
✔ Done in 3.2s

  harness-kit initialized.
  Run: harness-kit status  to see your harness.
```

On listr2 task error: fail fast, log which task failed, `process.exit(1)`.

---

## AI Generation

CLAUDE.md is generated by Claude when an API key is found.

**Detection order:**
1. `ANTHROPIC_API_KEY` in `.env.local`
2. `ANTHROPIC_API_KEY` in `.env`
3. `HARNESS_AI_API_KEY` in either file (multi-provider config)
4. No key found → fallback to Handlebars static template silently

Wizard never asks for API key. If key exists, generation runs automatically during apply step. The old spec's Step 0 (prompt for API key) is replaced by this silent auto-detect.

**Model:** `claude-sonnet-4-6` (configurable via `HARNESS_AI_MODEL`).

**Generation prompt:** Combines `projectPurpose` + `projectUsers` + `projectConstraints` + selected tech stack + selected presets.

---

## MCP Resolution

`harness.json` stores MCP identifiers as a flat string array. The wizard resolves these to full `.mcp.json` entries by reading `manifest.json` from each MCP module in the bundled registry:

```
packages/harness-kit/registry/
  mcp/
    playwright/
      manifest.json
    firecrawl/
      manifest.json
    context7/
      manifest.json
    tavily/
      manifest.json
    github/
      manifest.json
    ...
```

Each `manifest.json` contains the MCP server config:

```json
// registry/mcp/firecrawl/manifest.json
{
  "name": "firecrawl",
  "type": "mcp",
  "description": "HTML→markdown, JS-enabled web scraping",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "firecrawl-mcp"],
  "env": {
    "FIRECRAWL_API_KEY": "${FIRECRAWL_API_KEY}"
  }
}
```

The registry loader (`src/registry/`) reads these manifests at runtime and builds the `.mcp.json` output. Adding a new MCP requires only adding a folder + `manifest.json` — no changes to wizard logic.

**McpManifest type:**

```ts
interface McpManifest {
  name: string
  type: 'mcp'
  description: string
  version: string
  command: string
  args: string[]
  env?: Record<string, string>
}
```

---

## File Structure

```
packages/harness-kit/
  src/
    wizard/
      index.ts                → runWizard(), xstate machine definition
      steps/
        project-info.ts       → name + 3-field description prompts
        tech-stack-select.ts  → SearchableMultiselect component (@clack/core)
        detect-tooling.ts     → filesystem scan + offer install
        harness-config.ts     → git, memory, presets, browser, MCP prompts
        preview-apply.ts      → file list, conflict resolution, listr2 apply
      types.ts                → WizardContext, WizardEvent, TechOption interfaces
    registry/
      loader.ts               → read manifest.json files from registry/
      types.ts                → McpManifest, ModuleManifest interfaces
  registry/
    mcp/
      playwright/manifest.json
      firecrawl/manifest.json
      context7/manifest.json
      tavily/manifest.json
      github/manifest.json
      exa/manifest.json
      brave-search/manifest.json
      crawl4ai/manifest.json
      spider/manifest.json
      apify/manifest.json
      bright-data/manifest.json
      agent-browser/manifest.json
      stagehand/manifest.json
      supabase/manifest.json
      vercel/manifest.json
```

---

## harness.json Output

```json
{
  "version": "1.0.0",
  "registry": "bundled",
  "techStack": ["nextjs", "typescript", "docker"],
  "presets": ["spec-driven", "tdd", "planning-first", "quality-gates"],
  "modules": [
    "rules/typescript",
    "rules/git-conventional",
    "skills/tdd-workflow",
    "skills/brainstorming",
    "hooks/pre-commit",
    "hooks/quality-gate"
  ],
  "memory": "file-based",
  "mcp": ["playwright", "firecrawl", "context7", "tavily", "github"],
  "aiGeneration": true
}
```

`registry: "bundled"` is always written in v1. Remote registry is v2.

Token estimate in preview is computed at runtime: sum of `tokenEstimate` from `manifest.json` of each selected module. Falls back to `0` if manifest is missing the field.

---

## MVP Scope (this spec)

**In scope:**
- Full wizard flow: projectInfo → techStackSelect → detectTooling → harnessConfig → preview → apply
- 3-field project description (purpose + users + constraints)
- `SearchableMultiselect` component via `@clack/core` v0.3.x
- All harness config sections: git, memory, docs, workflow presets, browser tools, web content tools, MCP
- AI generation via Anthropic SDK, fallback Handlebars
- Conflict resolution per file: overwrite / skip
- xstate v5 machine with BACK navigation and error handling
- Registry manifest loader (`src/registry/loader.ts`) — reads `manifest.json` per MCP module
- MCP manifests for all supported integrations in `registry/mcp/`

**Out of scope (v2+):**
- `harness-kit add`, `list`, `status` commands (separate specs)
- Registry module loading from manifests (separate spec)
- Conflict resolution "diff" mode
- Remote registry support
- Multi-IDE compilation (v3+)
