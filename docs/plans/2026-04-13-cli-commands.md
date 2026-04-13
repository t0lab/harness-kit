# CLI Commands (list, add, status) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `list`, `add`, and `status` commands to the `harness-kit` CLI, backed by two new engine modules, with `init` extracted from `index.ts` into its own file.

**Architecture:** Thin command handlers in `src/commands/` orchestrate engine modules (`harness-reader.ts`, `artifact-installer.ts`). Each command file exports a `register*Command(program)` function. `index.ts` only imports and registers — no inline logic.

**Tech Stack:** TypeScript 5, Node 22 ESM, Commander (CLI), @clack/prompts (interactive UI), chalk (output), vitest (tests), @harness-kit/core (types).

**Spec:** `docs/specs/2026-04-13-cli-commands-design.md`

---

## File Map

**Create:**
- `packages/harness-kit/src/engine/harness-reader.ts` — read/write/check `harness.json`
- `packages/harness-kit/src/engine/artifact-installer.ts` — install MCP artifacts into `.mcp.json`
- `packages/harness-kit/src/commands/init.ts` — thin wrapper for `runWizard()`
- `packages/harness-kit/src/commands/list.ts` — list command
- `packages/harness-kit/src/commands/add.ts` — add command
- `packages/harness-kit/src/commands/status.ts` — status command
- `packages/harness-kit/tests/engine/harness-reader.test.ts`
- `packages/harness-kit/tests/engine/artifact-installer.test.ts`
- `packages/harness-kit/tests/commands/list.test.ts`
- `packages/harness-kit/tests/commands/add.test.ts`
- `packages/harness-kit/tests/commands/status.test.ts`

**Modify:**
- `packages/core/src/types.ts` — add `bundles?: string[]` to `HarnessConfig`
- `packages/harness-kit/templates/harness.json.hbs` — add `"bundles": []`
- `packages/harness-kit/src/wizard/steps/preview-apply.ts` — add `bundles: []` to templateCtx
- `packages/harness-kit/src/index.ts` — remove inline init, import all register functions
- `packages/harness-kit/tests/cli.test.ts` — verify all 4 commands registered

---

## Task 1: Add `bundles` to HarnessConfig + template

**Files:**
- Modify: `packages/core/src/types.ts`
- Modify: `packages/harness-kit/templates/harness.json.hbs`
- Modify: `packages/harness-kit/src/wizard/steps/preview-apply.ts:117-123`

- [ ] **Step 1: Update HarnessConfig type**

In `packages/core/src/types.ts`, add `bundles?: string[]` after `mcp: string[]`:

```ts
export interface HarnessConfig {
  version: string
  registry: string
  techStack: string[]
  presets: string[]
  modules: string[]
  memory: string
  mcp: string[]
  bundles?: string[]    // ← ADD THIS LINE
  aiGeneration: boolean
}
```

- [ ] **Step 2: Update harness.json.hbs template**

In `packages/harness-kit/templates/harness.json.hbs`, add `"bundles": []` before `"aiGeneration"`:

```handlebars
{
  "version": "1.0.0",
  "registry": "bundled",
  "techStack": [{{#each selectedTech}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
  "presets": [{{#each workflowPresets}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
  "modules": [{{#each modules}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
  "memory": "{{memory}}",
  "mcp": [{{#each mcp}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
  "bundles": [],
  "aiGeneration": {{aiGenerationEnabled}}
}
```

- [ ] **Step 3: Update preview-apply.ts templateCtx**

In `packages/harness-kit/src/wizard/steps/preview-apply.ts`, add `bundles: []` to the `templateCtx` object (around line 118):

```ts
const templateCtx = {
  ...ctx,
  mcp: mcpConfigs.map((m) => m.name),
  mcpConfigs,
  modules,
  bundles: [],           // ← ADD THIS
  aiGenerationEnabled: false,
}
```

- [ ] **Step 4: Build and verify**

```bash
pnpm build
```

Expected: `packages/core` and `packages/harness-kit` both build with `ESM ✓` and `DTS ✓`. No errors.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/types.ts packages/harness-kit/templates/harness.json.hbs packages/harness-kit/src/wizard/steps/preview-apply.ts
git commit -m "feat(core): add bundles field to HarnessConfig"
```

---

## Task 2: harness-reader engine module

**Files:**
- Create: `packages/harness-kit/src/engine/harness-reader.ts`
- Create: `packages/harness-kit/tests/engine/harness-reader.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/harness-kit/tests/engine/harness-reader.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  harnessExists,
  readHarnessConfig,
  writeHarnessConfig,
} from '../../src/engine/harness-reader.js'

let dir: string

beforeEach(async () => {
  dir = join(tmpdir(), `hk-reader-${Date.now()}`)
  await mkdir(dir, { recursive: true })
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

const BASE_CONFIG = {
  version: '1.0.0',
  registry: 'bundled',
  techStack: [],
  presets: [],
  modules: [],
  memory: 'local-memory',
  mcp: [],
  bundles: [],
  aiGeneration: false,
}

describe('harnessExists', () => {
  it('returns false when harness.json absent', async () => {
    expect(await harnessExists(dir)).toBe(false)
  })

  it('returns true when harness.json present', async () => {
    await writeFile(join(dir, 'harness.json'), JSON.stringify(BASE_CONFIG))
    expect(await harnessExists(dir)).toBe(true)
  })
})

describe('readHarnessConfig', () => {
  it('reads and parses valid harness.json', async () => {
    await writeFile(join(dir, 'harness.json'), JSON.stringify(BASE_CONFIG))
    const config = await readHarnessConfig(dir)
    expect(config.version).toBe('1.0.0')
    expect(config.bundles).toEqual([])
  })

  it('normalizes missing bundles field to []', async () => {
    const legacy = { ...BASE_CONFIG, bundles: undefined }
    await writeFile(join(dir, 'harness.json'), JSON.stringify(legacy))
    const config = await readHarnessConfig(dir)
    expect(config.bundles).toEqual([])
  })

  it('throws when harness.json is missing', async () => {
    await expect(readHarnessConfig(dir)).rejects.toThrow()
  })
})

describe('writeHarnessConfig', () => {
  it('writes config and can be read back', async () => {
    await writeHarnessConfig(dir, BASE_CONFIG)
    const config = await readHarnessConfig(dir)
    expect(config).toEqual(BASE_CONFIG)
  })

  it('pretty-prints JSON (2-space indent)', async () => {
    await writeHarnessConfig(dir, BASE_CONFIG)
    const raw = await readFile(join(dir, 'harness.json'), 'utf-8')
    expect(raw).toContain('  "version"')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @harness-kit/cli test tests/engine/harness-reader.test.ts
```

Expected: FAIL — `Cannot find module '../../src/engine/harness-reader.js'`

- [ ] **Step 3: Implement harness-reader.ts**

Create `packages/harness-kit/src/engine/harness-reader.ts`:

```ts
import { access, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { HarnessConfig } from '@harness-kit/core'

export async function harnessExists(cwd: string): Promise<boolean> {
  try {
    await access(join(cwd, 'harness.json'))
    return true
  } catch {
    return false
  }
}

export async function readHarnessConfig(cwd: string): Promise<HarnessConfig> {
  const raw = await readFile(join(cwd, 'harness.json'), 'utf-8')
  const parsed = JSON.parse(raw) as HarnessConfig
  // Normalize missing bundles field for projects initialized before this field existed
  return { ...parsed, bundles: parsed.bundles ?? [] }
}

export async function writeHarnessConfig(cwd: string, config: HarnessConfig): Promise<void> {
  await writeFile(join(cwd, 'harness.json'), JSON.stringify(config, null, 2), 'utf-8')
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm --filter @harness-kit/cli test tests/engine/harness-reader.test.ts
```

Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add packages/harness-kit/src/engine/harness-reader.ts packages/harness-kit/tests/engine/harness-reader.test.ts
git commit -m "feat(engine): add harness-reader module"
```

---

## Task 3: artifact-installer engine module

**Files:**
- Create: `packages/harness-kit/src/engine/artifact-installer.ts`
- Create: `packages/harness-kit/tests/engine/artifact-installer.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/harness-kit/tests/engine/artifact-installer.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { installBundle } from '../../src/engine/artifact-installer.js'
import type { BundleManifest } from '@harness-kit/core'

let dir: string

beforeEach(async () => {
  dir = join(tmpdir(), `hk-installer-${Date.now()}`)
  await mkdir(dir, { recursive: true })
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

const MCP_BUNDLE: BundleManifest = {
  name: 'test-mcp',
  description: 'test',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'search',
  common: {
    artifacts: [{
      type: 'mcp',
      command: 'npx',
      args: ['-y', 'test-pkg'],
      env: { TEST_KEY: '${TEST_KEY}' },
    }],
    env: [{ key: 'TEST_KEY', description: 'test key', required: true }],
  },
  roles: { search: { artifacts: [] } },
}

const NO_ARTIFACT_BUNDLE: BundleManifest = {
  name: 'tdd',
  description: 'TDD workflow',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'workflow-preset',
  common: { artifacts: [] },
  roles: { 'workflow-preset': { artifacts: [] } },
}

const TOOL_BUNDLE: BundleManifest = {
  name: 'eslint',
  description: 'ESLint',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'dev-integration',
  common: { artifacts: [{ type: 'tool', installCmd: 'pnpm add -D eslint' }] },
  roles: { 'dev-integration': { artifacts: [] } },
}

describe('installBundle', () => {
  it('creates .mcp.json for mcp artifact', async () => {
    const result = await installBundle(dir, MCP_BUNDLE, 'search')
    expect(result.mcpUpdated).toBe(true)
    const raw = JSON.parse(await readFile(join(dir, '.mcp.json'), 'utf-8'))
    expect(raw.mcpServers['test-mcp']).toEqual({
      command: 'npx',
      args: ['-y', 'test-pkg'],
      env: { TEST_KEY: '${TEST_KEY}' },
    })
  })

  it('merges into existing .mcp.json without overwriting other entries', async () => {
    const existing = { mcpServers: { other: { command: 'other', args: [] } } }
    await writeFile(join(dir, '.mcp.json'), JSON.stringify(existing))
    await installBundle(dir, MCP_BUNDLE, 'search')
    const raw = JSON.parse(await readFile(join(dir, '.mcp.json'), 'utf-8'))
    expect(Object.keys(raw.mcpServers)).toContain('other')
    expect(Object.keys(raw.mcpServers)).toContain('test-mcp')
  })

  it('re-installing same bundle is idempotent (replaces entry, no duplicates)', async () => {
    await installBundle(dir, MCP_BUNDLE, 'search')
    await installBundle(dir, MCP_BUNDLE, 'search')
    const raw = JSON.parse(await readFile(join(dir, '.mcp.json'), 'utf-8'))
    expect(Object.keys(raw.mcpServers)).toHaveLength(1)
  })

  it('returns mcpUpdated: false for bundle with no mcp artifacts', async () => {
    const result = await installBundle(dir, NO_ARTIFACT_BUNDLE, 'workflow-preset')
    expect(result.mcpUpdated).toBe(false)
    expect(result.warnings).toHaveLength(0)
  })

  it('returns warning with installCmd for tool artifact', async () => {
    const result = await installBundle(dir, TOOL_BUNDLE, 'dev-integration')
    expect(result.warnings).toContain('Run: pnpm add -D eslint')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @harness-kit/cli test tests/engine/artifact-installer.test.ts
```

Expected: FAIL — `Cannot find module '../../src/engine/artifact-installer.js'`

- [ ] **Step 3: Implement artifact-installer.ts**

Create `packages/harness-kit/src/engine/artifact-installer.ts`:

```ts
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { BundleManifest } from '@harness-kit/core'

interface McpServerEntry {
  command: string
  args: string[]
  env?: Record<string, string>
}

interface McpJson {
  mcpServers: Record<string, McpServerEntry>
}

export interface InstallResult {
  mcpUpdated: boolean
  warnings: string[]
}

async function readMcpJson(cwd: string): Promise<McpJson> {
  try {
    const raw = await readFile(join(cwd, '.mcp.json'), 'utf-8')
    return JSON.parse(raw) as McpJson
  } catch {
    return { mcpServers: {} }
  }
}

async function writeMcpJson(cwd: string, data: McpJson): Promise<void> {
  await writeFile(join(cwd, '.mcp.json'), JSON.stringify(data, null, 2), 'utf-8')
}

export async function installBundle(
  cwd: string,
  bundle: BundleManifest,
  role: string
): Promise<InstallResult> {
  const allArtifacts = [
    ...bundle.common.artifacts,
    ...(bundle.roles[role as keyof typeof bundle.roles]?.artifacts ?? []),
  ]

  const result: InstallResult = { mcpUpdated: false, warnings: [] }

  const mcpArtifacts = allArtifacts.filter((a) => a.type === 'mcp')
  if (mcpArtifacts.length > 0) {
    const mcpJson = await readMcpJson(cwd)
    for (const artifact of mcpArtifacts) {
      if (artifact.type !== 'mcp') continue
      const entry: McpServerEntry = { command: artifact.command, args: artifact.args }
      if (artifact.env) entry.env = artifact.env
      mcpJson.mcpServers[bundle.name] = entry
    }
    await writeMcpJson(cwd, mcpJson)
    result.mcpUpdated = true
  }

  for (const artifact of allArtifacts) {
    if (artifact.type === 'tool') {
      result.warnings.push(`Run: ${artifact.installCmd}`)
    } else if (artifact.type !== 'mcp') {
      result.warnings.push(`artifact type '${artifact.type}' not yet supported — add manually`)
    }
  }

  return result
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm --filter @harness-kit/cli test tests/engine/artifact-installer.test.ts
```

Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add packages/harness-kit/src/engine/artifact-installer.ts packages/harness-kit/tests/engine/artifact-installer.test.ts
git commit -m "feat(engine): add artifact-installer module"
```

---

## Task 4: `list` command

**Files:**
- Create: `packages/harness-kit/src/commands/list.ts`
- Create: `packages/harness-kit/tests/commands/list.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/harness-kit/tests/commands/list.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  groupBundlesByDefaultRole,
  filterByInstalled,
} from '../../src/commands/list.js'
import type { BundleManifest } from '@harness-kit/core'

function makeBundle(name: string, defaultRole: string, experimental = false): BundleManifest {
  return {
    name,
    description: `${name} description`,
    version: '1.0.0',
    experimental,
    defaultRole,
    common: { artifacts: [] },
    roles: {},
  }
}

const BUNDLES = [
  makeBundle('tavily', 'search'),
  makeBundle('exa', 'search'),
  makeBundle('tdd', 'workflow-preset'),
]

describe('groupBundlesByDefaultRole', () => {
  it('groups bundles by defaultRole', () => {
    const groups = groupBundlesByDefaultRole(BUNDLES)
    expect(groups.get('search')?.map((b) => b.name)).toEqual(
      expect.arrayContaining(['tavily', 'exa'])
    )
    expect(groups.get('workflow-preset')?.map((b) => b.name)).toContain('tdd')
  })

  it('each bundle appears exactly once', () => {
    const groups = groupBundlesByDefaultRole(BUNDLES)
    const total = [...groups.values()].flat().length
    expect(total).toBe(BUNDLES.length)
  })

  it('returns empty map for empty input', () => {
    expect(groupBundlesByDefaultRole([])).toEqual(new Map())
  })

  it('multi-role bundle appears only in its defaultRole group', () => {
    // A bundle that supports multiple roles still shows once, under defaultRole
    const bundle = makeBundle('mem0', 'memory')
    const groups = groupBundlesByDefaultRole([bundle])
    expect(groups.size).toBe(1)
    expect(groups.has('memory')).toBe(true)
  })
})

describe('filterByInstalled', () => {
  it('returns only bundles whose names are in the installed set', () => {
    const installed = new Set(['tavily'])
    const result = filterByInstalled(BUNDLES, installed)
    expect(result.map((b) => b.name)).toEqual(['tavily'])
  })

  it('returns empty array when installed set is empty', () => {
    expect(filterByInstalled(BUNDLES, new Set())).toHaveLength(0)
  })

  it('returns all bundles when all are installed', () => {
    const installed = new Set(BUNDLES.map((b) => b.name))
    expect(filterByInstalled(BUNDLES, installed)).toHaveLength(BUNDLES.length)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @harness-kit/cli test tests/commands/list.test.ts
```

Expected: FAIL — `Cannot find module '../../src/commands/list.js'`

- [ ] **Step 3: Implement list.ts**

Create `packages/harness-kit/src/commands/list.ts`:

```ts
import chalk from 'chalk'
import { getAllBundles } from '../registry/index.js'
import { harnessExists, readHarnessConfig } from '../engine/harness-reader.js'
import type { BundleManifest, BundleCategory } from '@harness-kit/core'
import type { Command } from 'commander'

const BUNDLE_CATEGORIES: BundleCategory[] = [
  'git-workflow', 'workflow-preset', 'memory', 'browser', 'search', 'scrape',
  'library-docs', 'doc-conversion', 'code-execution', 'dev-integration',
  'cloud-infra', 'observability', 'mcp-tool',
]

export function groupBundlesByDefaultRole(
  bundles: BundleManifest[]
): Map<string, BundleManifest[]> {
  const groups = new Map<string, BundleManifest[]>()
  for (const bundle of bundles) {
    const existing = groups.get(bundle.defaultRole) ?? []
    existing.push(bundle)
    groups.set(bundle.defaultRole, existing)
  }
  return groups
}

export function filterByInstalled(
  bundles: BundleManifest[],
  installed: Set<string>
): BundleManifest[] {
  return bundles.filter((b) => installed.has(b.name))
}

export function registerListCommand(program: Command): void {
  program
    .command('list')
    .description('List available bundles')
    .option('--category <cat>', 'filter by category')
    .option('--installed', 'show only installed bundles')
    .action(async (opts: { category?: string; installed?: boolean }) => {
      const cwd = process.cwd()

      if (opts.category && !BUNDLE_CATEGORIES.includes(opts.category as BundleCategory)) {
        console.error(`Unknown category: ${opts.category}`)
        console.error(`Valid categories: ${BUNDLE_CATEGORIES.join(', ')}`)
        process.exit(1)
      }

      if (opts.installed && !(await harnessExists(cwd))) {
        console.error('harness.json not found. Run harness-kit init first.')
        process.exit(1)
      }

      const installedNames = new Set<string>()
      if (await harnessExists(cwd)) {
        const config = await readHarnessConfig(cwd)
        for (const name of config.bundles ?? []) installedNames.add(name)
      }

      // Filter by defaultRole — consistent with grouping (bundles appear once, under defaultRole)
      const all = getAllBundles()
      const byCategory = opts.category
        ? all.filter((b) => b.defaultRole === opts.category)
        : all

      const filtered = opts.installed ? filterByInstalled(byCategory, installedNames) : byCategory

      if (opts.installed && filtered.length === 0) {
        console.log('No bundles tracked — use harness-kit add <bundle> or re-run init.')
        return
      }

      const groups = groupBundlesByDefaultRole(filtered)

      for (const [category, members] of [...groups.entries()].sort()) {
        console.log(`\n${chalk.bold(category)} (${members.length})`)
        for (const b of [...members].sort((a, c) => a.name.localeCompare(c.name))) {
          const marker = installedNames.has(b.name) ? chalk.green('✓') : ' '
          const tag = b.experimental ? chalk.yellow(' [experimental]') : ''
          console.log(`  ${b.name.padEnd(22)} ${marker}  ${b.description}${tag}`)
        }
      }
    })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm --filter @harness-kit/cli test tests/commands/list.test.ts
```

Expected: PASS — 7 tests

- [ ] **Step 5: Commit**

```bash
git add packages/harness-kit/src/commands/list.ts packages/harness-kit/tests/commands/list.test.ts
git commit -m "feat(commands): add list command"
```

---

## Task 5: `add` command

**Files:**
- Create: `packages/harness-kit/src/commands/add.ts`
- Create: `packages/harness-kit/tests/commands/add.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/harness-kit/tests/commands/add.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { executeAdd } from '../../src/commands/add.js'

let dir: string

beforeEach(async () => {
  dir = join(tmpdir(), `hk-add-${Date.now()}`)
  await mkdir(dir, { recursive: true })
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

const BASE_CONFIG = {
  version: '1.0.0',
  registry: 'bundled',
  techStack: [],
  presets: [],
  modules: [],
  memory: 'local-memory',
  mcp: [],
  bundles: [],
  aiGeneration: false,
}

async function writeHarness(config: object): Promise<void> {
  await writeFile(join(dir, 'harness.json'), JSON.stringify(config))
}

describe('executeAdd', () => {
  it('throws NOT_INITIALIZED when harness.json missing', async () => {
    await expect(executeAdd(dir, 'tavily', {})).rejects.toThrow('NOT_INITIALIZED')
  })

  it('throws UNKNOWN_BUNDLE for unregistered bundle name', async () => {
    await writeHarness(BASE_CONFIG)
    await expect(executeAdd(dir, 'nonexistent-xyz', {})).rejects.toThrow('UNKNOWN_BUNDLE')
  })

  it('throws INVALID_ROLE when role not in bundle.roles', async () => {
    await writeHarness(BASE_CONFIG)
    await expect(executeAdd(dir, 'tavily', { role: 'cloud-infra' })).rejects.toThrow('INVALID_ROLE')
  })

  it('adds MCP bundle: updates .mcp.json and harness.json', async () => {
    await writeHarness(BASE_CONFIG)
    await executeAdd(dir, 'tavily', {})

    const harness = JSON.parse(await readFile(join(dir, 'harness.json'), 'utf-8'))
    expect(harness.bundles).toContain('tavily')
    expect(harness.mcp).toContain('tavily')

    const mcp = JSON.parse(await readFile(join(dir, '.mcp.json'), 'utf-8'))
    expect(mcp.mcpServers).toHaveProperty('tavily')
  })

  it('re-adding same bundle keeps bundles[] length unchanged (no duplicates)', async () => {
    await writeHarness(BASE_CONFIG)
    await executeAdd(dir, 'tavily', {})
    await executeAdd(dir, 'tavily', {})

    const harness = JSON.parse(await readFile(join(dir, 'harness.json'), 'utf-8'))
    expect(harness.bundles.filter((n: string) => n === 'tavily')).toHaveLength(1)
  })

  it('adds non-MCP bundle: updates harness.json bundles[], does not touch .mcp.json', async () => {
    await writeHarness(BASE_CONFIG)
    await executeAdd(dir, 'tdd', {})

    const harness = JSON.parse(await readFile(join(dir, 'harness.json'), 'utf-8'))
    expect(harness.bundles).toContain('tdd')
    expect(harness.mcp).not.toContain('tdd')

    // .mcp.json should not be created
    await expect(readFile(join(dir, '.mcp.json'), 'utf-8')).rejects.toThrow()
  })

  it('uses default role when no --role given', async () => {
    await writeHarness(BASE_CONFIG)
    const result = await executeAdd(dir, 'tavily', {})
    expect(result.role).toBe('search') // tavily's defaultRole
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @harness-kit/cli test tests/commands/add.test.ts
```

Expected: FAIL — `Cannot find module '../../src/commands/add.js'`

- [ ] **Step 3: Implement add.ts**

Create `packages/harness-kit/src/commands/add.ts`:

```ts
import * as p from '@clack/prompts'
import chalk from 'chalk'
import { getBundle } from '../registry/index.js'
import { harnessExists, readHarnessConfig, writeHarnessConfig } from '../engine/harness-reader.js'
import { installBundle } from '../engine/artifact-installer.js'
import type { BundleCategory, EnvVar } from '@harness-kit/core'
import type { Command } from 'commander'

export interface AddResult {
  bundleName: string
  role: string
  mcpUpdated: boolean
  warnings: string[]
  envVars: EnvVar[]
}

/**
 * Core add logic — testable without Commander or interactive prompts.
 * Throws with a message prefixed by the error code (e.g. "NOT_INITIALIZED: ...").
 */
export async function executeAdd(
  cwd: string,
  bundleName: string,
  opts: { role?: string }
): Promise<AddResult> {
  if (!(await harnessExists(cwd))) {
    throw new Error('NOT_INITIALIZED: harness.json not found. Run harness-kit init first.')
  }

  let bundle
  try {
    bundle = getBundle(bundleName)
  } catch {
    throw new Error(`UNKNOWN_BUNDLE: ${bundleName} not found. Run harness-kit list to see available.`)
  }

  const role = opts.role ?? bundle.defaultRole
  if (opts.role && !(opts.role in bundle.roles)) {
    const valid = Object.keys(bundle.roles).join(', ')
    throw new Error(`INVALID_ROLE: ${bundleName} does not support role ${opts.role}. Valid roles: ${valid}`)
  }

  const config = await readHarnessConfig(cwd)
  const alreadyInstalled = (config.bundles ?? []).includes(bundleName)

  const result = await installBundle(cwd, bundle, role)

  const newBundles = alreadyInstalled
    ? (config.bundles ?? [])
    : [...(config.bundles ?? []), bundleName]

  // BundleCategory cast: bundle.defaultRole is always a BundleCategory value (enforced by manifests)
  const hasMcp =
    bundle.common.artifacts.some((a) => a.type === 'mcp') ||
    (bundle.roles[role as BundleCategory]?.artifacts ?? []).some((a) => a.type === 'mcp')

  const newMcp =
    hasMcp && !config.mcp.includes(bundleName) ? [...config.mcp, bundleName] : config.mcp

  await writeHarnessConfig(cwd, { ...config, bundles: newBundles, mcp: newMcp })

  const envVars: EnvVar[] = [
    ...(bundle.common.env ?? []),
    // BundleCategory cast: same rationale as above
    ...(bundle.roles[role as BundleCategory]?.env ?? []),
  ]

  return { bundleName, role, mcpUpdated: result.mcpUpdated, warnings: result.warnings, envVars }
}

export function registerAddCommand(program: Command): void {
  program
    .command('add <bundle>')
    .description('Add a bundle to the current harness')
    .option('--role <role>', 'override default role')
    .action(async (bundleName: string, opts: { role?: string }) => {
      const cwd = process.cwd()

      let result: AddResult
      try {
        // Check if already installed before calling executeAdd, to handle re-install confirm
        const alreadyInstalled =
          (await harnessExists(cwd)) &&
          (await readHarnessConfig(cwd)).bundles?.includes(bundleName)

        if (alreadyInstalled) {
          const confirm = await p.confirm({
            message: `${bundleName} already added. Re-install?`,
            initialValue: false,
          })
          if (p.isCancel(confirm) || !confirm) {
            p.cancel('Cancelled')
            process.exit(0)
          }
        }

        result = await executeAdd(cwd, bundleName, opts)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        // Strip error code prefix for user-facing output
        console.error(msg.replace(/^[A-Z_]+: /, ''))
        process.exit(1)
      }

      console.log(`\n${chalk.green('✓')}  Added ${result.bundleName} (${result.role})`)
      if (result.mcpUpdated) console.log('   .mcp.json updated')

      if (result.envVars.length > 0) {
        console.log('\n   Env vars needed:')
        for (const e of result.envVars) {
          const req = e.required ? chalk.red('[required]') : '[optional]'
          console.log(`     ${e.key.padEnd(24)} — ${e.description}  ${req}`)
        }
        console.log('\n   Set in your shell or .env before running Claude.')
      }

      for (const w of result.warnings) {
        console.log(`   ${chalk.yellow('⚠')} ${w}`)
      }
    })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm --filter @harness-kit/cli test tests/commands/add.test.ts
```

Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add packages/harness-kit/src/commands/add.ts packages/harness-kit/tests/commands/add.test.ts
git commit -m "feat(commands): add 'add' command"
```

---

## Task 6: `status` command

**Files:**
- Create: `packages/harness-kit/src/commands/status.ts`
- Create: `packages/harness-kit/tests/commands/status.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/harness-kit/tests/commands/status.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { auditHarness } from '../../src/commands/status.js'
import { getBundle } from '../../src/registry/index.js'

let dir: string

beforeEach(async () => {
  dir = join(tmpdir(), `hk-status-${Date.now()}`)
  await mkdir(dir, { recursive: true })
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

const BASE_CONFIG = {
  version: '1.0.0',
  registry: 'bundled',
  techStack: [],
  presets: [],
  modules: [],
  memory: 'local-memory',
  mcp: [],
  bundles: [],
  aiGeneration: false,
}

async function writeHarness(config: object): Promise<void> {
  await writeFile(join(dir, 'harness.json'), JSON.stringify(config))
}

describe('auditHarness', () => {
  it('returns empty audit for project with no bundles', async () => {
    await writeHarness(BASE_CONFIG)
    const result = await auditHarness(dir)
    expect(result.bundles).toHaveLength(0)
    expect(result.envVars).toHaveLength(0)
  })

  it('detects drift when mcp bundle missing from .mcp.json', async () => {
    await writeHarness({ ...BASE_CONFIG, bundles: ['tavily'], mcp: ['tavily'] })
    // No .mcp.json written
    const result = await auditHarness(dir)
    expect(result.bundles[0]?.drift).toBe(true)
  })

  it('no drift when mcp bundle present in .mcp.json', async () => {
    await writeHarness({ ...BASE_CONFIG, bundles: ['tavily'], mcp: ['tavily'] })
    await writeFile(
      join(dir, '.mcp.json'),
      JSON.stringify({ mcpServers: { tavily: {} } })
    )
    const result = await auditHarness(dir)
    expect(result.bundles[0]?.drift).toBe(false)
  })

  it('non-mcp bundle never shows drift', async () => {
    await writeHarness({ ...BASE_CONFIG, bundles: ['tdd'], mcp: [] })
    const result = await auditHarness(dir)
    expect(result.bundles[0]?.drift).toBe(false)
  })

  it('detects missing config file', async () => {
    await writeHarness(BASE_CONFIG)
    const result = await auditHarness(dir)
    expect(result.files.find((f) => f.path === 'CLAUDE.md')?.exists).toBe(false)
    expect(result.files.find((f) => f.path === 'harness.json')?.exists).toBe(true)
  })

  it('reports env vars for installed bundles based on actual manifest data', async () => {
    await writeHarness({ ...BASE_CONFIG, bundles: ['tavily'], mcp: ['tavily'] })
    const result = await auditHarness(dir)
    // Derive expected env vars from registry, not hardcoded keys
    const tavilyEnv = getBundle('tavily').common.env ?? []
    expect(result.envVars).toHaveLength(tavilyEnv.length)
    expect(result.envVars.every((e) => e.bundleName === 'tavily')).toBe(true)
  })

  it('handles legacy harness.json without bundles field gracefully', async () => {
    const legacy = { ...BASE_CONFIG, bundles: undefined }
    await writeHarness(legacy)
    const result = await auditHarness(dir)
    expect(result.bundles).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @harness-kit/cli test tests/commands/status.test.ts
```

Expected: FAIL — `Cannot find module '../../src/commands/status.js'`

- [ ] **Step 3: Implement status.ts**

Create `packages/harness-kit/src/commands/status.ts`:

```ts
import chalk from 'chalk'
import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { harnessExists, readHarnessConfig } from '../engine/harness-reader.js'
import { getBundle } from '../registry/index.js'
import type { BundleCategory } from '@harness-kit/core'
import type { Command } from 'commander'

const CORE_FILES = [
  'CLAUDE.md',
  'AGENTS.md',
  'harness.json',
  '.mcp.json',
  '.claude/settings.json',
]

interface McpJson {
  mcpServers: Record<string, unknown>
}

async function readMcpJsonKeys(cwd: string): Promise<Set<string>> {
  try {
    const raw = await readFile(join(cwd, '.mcp.json'), 'utf-8')
    const data = JSON.parse(raw) as McpJson
    return new Set(Object.keys(data.mcpServers ?? {}))
  } catch {
    return new Set()
  }
}

export interface BundleAudit {
  name: string
  category: string
  hasMcp: boolean
  drift: boolean
}

export interface FileAudit {
  path: string
  exists: boolean
}

export interface EnvAudit {
  key: string
  set: boolean
  bundleName: string
  required: boolean
}

export interface AuditResult {
  bundles: BundleAudit[]
  files: FileAudit[]
  envVars: EnvAudit[]
}

export async function auditHarness(cwd: string): Promise<AuditResult> {
  const config = await readHarnessConfig(cwd)
  const mcpKeys = await readMcpJsonKeys(cwd)

  const bundles: BundleAudit[] = []
  for (const name of config.bundles ?? []) {
    let bundle
    try {
      bundle = getBundle(name)
    } catch {
      continue
    }
    const hasMcp = config.mcp.includes(name)
    const drift = hasMcp && !mcpKeys.has(name)
    bundles.push({ name, category: bundle.defaultRole, hasMcp, drift })
  }

  const files: FileAudit[] = []
  for (const f of CORE_FILES) {
    let exists = false
    try {
      await access(join(cwd, f))
      exists = true
    } catch { /* file absent */ }
    files.push({ path: f, exists })
  }

  // Collect env vars from common + role-specific entries for each installed bundle
  const envVars: EnvAudit[] = []
  for (const name of config.bundles ?? []) {
    let bundle
    try {
      bundle = getBundle(name)
    } catch {
      continue
    }
    // BundleCategory cast: bundle.defaultRole is always a BundleCategory value
    const roleEnv = bundle.roles[bundle.defaultRole as BundleCategory]?.env ?? []
    const allEnv = [...(bundle.common.env ?? []), ...roleEnv]
    for (const e of allEnv) {
      envVars.push({
        key: e.key,
        set: process.env[e.key] !== undefined,
        bundleName: name,
        required: e.required,
      })
    }
  }

  return { bundles, files, envVars }
}

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Audit harness health')
    .action(async () => {
      const cwd = process.cwd()

      if (!(await harnessExists(cwd))) {
        console.error(`${chalk.red('✗')} harness.json not found. Run harness-kit init first.`)
        process.exit(1)
      }

      const result = await auditHarness(cwd)

      console.log(`\nharness-kit — ${cwd}\n`)

      console.log(
        chalk.bold(`── Installed bundles (${result.bundles.length}) ──────────────────────────`)
      )
      for (const b of result.bundles) {
        const icon = b.drift ? chalk.red('✗') : chalk.green('✓')
        const mcp = b.hasMcp ? '  mcp' : ''
        const drift = b.drift ? chalk.red('  — missing from .mcp.json [drift]') : ''
        console.log(`  ${icon} ${b.name.padEnd(20)} ${b.category.padEnd(20)}${mcp}${drift}`)
      }

      console.log(`\n${chalk.bold('── Config files ───────────────────────────────────')}`)
      for (const f of result.files) {
        const icon = f.exists ? chalk.green('✓') : chalk.red('✗')
        const missing = f.exists ? '' : chalk.red('  — missing')
        console.log(`  ${icon} ${f.path}${missing}`)
      }

      if (result.envVars.length > 0) {
        console.log(`\n${chalk.bold('── Env vars ───────────────────────────────────────')}`)
        for (const e of result.envVars) {
          const icon = e.set ? chalk.green('✓') : chalk.red('✗')
          const status = e.set ? '' : chalk.red('  — not set') + `  (${e.bundleName})`
          console.log(`  ${icon} ${e.key.padEnd(28)}${status}`)
        }
      }

      const driftCount = result.bundles.filter((b) => b.drift).length
      const missingFiles = result.files.filter((f) => !f.exists).length
      const unsetVars = result.envVars.filter((e) => !e.set).length

      console.log(`\n${chalk.bold('── Summary ────────────────────────────────────────')}`)
      if (driftCount === 0 && missingFiles === 0 && unsetVars === 0) {
        console.log(`  ${chalk.green('✓')} All good`)
      } else {
        const parts: string[] = []
        if (driftCount > 0) parts.push(chalk.red(`${driftCount} drift`))
        if (unsetVars > 0) parts.push(chalk.yellow(`${unsetVars} env var${unsetVars > 1 ? 's' : ''} unset`))
        if (missingFiles > 0) parts.push(chalk.red(`${missingFiles} file${missingFiles > 1 ? 's' : ''} missing`))
        console.log(`  ${parts.join('  ·  ')}`)
      }

      if (driftCount > 0 || missingFiles > 0 || unsetVars > 0) {
        process.exit(1)
      }
    })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm --filter @harness-kit/cli test tests/commands/status.test.ts
```

Expected: PASS — 7 tests

- [ ] **Step 5: Commit**

```bash
git add packages/harness-kit/src/commands/status.ts packages/harness-kit/tests/commands/status.test.ts
git commit -m "feat(commands): add status command with full audit"
```

---

## Task 7: Extract init + wire all commands

**Files:**
- Create: `packages/harness-kit/src/commands/init.ts`
- Modify: `packages/harness-kit/src/index.ts`
- Modify: `packages/harness-kit/tests/cli.test.ts`

- [ ] **Step 1: Create src/commands/init.ts**

```ts
import { runWizard } from '../wizard/index.js'
import type { Command } from 'commander'

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize harness in current project')
    .action(async () => {
      await runWizard()
    })
}
```

- [ ] **Step 2: Update src/index.ts**

Replace the entire file:

```ts
import { Command } from 'commander'
import { HARNESS_KIT_VERSION } from '@harness-kit/core'
import { registerInitCommand } from './commands/init.js'
import { registerListCommand } from './commands/list.js'
import { registerAddCommand } from './commands/add.js'
import { registerStatusCommand } from './commands/status.js'

export function createCli(): Command {
  const program = new Command()
  program
    .name('harness-kit')
    .description('Scaffold AI agent harness environments')
    .version(HARNESS_KIT_VERSION)

  registerInitCommand(program)
  registerListCommand(program)
  registerAddCommand(program)
  registerStatusCommand(program)

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

- [ ] **Step 3: Update tests/cli.test.ts**

Replace the file:

```ts
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

  it('registers init command', () => {
    const names = createCli().commands.map((c) => c.name())
    expect(names).toContain('init')
  })

  it('registers list command', () => {
    const names = createCli().commands.map((c) => c.name())
    expect(names).toContain('list')
  })

  it('registers add command', () => {
    const names = createCli().commands.map((c) => c.name())
    expect(names).toContain('add')
  })

  it('registers status command', () => {
    const names = createCli().commands.map((c) => c.name())
    expect(names).toContain('status')
  })
})
```

- [ ] **Step 4: Run full test suite**

```bash
pnpm --filter @harness-kit/cli test
```

Expected: All tests pass.

- [ ] **Step 5: Build**

```bash
pnpm build
```

Expected: Both packages build cleanly, no errors.

- [ ] **Step 6: Smoke test**

```bash
node packages/harness-kit/dist/index.js --help
node packages/harness-kit/dist/index.js list
node packages/harness-kit/dist/index.js list --category search
```

Expected:
- `--help` shows: init, list, add, status
- `list` prints all bundles grouped by `defaultRole`
- `list --category search` prints only search bundles

- [ ] **Step 7: Commit**

```bash
git add packages/harness-kit/src/commands/init.ts packages/harness-kit/src/index.ts packages/harness-kit/tests/cli.test.ts
git commit -m "refactor(cli): extract init command, register all commands in index"
```

---

## Final verification

- [ ] Run full test suite from root:

```bash
pnpm test
```

Expected: All tests pass.

- [ ] Verify build from root:

```bash
pnpm build
```

Expected: Clean build, no errors.
