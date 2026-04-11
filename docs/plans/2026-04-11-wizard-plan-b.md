# harness-kit Wizard (Plan B) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full `harness-kit init` wizard — xstate machine, all wizard steps, AI generation, Handlebars templates, file scaffolder, and CLI wiring. Requires Plan A complete.

**Architecture:** xstate v5 actor drives the wizard loop — each state calls its step function, collects user input, transitions on NEXT/BACK/CONFIRM. The apply step uses the engine layer (ai-generator + template-renderer + scaffolder) to write files into the user's project. AI generation via Anthropic SDK when API key found in `.env`; Handlebars fallback otherwise.

**Tech Stack:** TypeScript 5, Node 22, xstate v5, @clack/prompts, listr2, handlebars, @anthropic-ai/sdk, execa

**Prerequisite:** Plan A complete — `src/wizard/types.ts`, `src/wizard/filter.ts`, `src/wizard/tech-options.ts`, `src/wizard/steps/tech-stack-select.ts`, `src/registry/loader.ts`, `registry/mcp/*/manifest.json` all exist.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/wizard/index.ts` | Create | xstate machine definition + `runWizard()` |
| `src/wizard/steps/project-info.ts` | Create | name + 3-field description prompts |
| `src/wizard/steps/detect-tooling.ts` | Create | filesystem scan + offer install |
| `src/wizard/steps/harness-config.ts` | Create | git, memory, docs, presets, browser, MCP prompts |
| `src/wizard/steps/preview-apply.ts` | Create | preview list + listr2 apply orchestration |
| `src/engine/ai-generator.ts` | Create | detect API key, call Claude to generate CLAUDE.md |
| `src/engine/template-renderer.ts` | Create | Handlebars template rendering |
| `src/engine/scaffolder.ts` | Create | write files to target project, conflict resolution |
| `src/engine/detector.ts` | Create | pure filesystem detection functions |
| `templates/CLAUDE.md.hbs` | Create | Handlebars CLAUDE.md template |
| `templates/AGENTS.md.hbs` | Create | Handlebars AGENTS.md template |
| `templates/harness.json.hbs` | Create | Handlebars harness.json template |
| `templates/mcp.json.hbs` | Create | Handlebars .mcp.json template |
| `templates/settings.json.hbs` | Create | Handlebars .claude/settings.json template |
| `templates/llms.txt.hbs` | Create | Handlebars llms.txt template |
| `tests/engine/detector.test.ts` | Create | filesystem detection unit tests |
| `tests/engine/template-renderer.test.ts` | Create | template rendering unit tests |
| `tests/engine/scaffolder.test.ts` | Create | file scaffold unit tests |
| `tests/engine/ai-generator.test.ts` | Create | API key detection unit tests |
| `tests/wizard/index.test.ts` | Create | xstate machine transition tests |
| `src/index.ts` | Modify | wire `harness-kit init` to `runWizard()` |

All paths relative to `packages/harness-kit/`.

---

## Task 1: xstate Machine

**Files:**
- Create: `packages/harness-kit/src/wizard/index.ts`
- Create: `packages/harness-kit/tests/wizard/index.test.ts`

- [ ] **Step 1: Write failing machine transition tests**

```ts
// packages/harness-kit/tests/wizard/index.test.ts
import { describe, it, expect } from 'vitest'
import { createActor } from 'xstate'
import { wizardMachine } from '../../src/wizard/index.js'

describe('wizardMachine', () => {
  it('starts in projectInfo state', () => {
    const actor = createActor(wizardMachine)
    actor.start()
    expect(actor.getSnapshot().value).toBe('projectInfo')
    actor.stop()
  })

  it('transitions projectInfo → techStackSelect on NEXT', () => {
    const actor = createActor(wizardMachine)
    actor.start()
    actor.send({ type: 'NEXT', data: { projectName: 'my-app', projectPurpose: 'test' } })
    expect(actor.getSnapshot().value).toBe('techStackSelect')
    actor.stop()
  })

  it('transitions techStackSelect → detectTooling when tech selected', () => {
    const actor = createActor(wizardMachine)
    actor.start()
    actor.send({ type: 'NEXT', data: {} })
    actor.send({ type: 'NEXT', data: { selectedTech: ['nextjs'] } })
    expect(actor.getSnapshot().value).toBe('detectTooling')
    actor.stop()
  })

  it('transitions techStackSelect → harnessConfig when no tech selected', () => {
    const actor = createActor(wizardMachine)
    actor.start()
    actor.send({ type: 'NEXT', data: {} })
    actor.send({ type: 'NEXT', data: { selectedTech: [] } })
    expect(actor.getSnapshot().value).toBe('harnessConfig')
    actor.stop()
  })

  it('BACK from preview returns to harnessConfig', () => {
    const actor = createActor(wizardMachine)
    actor.start()
    actor.send({ type: 'NEXT', data: {} })
    actor.send({ type: 'NEXT', data: { selectedTech: [] } })
    actor.send({ type: 'NEXT', data: {} })
    expect(actor.getSnapshot().value).toBe('preview')
    actor.send({ type: 'BACK' })
    expect(actor.getSnapshot().value).toBe('harnessConfig')
    actor.stop()
  })

  it('accumulates context across transitions', () => {
    const actor = createActor(wizardMachine)
    actor.start()
    actor.send({ type: 'NEXT', data: { projectName: 'shop', projectPurpose: 'ecommerce' } })
    actor.send({ type: 'NEXT', data: { selectedTech: [] } })
    const ctx = actor.getSnapshot().context
    expect(ctx.projectName).toBe('shop')
    expect(ctx.projectPurpose).toBe('ecommerce')
    actor.stop()
  })
})
```

- [ ] **Step 2: Run — verify fails**

```bash
pnpm --filter @harness-kit/cli test
```

Expected: FAIL — `Cannot find module '../../src/wizard/index.js'`

- [ ] **Step 3: Implement wizardMachine**

```ts
// packages/harness-kit/src/wizard/index.ts
import { createMachine, assign } from 'xstate'
import type { WizardContext, WizardEvent } from './types.js'

const initialContext: WizardContext = {
  projectName: '',
  projectPurpose: '',
  projectUsers: '',
  projectConstraints: '',
  selectedTech: [],
  detectedIssues: [],
  installSelected: false,
  gitWorkflow: ['conventional-commits', 'branch-strategy', 'pre-commit-hooks'],
  memory: 'file-based',
  docsAsCode: true,
  workflowPresets: ['spec-driven', 'tdd', 'planning-first', 'quality-gates'],
  browserTools: ['playwright'],
  webSearch: ['tavily'],
  webCrawl: ['firecrawl'],
  libraryDocs: ['context7'],
  docConversion: [],
  otherMcp: ['github'],
  aiGenerationEnabled: false,
}

export const wizardMachine = createMachine({
  id: 'wizard',
  initial: 'projectInfo',
  types: {} as { context: WizardContext; events: WizardEvent },
  context: initialContext,
  states: {
    projectInfo: {
      on: {
        NEXT: {
          target: 'techStackSelect',
          actions: assign(({ event }) => (event as Extract<WizardEvent, { type: 'NEXT' }>).data ?? {}),
        },
      },
    },
    techStackSelect: {
      on: {
        NEXT: [
          {
            guard: ({ context, event }) => {
              const data = (event as Extract<WizardEvent, { type: 'NEXT' }>).data ?? {}
              const tech = data.selectedTech ?? context.selectedTech
              return tech.length === 0
            },
            target: 'harnessConfig',
            actions: assign(({ event }) => (event as Extract<WizardEvent, { type: 'NEXT' }>).data ?? {}),
          },
          {
            target: 'detectTooling',
            actions: assign(({ event }) => (event as Extract<WizardEvent, { type: 'NEXT' }>).data ?? {}),
          },
        ],
      },
    },
    detectTooling: {
      on: {
        NEXT: {
          target: 'harnessConfig',
          actions: assign(({ event }) => (event as Extract<WizardEvent, { type: 'NEXT' }>).data ?? {}),
        },
        SKIP_DETECT: { target: 'harnessConfig' },
      },
    },
    harnessConfig: {
      on: {
        NEXT: {
          target: 'preview',
          actions: assign(({ event }) => (event as Extract<WizardEvent, { type: 'NEXT' }>).data ?? {}),
        },
      },
    },
    preview: {
      on: {
        CONFIRM: { target: 'apply' },
        BACK: { target: 'harnessConfig' },
      },
    },
    apply: {
      on: {
        DONE: { target: 'done' },
        ERROR: { target: 'done' },
      },
    },
    done: { type: 'final' },
  },
})
```

- [ ] **Step 4: Run — verify passes**

```bash
pnpm --filter @harness-kit/cli test
```

Expected: PASS — all 6 machine tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/harness-kit/src/wizard/index.ts packages/harness-kit/tests/wizard/index.test.ts
git commit -m "feat(wizard): add xstate machine with full state transitions"
```

---

## Task 2: Engine — Filesystem Detector

Pure functions for detecting tooling — testable without terminal.

**Files:**
- Create: `packages/harness-kit/src/engine/detector.ts`
- Create: `packages/harness-kit/tests/engine/detector.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// packages/harness-kit/tests/engine/detector.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { detectTooling } from '../../src/engine/detector.js'

let dir: string

beforeEach(async () => {
  dir = join(tmpdir(), `hk-detect-${Date.now()}`)
  await mkdir(dir, { recursive: true })
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('detectTooling', () => {
  it('detects tsconfig.json', async () => {
    await writeFile(join(dir, 'tsconfig.json'), '{}')
    const result = await detectTooling(dir, ['nextjs'])
    const ts = result.find((r) => r.label === 'tsconfig.json')
    expect(ts?.found).toBe(true)
  })

  it('reports ESLint missing when no eslint config', async () => {
    const result = await detectTooling(dir, ['nextjs'])
    const eslint = result.find((r) => r.label === 'ESLint')
    expect(eslint?.found).toBe(false)
    expect(eslint?.installCmd).toContain('eslint')
  })

  it('detects .eslintrc.json', async () => {
    await writeFile(join(dir, '.eslintrc.json'), '{}')
    const result = await detectTooling(dir, ['nextjs'])
    const eslint = result.find((r) => r.label === 'ESLint')
    expect(eslint?.found).toBe(true)
  })

  it('detects go.mod for Go projects', async () => {
    await writeFile(join(dir, 'go.mod'), 'module example.com/myapp\n\ngo 1.22')
    const result = await detectTooling(dir, ['go'])
    const gomod = result.find((r) => r.label === 'go.mod')
    expect(gomod?.found).toBe(true)
  })

  it('returns empty array when no tech selected', async () => {
    const result = await detectTooling(dir, [])
    expect(result).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run — verify fails**

```bash
pnpm --filter @harness-kit/cli test
```

Expected: FAIL — `Cannot find module '../../src/engine/detector.js'`

- [ ] **Step 3: Implement detector**

```ts
// packages/harness-kit/src/engine/detector.ts
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import type { DetectedIssue } from '../wizard/types.js'

type DetectionRule = {
  label: string
  files: string[]        // any of these present = found
  tech: string[]         // trigger when any of these tech selected
  installCmd?: string
}

const RULES: DetectionRule[] = [
  { label: 'tsconfig.json', files: ['tsconfig.json'], tech: ['nextjs', 'nuxt', 'sveltekit', 'react', 'vue', 'angular', 'vanilla-ts', 'node-express', 'node-fastify'] },
  { label: 'ESLint', files: ['.eslintrc', '.eslintrc.json', '.eslintrc.js', '.eslintrc.cjs', 'eslint.config.js', 'eslint.config.mjs'], tech: ['nextjs', 'nuxt', 'sveltekit', 'react', 'vue', 'angular', 'vanilla-ts'], installCmd: 'pnpm add -D eslint @typescript-eslint/eslint-plugin' },
  { label: 'Prettier', files: ['.prettierrc', '.prettierrc.json', '.prettierrc.js', 'prettier.config.js'], tech: ['nextjs', 'nuxt', 'sveltekit', 'react', 'vue', 'angular', 'vanilla-ts'], installCmd: 'pnpm add -D prettier' },
  { label: 'pyproject.toml', files: ['pyproject.toml'], tech: ['python-fastapi', 'python-django', 'langchain', 'langgraph', 'llamaindex', 'crewai'] },
  { label: 'go.mod', files: ['go.mod'], tech: ['go'] },
  { label: 'Dockerfile', files: ['Dockerfile'], tech: ['docker'] },
  { label: 'GitHub Actions', files: ['.github/workflows'], tech: ['github-actions'] },
]

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

export async function detectTooling(cwd: string, selectedTech: string[]): Promise<DetectedIssue[]> {
  if (selectedTech.length === 0) return []

  const results: DetectedIssue[] = []
  for (const rule of RULES) {
    if (!rule.tech.some((t) => selectedTech.includes(t))) continue
    const found = (await Promise.all(rule.files.map((f) => exists(join(cwd, f))))).some(Boolean)
    results.push({ label: rule.label, found, installCmd: rule.installCmd })
  }
  return results
}
```

- [ ] **Step 4: Run — verify passes**

```bash
pnpm --filter @harness-kit/cli test
```

Expected: PASS — all 5 detector tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/harness-kit/src/engine/detector.ts packages/harness-kit/tests/engine/detector.test.ts
git commit -m "feat(engine): add filesystem tooling detector"
```

---

## Task 3: Engine — Template Renderer

**Files:**
- Create: `packages/harness-kit/src/engine/template-renderer.ts`
- Create: `packages/harness-kit/tests/engine/template-renderer.test.ts`
- Create: `packages/harness-kit/templates/CLAUDE.md.hbs`
- Create: `packages/harness-kit/templates/AGENTS.md.hbs`
- Create: `packages/harness-kit/templates/harness.json.hbs`
- Create: `packages/harness-kit/templates/mcp.json.hbs`
- Create: `packages/harness-kit/templates/settings.json.hbs`
- Create: `packages/harness-kit/templates/llms.txt.hbs`

- [ ] **Step 1: Write failing tests**

```ts
// packages/harness-kit/tests/engine/template-renderer.test.ts
import { describe, it, expect } from 'vitest'
import { renderTemplate } from '../../src/engine/template-renderer.js'

const ctx = {
  projectName: 'my-app',
  projectPurpose: 'An e-commerce platform',
  projectUsers: 'Brand owners and shoppers',
  projectConstraints: 'Mobile-first. PCI-DSS.',
  selectedTech: ['nextjs', 'postgresql'],
  gitWorkflow: ['conventional-commits'],
  memory: 'file-based',
  docsAsCode: true,
  workflowPresets: ['tdd', 'spec-driven'],
  mcp: ['playwright', 'firecrawl'],
}

describe('renderTemplate', () => {
  it('renders CLAUDE.md.hbs with project name', async () => {
    const out = await renderTemplate('CLAUDE.md.hbs', ctx)
    expect(out).toContain('my-app')
    expect(out).toContain('An e-commerce platform')
  })

  it('renders harness.json.hbs with valid JSON', async () => {
    const out = await renderTemplate('harness.json.hbs', ctx)
    expect(() => JSON.parse(out)).not.toThrow()
    const parsed = JSON.parse(out)
    expect(parsed.version).toBe('1.0.0')
    expect(parsed.techStack).toContain('nextjs')
  })

  it('throws for unknown template', async () => {
    await expect(renderTemplate('nonexistent.hbs', ctx)).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Run — verify fails**

```bash
pnpm --filter @harness-kit/cli test
```

Expected: FAIL — `Cannot find module '../../src/engine/template-renderer.js'`

- [ ] **Step 3: Implement template renderer**

```ts
// packages/harness-kit/src/engine/template-renderer.ts
import Handlebars from 'handlebars'
import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const TEMPLATES_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../templates')

export async function renderTemplate(name: string, context: Record<string, unknown>): Promise<string> {
  const templatePath = join(TEMPLATES_DIR, name)
  let source: string
  try {
    source = await readFile(templatePath, 'utf-8')
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Template not found: ${name}`)
    }
    throw err
  }
  const template = Handlebars.compile(source)
  return template(context)
}
```

- [ ] **Step 4: Create Handlebars templates**

```handlebars
{{! templates/CLAUDE.md.hbs }}
# {{projectName}}

## Project

**Purpose:** {{projectPurpose}}
{{#if projectUsers}}
**Users:** {{projectUsers}}
{{/if}}
{{#if projectConstraints}}
**Constraints:** {{projectConstraints}}
{{/if}}

## Stack

{{#each selectedTech}}- {{this}}
{{/each}}

## Conventions

{{#if (includes gitWorkflow "conventional-commits")}}- Commits: Conventional Commits — invoke `git-conventional` skill before committing
{{/if}}
{{#if (includes workflowPresets "tdd")}}- TDD: write failing test → implement → pass → commit
{{/if}}
{{#if (includes workflowPresets "spec-driven")}}- Brainstorm and spec before implementation
{{/if}}

## Memory

{{#ifEqual memory "file-based"}}- Long-term memory: `.claude/memory/` — run `/memory-compact` at end of substantive sessions
{{/ifEqual}}
```

```handlebars
{{! templates/AGENTS.md.hbs }}
# {{projectName}} — Project Map

> Pointer map for AI agents. Keep this under ~100 lines.

## What This Does

{{projectPurpose}}

## Stack

{{#each selectedTech}}- `{{this}}`
{{/each}}

## Key Files

_Fill in as project grows: entry points, config, key modules._

## Docs

{{#if docsAsCode}}- Design: `docs/DESIGN.md`
- Decisions: `docs/design-docs/decisions/`
{{/if}}
```

```handlebars
{{! templates/harness.json.hbs }}
{
  "version": "1.0.0",
  "registry": "bundled",
  "techStack": [{{#each selectedTech}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
  "presets": [{{#each workflowPresets}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
  "modules": [{{#each modules}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
  "memory": "{{memory}}",
  "mcp": [{{#each mcp}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
  "aiGeneration": {{aiGenerationEnabled}}
}
```

> **Note:** `modules` array is built in `preview-apply.ts` before rendering — not computed in the template. Add this helper to `templateCtx` in preview-apply step:
>
> ```ts
> const modules: string[] = [
>   ...(ctx.gitWorkflow.includes('conventional-commits') ? ['rules/git-conventional'] : []),
>   ...(ctx.selectedTech.some(t => ['nextjs','react','vue','sveltekit','vanilla-ts'].includes(t)) ? ['rules/typescript'] : []),
>   ...(ctx.workflowPresets.includes('tdd') ? ['skills/tdd-workflow'] : []),
>   ...(ctx.workflowPresets.includes('spec-driven') ? ['skills/brainstorming'] : []),
>   ...(ctx.gitWorkflow.includes('pre-commit-hooks') ? ['hooks/pre-commit'] : []),
>   ...(ctx.workflowPresets.includes('quality-gates') ? ['hooks/quality-gate'] : []),
> ]
> const templateCtx = { ...ctx, mcp: allMcp, mcpConfigs: selectedManifests, modules, aiGenerationEnabled: willAiGenerate }
> ```

```handlebars
{{! templates/mcp.json.hbs }}
{
  "mcpServers": {
    {{#each mcpConfigs}}
    "{{name}}": {
      "command": "{{command}}",
      "args": [{{#each args}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}]{{#if env}},
      "env": {
        {{#each env}}"{{@key}}": "{{this}}"{{#unless @last}},{{/unless}}
        {{/each}}
      }{{/if}}
    }{{#unless @last}},{{/unless}}
    {{/each}}
  }
}
```

```handlebars
{{! templates/settings.json.hbs }}
{
  "permissions": {
    "allow": [],
    "deny": []
  }{{#if (includes workflowPresets "quality-gates")}},
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/quality-gate.sh"
          }
        ]
      }
    ]
  }{{/if}}
}
```

```handlebars
{{! templates/llms.txt.hbs }}
# {{projectName}}

> {{projectPurpose}}

## Docs Index

- CLAUDE.md — AI agent instructions and project context
- AGENTS.md — project map and key file pointers
{{#if docsAsCode}}- docs/DESIGN.md — technical design overview
- docs/design-docs/decisions/ — architecture decision records
{{/if}}
```

- [ ] **Step 5: Register Handlebars helpers**

Add helpers to `template-renderer.ts` before tests can pass:

```ts
// Add after imports in template-renderer.ts
Handlebars.registerHelper('includes', (arr: string[], val: string) =>
  Array.isArray(arr) && arr.includes(val)
)
Handlebars.registerHelper('ifEqual', function (
  this: unknown,
  a: string,
  b: string,
  options: Handlebars.HelperOptions
) {
  return a === b ? options.fn(this) : options.inverse(this)
})
```

- [ ] **Step 6: Run — verify passes**

```bash
pnpm --filter @harness-kit/cli test
```

Expected: PASS — all 3 template renderer tests green.

- [ ] **Step 7: Commit**

```bash
git add packages/harness-kit/src/engine/template-renderer.ts packages/harness-kit/templates/ packages/harness-kit/tests/engine/template-renderer.test.ts
git commit -m "feat(engine): add Handlebars template renderer with all templates"
```

---

## Task 4: Engine — AI Generator

**Files:**
- Create: `packages/harness-kit/src/engine/ai-generator.ts`
- Create: `packages/harness-kit/tests/engine/ai-generator.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// packages/harness-kit/tests/engine/ai-generator.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { detectApiKey } from '../../src/engine/ai-generator.js'

let dir: string

beforeEach(async () => {
  dir = join(tmpdir(), `hk-ai-${Date.now()}`)
  await mkdir(dir, { recursive: true })
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('detectApiKey', () => {
  it('returns undefined when no .env files', async () => {
    expect(await detectApiKey(dir)).toBeUndefined()
  })

  it('reads ANTHROPIC_API_KEY from .env.local', async () => {
    await writeFile(join(dir, '.env.local'), 'ANTHROPIC_API_KEY=sk-ant-test\n')
    expect(await detectApiKey(dir)).toBe('sk-ant-test')
  })

  it('reads ANTHROPIC_API_KEY from .env when .env.local absent', async () => {
    await writeFile(join(dir, '.env'), 'ANTHROPIC_API_KEY=sk-ant-env\n')
    expect(await detectApiKey(dir)).toBe('sk-ant-env')
  })

  it('prefers .env.local over .env', async () => {
    await writeFile(join(dir, '.env.local'), 'ANTHROPIC_API_KEY=sk-ant-local\n')
    await writeFile(join(dir, '.env'), 'ANTHROPIC_API_KEY=sk-ant-env\n')
    expect(await detectApiKey(dir)).toBe('sk-ant-local')
  })

  it('reads HARNESS_AI_API_KEY as fallback', async () => {
    await writeFile(join(dir, '.env.local'), 'HARNESS_AI_API_KEY=sk-custom\n')
    expect(await detectApiKey(dir)).toBe('sk-custom')
  })
})
```

- [ ] **Step 2: Run — verify fails**

```bash
pnpm --filter @harness-kit/cli test
```

Expected: FAIL — `Cannot find module '../../src/engine/ai-generator.js'`

- [ ] **Step 3: Implement ai-generator**

```ts
// packages/harness-kit/src/engine/ai-generator.ts
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import Anthropic from '@anthropic-ai/sdk'

function parseEnvKey(content: string, key: string): string | undefined {
  const match = content.match(new RegExp(`^${key}=(.+)$`, 'm'))
  return match?.[1]?.trim()
}

async function readEnvFile(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, 'utf-8')
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw err
  }
}

export async function detectApiKey(cwd: string): Promise<string | undefined> {
  const envLocal = await readEnvFile(join(cwd, '.env.local'))
  const envFile = await readEnvFile(join(cwd, '.env'))

  for (const content of [envLocal, envFile]) {
    if (!content) continue
    const key =
      parseEnvKey(content, 'ANTHROPIC_API_KEY') ??
      parseEnvKey(content, 'HARNESS_AI_API_KEY')
    if (key) return key
  }
  return undefined
}

export async function generateClaudeMd(
  apiKey: string,
  context: {
    projectName: string
    projectPurpose: string
    projectUsers: string
    projectConstraints: string
    selectedTech: string[]
    workflowPresets: string[]
  }
): Promise<string> {
  const client = new Anthropic({ apiKey })
  const model = process.env['HARNESS_AI_MODEL'] ?? 'claude-sonnet-4-6'

  const prompt = `You are writing the CLAUDE.md file for a software project. This file is the primary context document that an AI coding agent reads at the start of every session.

Project details:
- Name: ${context.projectName}
- Purpose: ${context.projectPurpose}
- Users: ${context.projectUsers || 'Not specified'}
- Constraints: ${context.projectConstraints || 'None specified'}
- Tech stack: ${context.selectedTech.join(', ')}
- Workflow presets: ${context.workflowPresets.join(', ')}

Write a focused CLAUDE.md (max 80 lines) that:
1. Explains what the project does and key technical decisions
2. Lists the tech stack concisely
3. States coding conventions relevant to this tech stack
4. Notes any constraints the agent must respect

Be specific and actionable. Do not pad with generic advice.`

  const message = await client.messages.create({
    model,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude')
  return block.text
}
```

- [ ] **Step 4: Run — verify passes**

```bash
pnpm --filter @harness-kit/cli test
```

Expected: PASS — all 5 api-key detection tests green. (`generateClaudeMd` not unit-tested — requires real API call; tested in integration smoke test).

- [ ] **Step 5: Commit**

```bash
git add packages/harness-kit/src/engine/ai-generator.ts packages/harness-kit/tests/engine/ai-generator.test.ts
git commit -m "feat(engine): add API key detector and Claude CLAUDE.md generator"
```

---

## Task 5: Engine — File Scaffolder

**Files:**
- Create: `packages/harness-kit/src/engine/scaffolder.ts`
- Create: `packages/harness-kit/tests/engine/scaffolder.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// packages/harness-kit/tests/engine/scaffolder.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { writeScaffoldFile, ScaffoldFile } from '../../src/engine/scaffolder.js'

let dir: string

beforeEach(async () => {
  dir = join(tmpdir(), `hk-scaffold-${Date.now()}`)
  await mkdir(dir, { recursive: true })
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('writeScaffoldFile', () => {
  it('writes new file', async () => {
    const file: ScaffoldFile = { relativePath: 'CLAUDE.md', content: '# Hello' }
    await writeScaffoldFile(dir, file, 'overwrite')
    expect(await readFile(join(dir, 'CLAUDE.md'), 'utf-8')).toBe('# Hello')
  })

  it('creates nested directories', async () => {
    const file: ScaffoldFile = { relativePath: '.claude/rules/typescript.md', content: '# TS Rules' }
    await writeScaffoldFile(dir, file, 'overwrite')
    expect(await readFile(join(dir, '.claude/rules/typescript.md'), 'utf-8')).toBe('# TS Rules')
  })

  it('overwrites existing file when conflict=overwrite', async () => {
    await writeFile(join(dir, 'CLAUDE.md'), 'old content')
    const file: ScaffoldFile = { relativePath: 'CLAUDE.md', content: 'new content' }
    await writeScaffoldFile(dir, file, 'overwrite')
    expect(await readFile(join(dir, 'CLAUDE.md'), 'utf-8')).toBe('new content')
  })

  it('skips existing file when conflict=skip', async () => {
    await writeFile(join(dir, 'CLAUDE.md'), 'original')
    const file: ScaffoldFile = { relativePath: 'CLAUDE.md', content: 'new content' }
    await writeScaffoldFile(dir, file, 'skip')
    expect(await readFile(join(dir, 'CLAUDE.md'), 'utf-8')).toBe('original')
  })
})
```

- [ ] **Step 2: Run — verify fails**

```bash
pnpm --filter @harness-kit/cli test
```

Expected: FAIL — `Cannot find module '../../src/engine/scaffolder.js'`

- [ ] **Step 3: Implement scaffolder**

```ts
// packages/harness-kit/src/engine/scaffolder.ts
import { writeFile, mkdir, access } from 'node:fs/promises'
import { join, dirname } from 'node:path'

export interface ScaffoldFile {
  relativePath: string
  content: string
}

export type ConflictStrategy = 'overwrite' | 'skip'

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

export async function writeScaffoldFile(
  cwd: string,
  file: ScaffoldFile,
  conflict: ConflictStrategy
): Promise<void> {
  const fullPath = join(cwd, file.relativePath)
  if (conflict === 'skip' && (await fileExists(fullPath))) return
  await mkdir(dirname(fullPath), { recursive: true })
  await writeFile(fullPath, file.content, 'utf-8')
}
```

- [ ] **Step 4: Run — verify passes**

```bash
pnpm --filter @harness-kit/cli test
```

Expected: PASS — all 4 scaffolder tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/harness-kit/src/engine/scaffolder.ts packages/harness-kit/tests/engine/scaffolder.test.ts
git commit -m "feat(engine): add file scaffolder with conflict resolution"
```

---

## Task 6: Wizard Steps (Terminal)

TUI steps cannot be unit tested with vitest. Implement all 3 steps; manual verification via integration smoke test in Task 7.

**Files:**
- Create: `packages/harness-kit/src/wizard/steps/project-info.ts`
- Create: `packages/harness-kit/src/wizard/steps/detect-tooling.ts`
- Create: `packages/harness-kit/src/wizard/steps/harness-config.ts`
- Create: `packages/harness-kit/src/wizard/steps/preview-apply.ts`

- [ ] **Step 1: Implement project-info step**

```ts
// packages/harness-kit/src/wizard/steps/project-info.ts
import * as p from '@clack/prompts'
import type { WizardContext } from '../types.js'

export async function stepProjectInfo(): Promise<Partial<WizardContext>> {
  p.intro('harness-kit init')

  const projectName = await p.text({
    message: 'Project name:',
    placeholder: 'my-app',
    validate: (v) => (v.trim().length === 0 ? 'Required' : undefined),
  })
  if (p.isCancel(projectName)) { p.cancel('Cancelled'); process.exit(0) }

  const projectPurpose = await p.text({
    message: 'What does this project do?',
    placeholder: 'An e-commerce platform for independent fashion brands',
    hint: 'Core purpose in 1-3 sentences — the agent references this every session',
    validate: (v) => (v.trim().length === 0 ? 'Required' : undefined),
  })
  if (p.isCancel(projectPurpose)) { p.cancel('Cancelled'); process.exit(0) }

  const projectUsers = await p.text({
    message: 'Who are the users / stakeholders? (optional)',
    placeholder: 'Brand owners and their customers',
    hint: 'End users, customers, internal teams',
  })
  if (p.isCancel(projectUsers)) { p.cancel('Cancelled'); process.exit(0) }

  const projectConstraints = await p.text({
    message: 'Key technical goals or constraints? (optional)',
    placeholder: 'Must be mobile-first. PCI-DSS compliant checkout.',
    hint: 'Performance targets, compliance, architecture decisions',
  })
  if (p.isCancel(projectConstraints)) { p.cancel('Cancelled'); process.exit(0) }

  return {
    projectName: String(projectName),
    projectPurpose: String(projectPurpose),
    projectUsers: projectUsers ? String(projectUsers) : '',
    projectConstraints: projectConstraints ? String(projectConstraints) : '',
  }
}
```

- [ ] **Step 2: Implement detect-tooling step**

```ts
// packages/harness-kit/src/wizard/steps/detect-tooling.ts
import * as p from '@clack/prompts'
import { execa } from 'execa'
import { detectTooling } from '../../engine/detector.js'
import type { WizardContext } from '../types.js'

export async function stepDetectTooling(ctx: WizardContext): Promise<Partial<WizardContext>> {
  const spinner = p.spinner()
  spinner.start('Scanning your project...')
  const issues = await detectTooling(process.cwd(), ctx.selectedTech)
  spinner.stop('Scan complete')

  for (const issue of issues) {
    if (issue.found) p.log.success(issue.label)
    else p.log.warn(`${issue.label} not configured`)
  }

  const installable = issues.filter((i) => !i.found && i.installCmd)
  if (installable.length === 0) return { detectedIssues: issues }

  const toInstall = await p.multiselect({
    message: 'Install missing tools?',
    options: installable.map((i) => ({ label: i.label, value: i.label, hint: i.installCmd })),
    required: false,
  })
  if (p.isCancel(toInstall)) { p.cancel('Cancelled'); process.exit(0) }

  const selected = toInstall as string[]
  if (selected.length > 0) {
    const spinner2 = p.spinner()
    spinner2.start('Installing...')
    for (const label of selected) {
      const issue = installable.find((i) => i.label === label)
      if (!issue?.installCmd) continue
      try {
        await execa(issue.installCmd, { shell: true, cwd: process.cwd() })
      } catch (err) {
        p.log.warn(`Failed to install ${label}: ${(err as Error).message}`)
      }
    }
    spinner2.stop('Done')
  }

  return { detectedIssues: issues, installSelected: selected.length > 0 }
}
```

- [ ] **Step 3: Implement harness-config step**

```ts
// packages/harness-kit/src/wizard/steps/harness-config.ts
import * as p from '@clack/prompts'
import type { WizardContext } from '../types.js'

export async function stepHarnessConfig(ctx: WizardContext): Promise<Partial<WizardContext>> {
  const gitWorkflow = await p.multiselect({
    message: 'Git workflow:',
    options: [
      { value: 'conventional-commits', label: 'Conventional Commits', hint: 'commit format + semantic versioning', selected: true },
      { value: 'branch-strategy', label: 'Branch strategy', hint: 'feature/fix/chore naming, PR < 400 lines', selected: true },
      { value: 'pre-commit-hooks', label: 'Pre-commit hooks', hint: 'lint + typecheck + test before commit', selected: true },
      { value: 'commit-signing', label: 'Commit signing', hint: 'GPG / SSH' },
    ],
    required: false,
  })
  if (p.isCancel(gitWorkflow)) { p.cancel('Cancelled'); process.exit(0) }

  const memory = await p.select({
    message: 'Long-term memory:',
    options: [
      { value: 'file-based', label: 'File-based', hint: '.claude/memory/ — local, zero dependency' },
      { value: 'mem0', label: 'Mem0 MCP', hint: 'cloud, 90% token reduction (needs API key)' },
      { value: 'obsidian', label: 'Obsidian MCP', hint: 'sync with Obsidian vault' },
      { value: 'none', label: 'None' },
    ],
  })
  if (p.isCancel(memory)) { p.cancel('Cancelled'); process.exit(0) }

  const docsAsCode = await p.confirm({
    message: 'Docs as code? (AGENTS.md, spec template, ADR structure, llms.txt)',
    initialValue: true,
  })
  if (p.isCancel(docsAsCode)) { p.cancel('Cancelled'); process.exit(0) }

  const workflowPresets = await p.multiselect({
    message: 'Workflow presets:',
    options: [
      { value: 'spec-driven', label: 'Spec-driven', hint: 'brainstorm → spec → plan → implement', selected: true },
      { value: 'tdd', label: 'TDD', hint: 'failing test before implementation', selected: true },
      { value: 'planning-first', label: 'Planning-first', hint: 'draft plan → review → implement', selected: true },
      { value: 'quality-gates', label: 'Quality gates', hint: 'tests pass before done (Stop hook)', selected: true },
      { value: 'parallel-agents', label: 'Parallel agents', hint: 'subagents for independent tasks' },
      { value: 'systematic-debugging', label: 'Systematic debugging', hint: 'reproduce → isolate → verify → fix' },
      { value: 'code-review-gates', label: 'Code review gates', hint: 'review before commit/merge' },
      { value: 'security-review', label: 'Security review', hint: 'validate bash, block dangerous ops' },
      { value: 'context-discipline', label: 'Context discipline', hint: 'fresh session rules, task decomp guide' },
    ],
    required: false,
  })
  if (p.isCancel(workflowPresets)) { p.cancel('Cancelled'); process.exit(0) }

  const browserTools = await p.multiselect({
    message: 'Browser automation:',
    options: [
      { value: 'playwright', label: 'Playwright MCP', hint: 'accessibility snapshots, E2E test gen', selected: true },
      { value: 'agent-browser', label: 'agent-browser', hint: 'Vercel Labs, Chrome DevTools Protocol' },
      { value: 'stagehand', label: 'Stagehand', hint: 'AI-native, natural language commands' },
    ],
    required: false,
  })
  if (p.isCancel(browserTools)) { p.cancel('Cancelled'); process.exit(0) }

  const webSearch = await p.multiselect({
    message: 'Web search:',
    options: [
      { value: 'tavily', label: 'Tavily MCP', hint: 'real-time search + extract, free tier', selected: true },
      { value: 'exa', label: 'Exa MCP', hint: 'semantic search, code/GitHub optimized' },
      { value: 'brave-search', label: 'Brave Search MCP', hint: 'privacy-focused' },
    ],
    required: false,
  })
  if (p.isCancel(webSearch)) { p.cancel('Cancelled'); process.exit(0) }

  const webCrawl = await p.multiselect({
    message: 'Web crawl & scrape:',
    options: [
      { value: 'firecrawl', label: 'Firecrawl MCP', hint: 'HTML→markdown, JS-enabled', selected: true },
      { value: 'crawl4ai', label: 'Crawl4AI MCP', hint: 'open-source, self-hosted Docker' },
      { value: 'spider', label: 'Spider.cloud MCP', hint: 'Rust, anti-bot, full-site' },
      { value: 'apify', label: 'Apify MCP', hint: '1000+ pre-built actors' },
      { value: 'bright-data', label: 'Bright Data MCP', hint: 'residential proxies, anti-bot' },
    ],
    required: false,
  })
  if (p.isCancel(webCrawl)) { p.cancel('Cancelled'); process.exit(0) }

  const libraryDocs = await p.multiselect({
    message: 'Library docs:',
    options: [
      { value: 'context7', label: 'Context7 MCP', hint: 'version-specific docs for any package', selected: true },
    ],
    required: false,
  })
  if (p.isCancel(libraryDocs)) { p.cancel('Cancelled'); process.exit(0) }

  const docConversion = await p.multiselect({
    message: 'Document conversion:',
    options: [
      { value: 'markitdown', label: 'MarkItDown', hint: 'PDF/Word/HTML/audio → markdown (Python, local)' },
    ],
    required: false,
  })
  if (p.isCancel(docConversion)) { p.cancel('Cancelled'); process.exit(0) }

  const otherMcp = await p.multiselect({
    message: 'Other MCP integrations:',
    options: [
      { value: 'github', label: 'GitHub MCP', selected: true },
      { value: 'supabase', label: 'Supabase MCP' },
      { value: 'vercel', label: 'Vercel MCP' },
    ],
    required: false,
  })
  if (p.isCancel(otherMcp)) { p.cancel('Cancelled'); process.exit(0) }

  return {
    gitWorkflow: gitWorkflow as string[],
    memory: memory as WizardContext['memory'],
    docsAsCode: Boolean(docsAsCode),
    workflowPresets: workflowPresets as string[],
    browserTools: browserTools as string[],
    webSearch: webSearch as string[],
    webCrawl: webCrawl as string[],
    libraryDocs: libraryDocs as string[],
    docConversion: docConversion as string[],
    otherMcp: otherMcp as string[],
  }
}
```

- [ ] **Step 4: Implement preview-apply step**

```ts
// packages/harness-kit/src/wizard/steps/preview-apply.ts
import * as p from '@clack/prompts'
import { Listr } from 'listr2'
import { join, dirname, fileURLToPath } from 'node:path'
import { writeScaffoldFile } from '../../engine/scaffolder.js'
import { renderTemplate } from '../../engine/template-renderer.js'
import { detectApiKey, generateClaudeMd } from '../../engine/ai-generator.js'
import { loadMcpManifests } from '../../registry/loader.js'
import type { WizardContext } from '../types.js'
import type { ScaffoldFile, ConflictStrategy } from '../../engine/scaffolder.js'

const REGISTRY_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../registry')

function buildMcpList(ctx: WizardContext): string[] {
  return [...ctx.browserTools, ...ctx.webSearch, ...ctx.webCrawl, ...ctx.libraryDocs, ...ctx.otherMcp]
}

export async function stepPreviewApply(ctx: WizardContext): Promise<Partial<WizardContext>> {
  const cwd = process.cwd()
  const allMcp = buildMcpList(ctx)
  const apiKey = await detectApiKey(cwd)
  const willAiGenerate = Boolean(apiKey)

  p.note(
    [
      '── Core ──────────────────────────────────────────────',
      `  ✦ CLAUDE.md  ${willAiGenerate ? '(AI-generated)' : '(template)'}`,
      '  ✦ AGENTS.md',
      '  ✦ harness.json',
      '  ✦ .env.local',
      '  ✦ llms.txt',
      '── Claude config ─────────────────────────────────────',
      '  ✦ .claude/settings.json',
      '  ✦ .claude/rules/typescript.md  (if TS selected)',
      '── MCP config ────────────────────────────────────────',
      `  ✦ .mcp.json  (${allMcp.join(', ')})`,
      ctx.docsAsCode ? '── Docs ──────────────────────────────────────────────' : '',
      ctx.docsAsCode ? '  ✦ docs/DESIGN.md' : '',
    ].filter(Boolean).join('\n'),
    'Will scaffold:'
  )

  const confirm = await p.confirm({ message: 'Apply?', initialValue: true })
  if (p.isCancel(confirm) || !confirm) { p.cancel('Aborted'); process.exit(0) }

  // Collect all files to write
  const mcpManifests = await loadMcpManifests(join(REGISTRY_DIR, 'mcp'))
  const selectedManifests = mcpManifests.filter((m) => allMcp.includes(m.name))
  const templateCtx = { ...ctx, mcp: allMcp, mcpConfigs: selectedManifests, aiGenerationEnabled: willAiGenerate }

  const files: ScaffoldFile[] = [
    { relativePath: 'AGENTS.md', content: await renderTemplate('AGENTS.md.hbs', templateCtx) },
    { relativePath: 'harness.json', content: await renderTemplate('harness.json.hbs', templateCtx) },
    { relativePath: '.env.local', content: '' },
    { relativePath: 'llms.txt', content: await renderTemplate('llms.txt.hbs', templateCtx) },
    { relativePath: '.claude/settings.json', content: await renderTemplate('settings.json.hbs', templateCtx) },
    ...(allMcp.length > 0 ? [{ relativePath: '.mcp.json', content: await renderTemplate('mcp.json.hbs', templateCtx) }] : []),
    ...(ctx.docsAsCode ? [{ relativePath: 'docs/DESIGN.md', content: `# ${ctx.projectName} — Design\n\n${ctx.projectPurpose}\n` }] : []),
  ]

  const conflictMap = new Map<string, ConflictStrategy>()

  const tasks = new Listr([
    {
      title: willAiGenerate ? 'Generating CLAUDE.md with Claude claude-sonnet-4-6...' : 'Writing CLAUDE.md from template...',
      task: async () => {
        const content = willAiGenerate
          ? await generateClaudeMd(apiKey!, templateCtx)
          : await renderTemplate('CLAUDE.md.hbs', templateCtx)
        files.unshift({ relativePath: 'CLAUDE.md', content })
      },
    },
    {
      title: 'Writing files...',
      task: async () => {
        for (const file of files) {
          const strategy = conflictMap.get(file.relativePath) ?? 'overwrite'
          await writeScaffoldFile(cwd, file, strategy)
        }
      },
    },
  ])

  await tasks.run()

  p.outro(`harness-kit initialized.\nRun: ${chalk.blue('harness-kit status')} to see your harness.`)

  return { aiGenerationEnabled: willAiGenerate }
}
```

- [ ] **Step 5: Build and verify TypeScript compiles**

```bash
pnpm --filter @harness-kit/cli build
```

Expected: PASS — no type errors.

- [ ] **Step 6: Commit**

```bash
git add packages/harness-kit/src/wizard/steps/
git commit -m "feat(wizard): add all wizard step implementations"
```

---

## Task 7: runWizard() + Full CLI Wiring

**Files:**
- Modify: `packages/harness-kit/src/wizard/index.ts` — add `runWizard()`
- Modify: `packages/harness-kit/src/index.ts` — wire `init` to `runWizard()`

- [ ] **Step 1: Add runWizard() to wizard/index.ts**

Append to `packages/harness-kit/src/wizard/index.ts`:

```ts
import { createActor } from 'xstate'
import { stepProjectInfo } from './steps/project-info.js'
import { stepDetectTooling } from './steps/detect-tooling.js'
import { stepHarnessConfig } from './steps/harness-config.js'
import { stepPreviewApply } from './steps/preview-apply.js'
import { selectTechStack } from './steps/tech-stack-select.js'
import { TECH_OPTIONS } from './tech-options.js'

export async function runWizard(): Promise<void> {
  const actor = createActor(wizardMachine)
  actor.start()

  while (!actor.getSnapshot().done) {
    const state = actor.getSnapshot().value as string
    const ctx = actor.getSnapshot().context

    try {
      switch (state) {
        case 'projectInfo': {
          const data = await stepProjectInfo()
          actor.send({ type: 'NEXT', data })
          break
        }
        case 'techStackSelect': {
          const selectedTech = await selectTechStack(TECH_OPTIONS)
          actor.send({ type: 'NEXT', data: { selectedTech } })
          break
        }
        case 'detectTooling': {
          const data = await stepDetectTooling(ctx)
          actor.send({ type: 'NEXT', data })
          break
        }
        case 'harnessConfig': {
          const data = await stepHarnessConfig(ctx)
          actor.send({ type: 'NEXT', data })
          break
        }
        case 'preview': {
          await stepPreviewApply(actor.getSnapshot().context)
          actor.send({ type: 'CONFIRM' })
          break
        }
        case 'apply': {
          actor.send({ type: 'DONE' })
          break
        }
        default:
          actor.send({ type: 'DONE' })
      }
    } catch (err) {
      actor.send({ type: 'ERROR', error: err as Error })
      throw err
    }
  }
}
```

- [ ] **Step 2: Wire CLI**

```ts
// packages/harness-kit/src/index.ts
import { Command } from 'commander'
import { HARNESS_KIT_VERSION } from '@harness-kit/core'
import { runWizard } from './wizard/index.js'

export function createCli(): Command {
  const program = new Command()
  program
    .name('harness-kit')
    .description('Scaffold AI agent harness environments')
    .version(HARNESS_KIT_VERSION)

  program
    .command('init')
    .description('Initialize harness in current project')
    .action(async () => {
      await runWizard()
    })

  return program
}

const isMain =
  process.argv[1] != null &&
  new URL(import.meta.url).pathname === process.argv[1]

if (isMain) {
  createCli().parseAsync()
}
```

- [ ] **Step 3: Run all tests**

```bash
pnpm --filter @harness-kit/cli test
```

Expected: PASS — all tests green (machine transitions + loader + filter + detector + template-renderer + scaffolder + ai-generator key detection).

- [ ] **Step 4: Build**

```bash
pnpm --filter @harness-kit/cli build
```

Expected: PASS — no type errors.

- [ ] **Step 5: Full integration smoke test**

In a temporary directory:

```bash
mkdir /tmp/hk-test-project && cd /tmp/hk-test-project
git init
node /home/liamlee/t0lab/harness-kit/packages/harness-kit/dist/index.js init
```

Walk through the full wizard:
1. Enter project name + description
2. Search and select tech stack (type "next", Space, Enter)
3. Review detected issues
4. Configure harness (accept defaults or change)
5. Preview scaffold — confirm Apply
6. Verify files created: `CLAUDE.md`, `AGENTS.md`, `harness.json`, `.mcp.json`, `.claude/settings.json`, `llms.txt`

- [ ] **Step 6: Commit**

```bash
git add packages/harness-kit/src/
git commit -m "feat(wizard): wire runWizard() actor loop and harness-kit init command"
```

---

## Done — Plan B Complete

Full `harness-kit init` flow working end-to-end:
- xstate machine drives the wizard loop
- All 5 steps implemented (project-info, tech-stack-select, detect-tooling, harness-config, preview-apply)
- AI generation when `ANTHROPIC_API_KEY` found, Handlebars fallback otherwise
- Files written to target project with conflict resolution
- All units tested; integration verified by smoke test

**Next:** Plan C (future) — `harness-kit add`, `list`, `status` commands + registry module loading.
