# Base Project Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the harness-kit monorepo skeleton with TypeScript build tooling, README.md, and the project's own harness configuration.

**Architecture:** pnpm workspace monorepo. `packages/core` holds shared constants/types. `packages/harness-kit` is the main CLI package (`@harness-kit/cli`) — contains `src/`, `registry/`, `presets/`, `templates/` as per the design spec. `packages/harness-kit-alias` is a thin JS wrapper publishing the unscoped `harness-kit` alias. Root holds shared tsconfig and tooling.

**Tech Stack:** Node 22 LTS, TypeScript 5, pnpm workspaces, tsup (ESM bundle), vitest (testing), commander v14, @clack/prompts ^0.7

---

## File Map

```
harness-kit/
├── package.json                       # root — pnpm workspace, shared devDeps
├── pnpm-workspace.yaml
├── tsconfig.base.json                 # shared TS settings (no project refs)
├── tsconfig.json                      # root tsconfig with project references for tsc -b
├── .nvmrc                             # 22
├── .gitignore
├── README.md
│
├── CLAUDE.md                          # project's own harness
├── AGENTS.md
├── harness.json                       # harness state (modules installed)
├── .claude/
│   ├── settings.json
│   └── rules/
│       └── git-conventional.md
│
└── packages/
    ├── core/
    │   ├── package.json               # @harness-kit/core (private)
    │   ├── tsconfig.json
    │   ├── tsup.config.ts
    │   ├── vitest.config.ts
    │   ├── src/
    │   │   └── index.ts               # exports HARNESS_KIT_VERSION + shared types
    │   └── tests/
    │       └── index.test.ts
    │
    ├── harness-kit/
    │   ├── package.json               # @harness-kit/cli, bin: harness-kit
    │   ├── tsconfig.json
    │   ├── tsup.config.ts
    │   ├── vitest.config.ts
    │   ├── src/
    │   │   ├── index.ts               # CLI entry: createCli() + guarded parseAsync()
    │   │   ├── cli/                   # command definitions
    │   │   ├── wizard/                # interactive prompt flow
    │   │   ├── engine/                # artifact composition engine
    │   │   └── registry/              # module loader, preset resolver
    │   ├── tests/
    │   │   └── cli.test.ts
    │   ├── registry/                  # artifact library (shipped with package)
    │   │   ├── skills/
    │   │   │   └── .gitkeep
    │   │   ├── rules/
    │   │   │   └── .gitkeep
    │   │   ├── hooks/
    │   │   │   └── .gitkeep
    │   │   ├── docs/
    │   │   │   └── .gitkeep
    │   │   └── agents/
    │   │       └── .gitkeep
    │   ├── presets/                   # preset bundle declarations
    │   │   └── .gitkeep
    │   └── templates/                 # Handlebars base templates
    │       └── .gitkeep
    │
    └── harness-kit-alias/
        ├── package.json               # harness-kit (unscoped alias)
        └── bin/
            └── harness-kit.js         # #!/usr/bin/env node — invokes createCli()
│
└── examples/                          # manual test projects (not in pnpm workspace)
    ├── README.md
    ├── basic-node/                    # plain Node.js, no TypeScript
    │   ├── package.json
    │   └── README.md
    └── typescript-project/            # TS project with tsconfig — tests smart detection
        ├── package.json
        ├── tsconfig.json
        └── README.md
```

---

## Task 1: Root Monorepo Scaffold

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `tsconfig.json`
- Create: `.nvmrc`
- Create: `.gitignore`

- [ ] **Step 1: Init git repo**

Run: `git init`
Expected: `Initialized empty Git repository in .git/`

- [ ] **Step 2: Create root package.json**

```json
{
  "name": "harness-kit",
  "private": true,
  "version": "0.0.0",
  "engines": { "node": ">=22" },
  "packageManager": "pnpm@9",
  "scripts": {
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "dev": "pnpm --filter @harness-kit/cli run dev",
    "typecheck": "tsc -b"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "tsup": "^8.0.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 3: Create pnpm-workspace.yaml**

```yaml
packages:
  - "packages/*"
```

- [ ] **Step 4: Create tsconfig.base.json** (shared compiler options, no include/references)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

- [ ] **Step 5: Create root tsconfig.json** (project references for `tsc -b` typecheck)

```json
{
  "files": [],
  "references": [
    { "path": "packages/core" },
    { "path": "packages/harness-kit" }
  ]
}
```

- [ ] **Step 6: Create .nvmrc**

```
22
```

- [ ] **Step 7: Create .gitignore**

```
node_modules/
dist/
.env.local
CLAUDE.local.md
.claude/settings.local.json
*.tsbuildinfo
```

---

## Task 2: packages/core Scaffold

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/tsup.config.ts`
- Create: `packages/core/vitest.config.ts`
- Create: `packages/core/tests/index.test.ts`
- Create: `packages/core/src/index.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@harness-kit/core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "dev": "tsup --watch"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "composite": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create tsup.config.ts**

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
})
```

- [ ] **Step 4: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
```

- [ ] **Step 5: Write failing test**

`packages/core/tests/index.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { HARNESS_KIT_VERSION } from '../src/index.js'

describe('core', () => {
  it('exports a semver version string', () => {
    expect(typeof HARNESS_KIT_VERSION).toBe('string')
    expect(HARNESS_KIT_VERSION).toMatch(/^\d+\.\d+\.\d+/)
  })
})
```

- [ ] **Step 6: Install deps and run test — expect FAIL**

Run: `pnpm install && pnpm --filter @harness-kit/core test`
Expected: FAIL — `HARNESS_KIT_VERSION` not exported

- [ ] **Step 7: Implement src/index.ts**

```typescript
export const HARNESS_KIT_VERSION = '0.1.0'
```

- [ ] **Step 8: Run test — expect PASS**

Run: `pnpm --filter @harness-kit/core test`
Expected: PASS — 1 test passed

- [ ] **Step 9: Build**

Run: `pnpm --filter @harness-kit/core build`
Expected: `packages/core/dist/index.js` and `packages/core/dist/index.d.ts` created

---

## Task 3: packages/harness-kit Scaffold

**Files:**
- Create: `packages/harness-kit/package.json`
- Create: `packages/harness-kit/tsconfig.json`
- Create: `packages/harness-kit/tsup.config.ts`
- Create: `packages/harness-kit/vitest.config.ts`
- Create: `packages/harness-kit/src/index.ts`
- Create: `packages/harness-kit/tests/cli.test.ts`
- Create: `packages/harness-kit/src/cli/`, `wizard/`, `engine/`, `registry/` (stubs)
- Create: `packages/harness-kit/registry/` subdirs (with .gitkeep)
- Create: `packages/harness-kit/presets/.gitkeep`
- Create: `packages/harness-kit/templates/.gitkeep`

- [ ] **Step 1: Create package.json**

Note: `@clack/prompts` latest stable is `^0.7.0` (v1 not yet published).

```json
{
  "name": "@harness-kit/cli",
  "version": "0.1.0",
  "description": "CLI tool that scaffolds AI agent harness environments for projects",
  "type": "module",
  "bin": {
    "harness-kit": "./dist/index.js"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist", "registry", "presets", "templates"],
  "engines": { "node": ">=22" },
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "dev": "tsup --watch"
  },
  "dependencies": {
    "@harness-kit/core": "workspace:*",
    "commander": "^14.0.0",
    "@clack/prompts": "^0.7.0",
    "chalk": "^5.0.0",
    "execa": "^9.0.0",
    "listr2": "^10.0.0",
    "handlebars": "^4.7.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "composite": true
  },
  "references": [
    { "path": "../core" }
  ],
  "include": ["src"]
}
```

- [ ] **Step 3: Create tsup.config.ts**

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
})
```

- [ ] **Step 4: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
```

- [ ] **Step 5: Write failing test**

`packages/harness-kit/tests/cli.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { createCli } from '../src/index.js'

describe('harness-kit CLI entry', () => {
  it('createCli returns a Command with parseAsync', () => {
    const cli = createCli()
    expect(typeof cli.parseAsync).toBe('function')
  })

  it('CLI has correct name', () => {
    const cli = createCli()
    expect(cli.name()).toBe('harness-kit')
  })
})
```

- [ ] **Step 6: Install deps and run test — expect FAIL**

Run: `pnpm install && pnpm --filter @harness-kit/cli test`
Expected: FAIL — `createCli` not exported

- [ ] **Step 6: Implement src/index.ts**

`parseAsync` is guarded so importing the module in tests does not consume `process.argv`:

```typescript
import { Command } from 'commander'
import { HARNESS_KIT_VERSION } from '@harness-kit/core'

export function createCli(): Command {
  const program = new Command()
  program
    .name('harness-kit')
    .description('Scaffold AI agent harness environments')
    .version(HARNESS_KIT_VERSION)
  return program
}

// Only run when executed directly as a binary
const isMain =
  process.argv[1] != null &&
  new URL(import.meta.url).pathname === process.argv[1]

if (isMain) {
  createCli().parseAsync()
}
```

- [ ] **Step 7: Run test — expect PASS**

Run: `pnpm --filter @harness-kit/cli test`
Expected: PASS — 2 tests passed

- [ ] **Step 8: Build**

Run: `pnpm --filter @harness-kit/cli build`
Expected: `packages/harness-kit/dist/index.js` with `#!/usr/bin/env node` shebang

- [ ] **Step 9: Create src/ subdirectory stubs (cli, wizard, engine, registry)**

```bash
mkdir -p packages/harness-kit/src/cli packages/harness-kit/src/wizard packages/harness-kit/src/engine packages/harness-kit/src/registry
touch packages/harness-kit/src/cli/.gitkeep packages/harness-kit/src/wizard/.gitkeep packages/harness-kit/src/engine/.gitkeep packages/harness-kit/src/registry/.gitkeep
```

- [ ] **Step 10: Create registry/, presets/, templates/ stubs**

```bash
mkdir -p packages/harness-kit/registry/skills packages/harness-kit/registry/rules packages/harness-kit/registry/hooks packages/harness-kit/registry/docs packages/harness-kit/registry/agents
touch packages/harness-kit/registry/skills/.gitkeep packages/harness-kit/registry/rules/.gitkeep packages/harness-kit/registry/hooks/.gitkeep packages/harness-kit/registry/docs/.gitkeep packages/harness-kit/registry/agents/.gitkeep
mkdir -p packages/harness-kit/presets packages/harness-kit/templates
touch packages/harness-kit/presets/.gitkeep packages/harness-kit/templates/.gitkeep
```

---

## Task 4: packages/harness-kit-alias Scaffold

**Files:**
- Create: `packages/harness-kit-alias/package.json`
- Create: `packages/harness-kit-alias/bin/harness-kit.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "harness-kit",
  "version": "0.1.0",
  "description": "Alias for @harness-kit/cli — scaffolds AI agent harness environments",
  "type": "module",
  "bin": {
    "harness-kit": "./bin/harness-kit.js"
  },
  "files": ["bin"],
  "engines": { "node": ">=22" },
  "dependencies": {
    "@harness-kit/cli": "workspace:*"
  }
}
```

- [ ] **Step 2: Create bin/harness-kit.js**

Explicitly invokes CLI rather than relying on module side-effects:

```javascript
#!/usr/bin/env node
import { createCli } from '@harness-kit/cli'
createCli().parseAsync()
```

- [ ] **Step 3: Mark executable**

Run: `chmod +x packages/harness-kit-alias/bin/harness-kit.js`

---

## Task 5: Smoke Test — CLI Binary Runs

- [ ] **Step 1: Install all workspace deps from root**

Run: `pnpm install`
Expected: all packages linked, workspace symlinks created, no errors

- [ ] **Step 2: Build all packages**

Run: `pnpm build`
Expected: core and harness-kit build successfully (alias has no build step)

- [ ] **Step 3: Run CLI --version via built binary**

Run: `node packages/harness-kit/dist/index.js --version`
Expected: `0.1.0`

- [ ] **Step 4: Run CLI --help**

Run: `node packages/harness-kit/dist/index.js --help`
Expected output contains:
```
Usage: harness-kit [options]
Scaffold AI agent harness environments
```

- [ ] **Step 5: Verify alias wrapper invokes CLI**

Run: `node packages/harness-kit-alias/bin/harness-kit.js --version`
Expected: `0.1.0`

---

## Task 6: README.md

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README.md**

````markdown
# harness-kit

> CLI tool that scaffolds AI agent harness environments for projects.

Inspired by harness engineering principles from OpenAI — design the environment, not just the code.
Distills best practices from [superpowers](https://github.com/superpowers-dev/superpowers) and [everything-claude-code](https://github.com/affaan-m/everything-claude-code) into artifacts you own directly.

## Install

```bash
npx harness-kit init
# or
npx @harness-kit/cli init
```

## Usage

```bash
harness-kit init                    # interactive wizard — detects existing config
harness-kit add typescript          # add a preset bundle
harness-kit add rules/python        # add a single artifact
harness-kit list                    # browse all available modules
harness-kit list --tag testing      # filter by tag
harness-kit info tdd-workflow       # detail + preview
harness-kit status                  # view installed harness state
```

## Design Principles

- **Shadcn distribution model** — artifacts are copied into your project; you own them, no runtime dependency
- **"Just enough"** — not zero, not everything; each module must justify its context window cost
- **AI-powered with static fallback** — generates contextual config when you provide an API key; Handlebars templates otherwise
- **Claude Code first** — targets Claude Code artifacts (`.claude/`, `CLAUDE.md`, `AGENTS.md`); extensible for other IDEs

## Packages

| Package | Description |
|---------|-------------|
| `@harness-kit/cli` | Scoped package with strict semver |
| `harness-kit` | Alias for easy `npx harness-kit` usage |

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck   # tsc -b project references
```

## License

MIT
````

---

## Task 7: Project's Own Harness Config

Set up harness-kit's own agent harness — the project uses what it builds.

**Files:**
- Create: `CLAUDE.md`
- Create: `AGENTS.md`
- Create: `harness.json`
- Create: `.claude/settings.json`
- Create: `.claude/rules/git-conventional.md`

- [ ] **Step 1: Create CLAUDE.md**

```markdown
# harness-kit

CLI tool that scaffolds AI agent harness environments. pnpm workspace monorepo:
- `packages/core` — shared constants and types (`@harness-kit/core`)
- `packages/harness-kit` — main CLI package (`@harness-kit/cli`): src/, registry/, presets/, templates/
- `packages/harness-kit-alias` — thin JS wrapper publishing `harness-kit` alias

## Stack

TypeScript 5, Node 22, pnpm workspaces, tsup (build), vitest (tests), commander (CLI parsing), @clack/prompts (wizard UI), chalk, execa, listr2, Handlebars.

## Key Principles

- **Shadcn model**: copy artifacts into target project; user owns them, no runtime dep
- **Just enough**: every module must justify its context window cost
- **TDD**: write failing test → implement → pass → commit

## Conventions

- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`)
- All new functionality starts with a failing vitest test
- Build: `pnpm build` from root or `pnpm --filter <pkg> build` per package
- No `Co-Authored-By` lines in commits

## Structure

See AGENTS.md for full project map.
```

- [ ] **Step 2: Create AGENTS.md**

```markdown
# harness-kit — Project Map

> Pointer map for AI agents. For implementation details, follow file links.

## What This Project Does

CLI that scaffolds AI agent harness environments. `harness-kit init` → wizard → copies `.claude/`, `CLAUDE.md`, `AGENTS.md`, `harness.json`, hooks, rules, skills into the user's project.

## Monorepo Packages

| Package | Path | Role |
|---------|------|------|
| `@harness-kit/core` | `packages/core/` | Shared constants, types |
| `@harness-kit/cli` | `packages/harness-kit/` | Main CLI — all commands |
| `harness-kit` | `packages/harness-kit-alias/` | Thin alias wrapper |

## Main Package Source Layout

```
packages/harness-kit/
  src/
    cli/        → command definitions (init, add, list, status)
    wizard/     → interactive prompt flow, tech stack detection
    engine/     → compose, merge, apply artifacts, token budget
    registry/   → load modules, resolve presets, validate manifests
  registry/     → artifact library shipped with package
    skills/     → SKILL.md + manifest.json per skill
    rules/      → rule.md + manifest.json per rule
    hooks/      → hook.sh + manifest.json per hook
    docs/       → doc templates
    agents/     → agent definitions
  presets/      → JSON bundle declarations
  templates/    → Handlebars base templates (CLAUDE.md, AGENTS.md, harness.json)
```

## Specs & Plans

- Design spec: `docs/specs/2026-04-10-harness-kit-design.md`
- Implementation plans: `docs/plans/`

## Key Files

- `packages/harness-kit/src/index.ts` — CLI entry point
- `harness.json` — this project's own harness state (modules installed)
- `.env.local` — AI provider config (gitignored, optional)
```

- [ ] **Step 3: Create harness.json**

```json
{
  "version": "1.0.0",
  "modules": [
    "rules/git-conventional"
  ],
  "memory": "file-based",
  "techStack": ["typescript", "node"],
  "aiGeneration": false
}
```

- [ ] **Step 4: Create .claude/settings.json**

```json
{
  "permissions": {
    "allow": [],
    "deny": []
  }
}
```

- [ ] **Step 5: Create .claude/rules/git-conventional.md**

```markdown
# Git Conventional Commits

All commits MUST follow Conventional Commits format:

```
<type>(<scope>): <description>
```

**Types:** `feat` | `fix` | `docs` | `chore` | `refactor` | `test` | `build`

**Examples:**
- `feat(cli): add init command wizard`
- `fix(registry): resolve manifest path on Windows`
- `chore: bump tsup to v8`

Never add `Co-Authored-By` to commit messages.
```

---

## Task 8: Examples Folder

Tạo project mẫu để test CLI trực tiếp trong quá trình phát triển. Không được include vào pnpm workspace.

**Files:**
- Create: `examples/README.md`
- Create: `examples/basic-node/package.json`
- Create: `examples/basic-node/README.md`
- Create: `examples/typescript-project/package.json`
- Create: `examples/typescript-project/tsconfig.json`
- Create: `examples/typescript-project/README.md`

- [ ] **Step 1: Create examples structure**

```bash
mkdir -p examples/basic-node examples/typescript-project
```

- [ ] **Step 2: Create examples/README.md, basic-node/package.json, typescript-project/package.json + tsconfig.json**

(See File Map for content)

- [ ] **Step 3: Verify examples are NOT in pnpm workspace**

Run: `pnpm list -r 2>&1 | grep example`
Expected: no output (examples excluded from workspace)

- [ ] **Step 4: Manual smoke test from example**

```bash
cd examples/basic-node
node ../../packages/harness-kit/dist/index.js --help
```
Expected: harness-kit help output

---

## Task 9: Final Integration Verification

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`
Expected: all tests pass across packages

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: no TypeScript errors

- [ ] **Step 3: Verify harness files exist**

Run: `ls CLAUDE.md AGENTS.md harness.json .claude/settings.json .claude/rules/git-conventional.md`
Expected: all 5 files present, no errors

- [ ] **Step 4: Initial commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json tsconfig.json .nvmrc .gitignore
git add README.md CLAUDE.md AGENTS.md harness.json
git add .claude/
git add packages/
git add docs/plans/ examples/
git commit -m "chore: scaffold harness-kit monorepo base project"
```
