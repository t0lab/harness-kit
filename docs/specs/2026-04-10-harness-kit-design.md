# harness-kit Design Spec

**Date:** 2026-04-10  
**Status:** Draft  
**Author:** Liam Lee

---

## Problem Statement

Vibecoding nhiều dự án đồng thời gặp một vấn đề nhức nhối: mỗi project có config context cho agent khác nhau, hoặc thiếu config vì phải setup thủ công từng thứ (rules, skills, commands, docs templates, hooks...). Bài harness engineering của OpenAI về dev với 0 dòng code viết tay đã chứng minh tầm quan trọng của "docs as code" và harness engineering như một discipline riêng — **harness = operating system của agent**.

harness-kit ra đời để giải quyết: một CLI scaffold môi trường harness cho AI agent, từ greenfield đến tích hợp vào project cũ.

---

## Goals

- Setup môi trường harness (Claude Code trước, extensible cho IDEs khác) nhanh và đúng ngay từ đầu
- Chưng cất best practices từ các plugin nổi tiếng (superpowers, everything-claude-code) thành artifacts bạn own trực tiếp
- Áp dụng nguyên tắc "just enough" — không nhồi nhét, không thiếu
- Shadcn-inspired: copy vào project, own hoàn toàn, không runtime dependency

---

## Non-Goals

- Không phải runtime dependency (harness-kit chỉ là scaffolding tool)
- Không replace superpowers hay ECC — distill best practices từ chúng
- Không auto-maintain artifacts sau khi copy (user owns them)

---

## Architecture Overview

### Package Publishing

Publish đồng thời hai package cùng source, CLI command là `harness-kit`:

| Package | Mục đích |
|---------|----------|
| `@harness-kit/cli` | Scoped package cho t0lab ecosystem, semver chặt |
| `harness-kit` | Unscoped alias để user install dễ: `npx harness-kit` |

`harness-kit` (unscoped) là thin wrapper — `package.json` của nó chỉ re-export binary từ `@harness-kit/cli`:

```json
// packages/harness-kit/package.json
{
  "name": "harness-kit",
  "bin": { "harness-kit": "bin/harness-kit.js" }
}
// bin/harness-kit.js → require('@harness-kit/cli')
```

Monorepo structure: `packages/core` (logic) + `packages/harness-kit` (scoped) + `packages/harness-kit-alias` (unscoped wrapper).

### Tech Stack

- **Language:** TypeScript, Node 22 LTS
- **Distribution:** npm publish đồng thời `@harness-kit/cli` + `harness-kit`, bundle với `tsup` → single `dist/index.js`
- **Argument parsing:** `commander` v14 — zero deps, ships own types, subcommand support
- **Interactive wizard:** `@clack/prompts` v1 — purpose-built multi-step wizard UI, built-in spinner/progress/tasks, dùng bởi Vite/Astro/Nuxt. Không dùng Inquirer.js (conflict TTY với Clack)
- **Colors:** `chalk` v5 — cho output ngoài Clack managed regions
- **Shell commands:** `execa` v9 — streaming, cross-platform, clean error objects
- **Task runner:** `listr2` v10 — multi-step operations với progress (scaffold, install, configure)
- **Templates:** Handlebars (static fallback khi không có AI config)
- **AI generation:** Anthropic SDK / multi-provider (khi có API key)

### Project Structure (harness-kit repo)

```
harness-kit/
├── src/
│   ├── cli/            # entry point, command definitions (init, add, list, sync, audit)
│   ├── wizard/         # interactive prompt flow + project detection logic
│   ├── engine/         # composition engine: merge, detect, apply, token budget
│   └── registry/       # module loader, preset resolver, manifest validator
├── registry/           # artifact library (shipped with package)
│   ├── skills/
│   │   ├── tdd-workflow/
│   │   │   ├── manifest.json
│   │   │   └── SKILL.md
│   │   ├── brainstorming/
│   │   └── systematic-debugging/
│   ├── rules/
│   │   ├── typescript/
│   │   │   ├── manifest.json
│   │   │   └── rule.md
│   │   ├── python/
│   │   ├── git-conventional/
│   │   └── react/
│   ├── hooks/
│   │   ├── auto-format/
│   │   │   ├── manifest.json
│   │   │   └── hook.sh
│   │   ├── quality-gate/
│   │   └── validate-bash/
│   ├── docs/
│   │   ├── spec-template/
│   │   ├── adr-template/
│   │   └── design-template/
│   └── agents/
│       └── code-reviewer/
├── presets/            # bundle declarations
│   ├── recommended.json
│   ├── typescript.json
│   ├── python.json
│   ├── docs-as-code.json
│   ├── tdd.json
│   ├── git-flow.json
│   └── security.json
└── templates/          # base CLAUDE.md, settings.json, AGENTS.md templates
```

---

## Artifact Format

Mỗi artifact là một thư mục tự chứa với `manifest.json` + content files:

```json
// registry/skills/tdd-workflow/manifest.json
{
  "name": "tdd-workflow",
  "type": "skill",
  "version": "1.0.0",
  "description": "Enforces RED-GREEN-REFACTOR cycle before writing implementation code",
  "tags": ["testing", "workflow", "quality"],
  "requires": ["rules/git-conventional"],
  "conflicts": [],
  "source": "distilled:superpowers@5.0.5",
  "tokenEstimate": 2400
}
```

**Types:** `skill` | `rule` | `hook` | `agent` | `docs` | `config`

---

## CLI Commands

```bash
# Khởi tạo harness — wizard tự detect existing config
harness-kit init

# Thêm preset hoặc artifact riêng lẻ
harness-kit add typescript              # preset bundle
harness-kit add rules/python            # artifact granular
harness-kit add skills/tdd-workflow     # artifact granular

# Browse modules
harness-kit list                        # all available
harness-kit list --installed            # chỉ installed
harness-kit list --tag testing          # filter by tag
harness-kit info tdd-workflow           # detail + preview

# Cập nhật artifacts từ registry version mới
harness-kit sync

# Phân tích harness hiện tại
harness-kit audit

# Remove module
harness-kit remove rules/typescript

# Xem trạng thái harness
harness-kit status
```

---

## Init Wizard Flow

### Bước 0 — Prerequisites Check

```
✓ Checking project directory...
✓ Checking git initialization...
? Anthropic API key (optional, enables AI generation):
  → Stored in .env.local (gitignored)
  → Skip to use static templates
```

### Bước 1 — Project Info & Tech Stack (user chọn trước)

User khai báo tech stack theo từng vùng của project. Multi-tech stack được tổ chức thành zones:

```
? Project name: my-app
? Mô tả ngắn (cho CLAUDE.md header): E-commerce platform

? Select your tech stack zones:

  ┌─ Frontend ──────┐  ┌─ Backend ───────┐  ┌─ Database ──────┐  ┌─ Other ─────────┐
  │ ◉ React + TS   │  │ ◉ Node + TS     │  │ ◉ PostgreSQL    │  │ ◯ Mobile        │
  │ ◯ Vue + TS     │  │ ◯ Python        │  │ ◯ MySQL         │  │ ◉ Infra/DevOps  │
  │ ◯ Svelte + TS  │  │ ◯ Go            │  │ ◯ MongoDB       │  │ ◯ Data / ML     │
  │ ◯ Vanilla TS   │  │ ◯ Rust          │  │ ◯ SQLite        │  └─────────────────┘
  │ ◯ JavaScript   │  │ ◯ Java          │  │ ◯ None          │
  │ ◯ None         │  │ ◯ None          │  └─────────────────┘
  └────────────────┘  └─────────────────┘

  [Tab] switch zone  [Space] select  [Enter] confirm
```

### Bước 2 — Smart Detection (sau khi có tech stack)

Dựa trên zones đã chọn, harness-kit scan codebase để detect existing tooling và recommend packages còn thiếu:

```
Scanning frontend zone (TypeScript + React)...
  ✓ tsconfig.json found
  ✗ ESLint not configured
  ✗ Prettier not configured
  ✓ Vitest detected

Scanning backend zone (Node.js + TypeScript)...
  ✓ package.json found
  ✗ Husky (git hooks) not installed

Recommendations:
  ✦ Install ESLint + @typescript-eslint + eslint-plugin-react? (Y/n)
  ✦ Install Prettier? (Y/n)
  ✦ Install Husky for git hooks? (Y/n)
```

Detection targets per zone:
- **Frontend TS:** `tsconfig.json`, ESLint config, Prettier config, testing framework
- **Backend Node:** `package.json`, Husky, lint-staged
- **Python:** `pyproject.toml`, ruff, mypy, black
- **Go:** `go.mod`, golangci-lint
- **Database:** migration tool (Prisma, Drizzle, Alembic, golang-migrate)

### Bước 3 — Harness Config

```
? Git workflow:
  ◉ Conventional Commits  ◯ Custom  ◯ Skip
? Long-term memory system:
  ◉ File-based (.claude/memory/)  ◯ Mem0 MCP  ◯ None
? Docs as code? (AGENTS.md, SPEC.md template, ADR structure, llms.txt)
  ◉ Yes  ◯ No
? Workflow presets: (checkbox)
  ◉ TDD workflow  ◉ Brainstorm-first  ◯ Code review gates
  ◯ Security review  ◯ Parallel agents
? MCP integrations: (checkbox)
  ◉ GitHub  ◯ Supabase  ◯ Vercel  ◯ Context7  ◯ None
```

### Bước 3 — Preview & Apply

```
Will create:
  ✦ CLAUDE.md                              (AI-generated)
  ✦ AGENTS.md                              (template, ~100 lines)
  ✦ ARCHITECTURE.md                        (template)
  ✦ harness.json
  ✦ .env.local                             (gitignored)
  ✦ llms.txt
  ✦ .claude/settings.json
  ✦ .claude/rules/typescript.md
  ✦ .claude/rules/git-conventional.md
  ✦ .claude/hooks/validate-bash.sh
  ✦ .claude/hooks/quality-gate.sh
  ✦ .claude/hooks/auto-format.sh
  ✦ .claude/skills/tdd-workflow/SKILL.md
  ✦ .mcp.json
  ✦ docs/DESIGN.md
  ✦ docs/SECURITY.md
  ✦ docs/product-specs/SPEC.md
  ✦ docs/design-docs/decisions/
  ✦ docs/exec-plans/active/
  ✦ docs/exec-plans/completed/
  ✦ docs/references/

Estimated context load: ~18k tokens/session

Apply? (Y/n)
```

### Auto-detect Mode (existing project)

```
Detected: CLAUDE.md exists → Merge mode
Detected: .claude/ exists → Will extend
Detected: harness.json exists → Harness initialized. Run `add` instead.
Conflict resolution: skip / overwrite / diff
```

---

## Generated Project Structure

```
my-project/
├── AGENTS.md                        # Table of contents ~100 lines
├── ARCHITECTURE.md                  # Domain map, dependency layering
├── CLAUDE.md                        # AI-gen hoặc template (~50 lines focused)
├── CLAUDE.local.md                  # gitignored
├── harness.json                     # module registry của project
├── .env.local                       # gitignored: AI provider + MEM0_API_KEY
├── llms.txt                         # machine-readable index của docs
│
├── .claude/
│   ├── settings.json
│   ├── settings.local.json          # gitignored
│   ├── rules/
│   │   ├── typescript.md
│   │   └── git-conventional.md
│   ├── hooks/
│   │   ├── auto-format.sh           # PostToolUse
│   │   ├── quality-gate.sh          # Stop: run tests before done
│   │   └── validate-bash.sh         # PreToolUse: block dangerous commands
│   ├── skills/
│   │   ├── tdd-workflow/SKILL.md
│   │   └── brainstorming/SKILL.md
│   ├── commands/                    # legacy slash commands
│   ├── agents/
│   │   └── code-reviewer.md
│   └── output-styles/
│
├── docs/
│   ├── DESIGN.md                    # Technical requirements overview
│   ├── SECURITY.md                  # Security policies
│   ├── RELIABILITY.md               # SLA, error handling policies
│   ├── product-specs/
│   │   └── SPEC.md                  # AI-drafted hoặc template
│   ├── design-docs/
│   │   └── decisions/               # ADRs
│   ├── exec-plans/
│   │   ├── active/
│   │   └── completed/
│   ├── references/                  # External lib docs reformatted for LLMs
│   └── generated/                   # Auto-generated (db schema, API docs)
│
└── .mcp.json                        # MCP server configs
```

### harness.json

```json
{
  "version": "1.0.0",
  "presets": ["typescript", "docs-as-code"],
  "modules": [
    "rules/git-conventional",
    "skills/tdd-workflow",
    "hooks/validate-bash",
    "hooks/quality-gate"
  ],
  "memory": "file-based",
  "techStack": ["typescript", "node", "react"],
  "aiGeneration": true
}
```

### .env.local (AI Provider Config)

```bash
HARNESS_AI_PROVIDER=anthropic        # anthropic | openai | openrouter | ollama
HARNESS_AI_BASE_URL=https://api.anthropic.com
HARNESS_AI_API_KEY=sk-ant-...
HARNESS_AI_MODEL=claude-sonnet-4-6

# Nếu chọn Mem0 memory
MEM0_API_KEY=...
```

### Mem0 MCP Config (khi chọn mem0 memory)

```json
// .mcp.json
{
  "mcpServers": {
    "mem0": {
      "command": "mem0-mcp-server",
      "env": {
        "MEM0_API_KEY": "${MEM0_API_KEY}"
      }
    }
  }
}
```

---

## Built-in Presets

| Preset | Modules included |
|--------|-----------------|
| `recommended` | git-conventional rule, validate-bash hook, DESIGN.md template |
| `typescript` | typescript rule, auto-format-ts hook, quality-gate hook |
| `python` | python rule, ruff-format hook, mypy hook |
| `react` | react rule, typescript rule, auto-format-ts hook |
| `docs-as-code` | AGENTS.md, SPEC template, ADR template, llms.txt, brainstorming skill |
| `tdd` | quality-gate hook, tdd-workflow skill, testing rules |
| `git-flow` | git-conventional rule, commit-msg hook |
| `security` | validate-bash hook, security-review agent |
| `full-workflow` | brainstorm→plan→tdd→review (distilled từ superpowers) |

---

## Core Design Principles

### 1. Shadcn Distribution Model

harness-kit **copy artifacts trực tiếp vào project** — không phải runtime dependency. Bạn own artifacts, có thể edit thoải mái. Giống shadcn/ui: bạn chọn components, code được copy vào project của bạn.

### 2. "Just Enough" — Optimal Minimal

Không nhồi nhét, không thiếu. Mỗi module thêm vào là một chi phí context window phải justify. Claude Code thu hẹp context từ 200k xuống ~70k token khi có >80 active tools. `recommended` preset được calibrate để vừa đủ cho mọi project.

**Token budget warning:**
```bash
harness-kit add security-review
⚠ Adding 3 agents → +12k tokens/session
  Current: 8k | After: ~20k (10% of 200k window)
  Proceed? (Y/n)
```

### 3. AI-Powered với Static Fallback

- **Có API key:** CLAUDE.md, SPEC.md, AGENTS.md được AI generate contextual từ project description
- **Không có API key:** dùng static Handlebars templates — vẫn useful, zero dependency

### 4. Audit & Prune

```bash
harness-kit audit
  Skills: 4 installed, 2 never triggered last 30 sessions
  Total context load: ~18k tokens
  Recommendation: remove skills/systematic-debugging
```

### 5. Claude Code First, Extensible Later

Output hiện tại target Claude Code. Architecture có abstraction layer để sau này compile ra `.cursorrules`, `GEMINI.md`, etc. từ cùng một registry.

---

## Showcase — CLI + Web

### CLI

```bash
harness-kit list                    # browse all modules
harness-kit list --tag testing      # filter
harness-kit info tdd-workflow       # detail + preview artifacts
```

### Web Docs Site (shadcn-style)

- Browse modules theo category
- Preview artifacts sẽ được generate
- Copy `harness-kit add <module>` command
- Search, filter theo tag, tech stack

---

## Harness Engineering Principles (nguồn: OpenAI)

harness-kit được thiết kế theo các nguyên tắc từ bài harness engineering của OpenAI:

1. **Design the environment, not the code** — harness-kit setup môi trường để agent thành công
2. **Enforce architecture mechanically** — hooks và CI validation enforce constraints, không chỉ documentation
3. **Repository as single source of truth** — mọi knowledge nằm trong repo, accessible với agent
4. **AGENTS.md as table of contents** — ~100 lines, pointer map, không monolithic
5. **Execution plans as first-class artifacts** — `docs/exec-plans/` versioned cùng với code

---

## MVP Scope (v1)

**In scope:**
- `harness-kit init` — full wizard với zone-based tech stack selection + smart detection
- `harness-kit add <module|preset>` — thêm module riêng lẻ
- `harness-kit list` — browse modules trong terminal
- `harness-kit status` — xem harness hiện tại của project
- Static templates (Handlebars) cho tất cả artifacts
- AI generation multi-provider khi có `.env.local`
- Claude Code target duy nhất
- Publish `@harness-kit/cli` + `harness-kit`

**Out of scope (v2+):**
- Web docs site
- `harness-kit audit` (token budget analysis)
- `harness-kit sync` (registry sync)
- Multi-IDE support (Cursor, Gemini CLI)
- Community/user-contributed modules
- `harness-kit remove`

---

## Registry Sync Mechanism (cần brainstorm thêm)

**Vấn đề:** Khi `@harness-kit/cli` release version mới với updated/new modules, user đã init project cũ có thể muốn pull modules mới về mà không phải re-init.

**3 options:**

### Option A — Bundled Registry (simplest)
Registry modules bundle thẳng vào npm package. `sync` = upgrade npm package rồi re-apply.
- ✅ Offline, reliable, zero external dependency
- ✅ Version lockstep với CLI version
- ❌ Phải upgrade cả CLI để get new modules
- ❌ Không thể hotfix một module mà không release CLI version mới

### Option B — Remote Registry (flexible)
Modules host trên GitHub raw / CDN. `harness-kit sync` fetch về latest.
- ✅ Module updates độc lập với CLI releases
- ✅ Community có thể contribute modules qua PR
- ❌ Requires internet, có thể break khi remote changes
- ❌ Security risk: executing remotely-fetched scripts

### Option C — Hybrid (recommended)
Default dùng bundled registry (Option A). Có thể override với remote URL trong `harness.json`:
```json
{
  "registry": "bundled",           // default
  // "registry": "https://harness-kit.t0lab.dev/registry"  // custom/remote
}
```
`harness-kit sync` so sánh `moduleVersion` trong `harness.json` với bundled registry version → diff → offer update.

- ✅ Offline by default
- ✅ Extensible cho custom/enterprise registry sau
- ✅ Security: bundled là default, remote là opt-in explicit

**→ Chọn Option C cho v1 (chỉ implement bundled), v2 thêm remote support.**

---

## Custom / User Modules (v2)

**Vấn đề:** User muốn thêm module riêng không có trong registry của harness-kit.

**Đề xuất 3 tiers:**

### Tier 1 — Local project modules (v2 early)
```
.harness/
  local-modules/
    my-custom-rule/
      manifest.json
      rule.md
```
`harness-kit add local/my-custom-rule` → copy như module thông thường.

### Tier 2 — npm modules (v2)
Bất kỳ package nào follow `harness-kit-module-*` convention:
```bash
npm install -g harness-kit-module-prisma
harness-kit add prisma   # tự discover từ installed packages
```

### Tier 3 — Git URL (v2)
```bash
harness-kit add github:username/my-harness-module
harness-kit add git+https://gitlab.com/org/module.git
```

**→ v1 chỉ có built-in registry. Local modules (Tier 1) là priority đầu tiên của v2.**

---

## Web Docs Site (v2)

**Đề xuất: Nextra** (Next.js-based, dùng bởi shadcn docs, Vercel docs)
- MDX support
- Built-in search
- Clean component showcase layout

**Content:**
- Browse tất cả modules theo category
- Preview artifacts được generate (syntax highlighted)
- Copy `harness-kit add <module>` command
- Filter theo tag, tech stack, zone

**Hosting:** Vercel, domain `harness-kit.dev` hoặc `harness-kit.t0lab.dev`

---

## Multi-IDE Roadmap (v3+)

Architecture chuẩn bị sẵn abstraction layer — registry artifacts là format-agnostic, compiler layer sẽ transform ra:
- `.cursorrules` (Cursor)
- `GEMINI.md` (Gemini CLI)
- `.windsurfrules` (Windsurf)
- `AGENTS.md` universal cross-tool format
