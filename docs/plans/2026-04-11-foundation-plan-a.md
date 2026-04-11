# harness-kit Foundation (Plan A) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the foundation layer for `harness-kit init`: shared types, registry loader, MCP manifest files, and the `SearchableMultiselect` TUI component.

**Architecture:** Types define the shared data model used across wizard and registry. The registry loader reads `manifest.json` from `registry/mcp/*/` at runtime. `SearchableMultiselect` extends `@clack/core`'s `Prompt` base class — filter logic is extracted as a pure function for testability; the TUI wrapper handles raw terminal I/O.

**Tech Stack:** TypeScript 5, Node 22, `@clack/core` ^0.3.4, `xstate` ^5.18.0, vitest

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `packages/harness-kit/package.json` | Modify | Add xstate, @clack/core deps |
| `packages/harness-kit/src/wizard/types.ts` | Create | WizardContext, WizardEvent, TechOption |
| `packages/harness-kit/src/registry/types.ts` | Create | McpManifest interface |
| `packages/harness-kit/src/registry/loader.ts` | Create | Load + parse manifest.json files |
| `packages/harness-kit/src/wizard/tech-options.ts` | Create | Full TECH_OPTIONS constant |
| `packages/harness-kit/src/wizard/filter.ts` | Create | Pure filterOptions() function |
| `packages/harness-kit/src/wizard/steps/tech-stack-select.ts` | Create | SearchableMultiselect TUI component |
| `packages/harness-kit/tests/registry/loader.test.ts` | Create | Registry loader unit tests |
| `packages/harness-kit/tests/wizard/filter.test.ts` | Create | filterOptions() unit tests |
| `packages/harness-kit/registry/mcp/*/manifest.json` | Create | 15 MCP manifest files |

---

## Task 1: Add Dependencies

**Files:**
- Modify: `packages/harness-kit/package.json`

- [ ] **Step 1: Add xstate and @clack/core to dependencies**

Edit `packages/harness-kit/package.json` — add to `"dependencies"`:

```json
"@clack/core": "^0.3.4",
"xstate": "^5.18.0"
```

- [ ] **Step 2: Install**

```bash
cd /home/liamlee/t0lab/harness-kit
pnpm install
```

Expected: no errors, `node_modules/@clack/core` and `node_modules/xstate` present.

- [ ] **Step 3: Verify types available**

```bash
pnpm --filter @harness-kit/cli build
```

Expected: build succeeds (no new errors from the added deps).

---

## Task 2: Shared Types

**Files:**
- Create: `packages/harness-kit/src/wizard/types.ts`
- Create: `packages/harness-kit/src/registry/types.ts`

- [ ] **Step 1: Create wizard types**

```ts
// packages/harness-kit/src/wizard/types.ts

export interface TechOption {
  id: string          // e.g. 'nextjs', 'python-fastapi'
  label: string       // e.g. 'Next.js'
  hint: string        // e.g. 'fullstack React framework'
  category: string    // e.g. 'Web Frameworks'
  tags: string[]      // e.g. ['react', 'typescript', 'fullstack']
}

export interface WizardContext {
  projectName: string
  projectPurpose: string
  projectUsers: string
  projectConstraints: string
  selectedTech: string[]
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
  aiGenerationEnabled: boolean
}

export interface DetectedIssue {
  label: string     // e.g. 'ESLint not configured'
  found: boolean
  installCmd?: string  // e.g. 'pnpm add -D eslint'
}

export type WizardEvent =
  | { type: 'ENTER' }
  | { type: 'NEXT'; data: Partial<WizardContext> }
  | { type: 'BACK' }
  | { type: 'CONFIRM' }
  | { type: 'SKIP_DETECT' }
  | { type: 'DONE' }
  | { type: 'ERROR'; error: Error }
```

- [ ] **Step 2: Create registry types**

```ts
// packages/harness-kit/src/registry/types.ts

export interface McpManifest {
  name: string
  type: 'mcp'
  description: string
  version: string
  command: string
  args: string[]
  env?: Record<string, string>
}
```

- [ ] **Step 3: Verify types compile**

```bash
pnpm --filter @harness-kit/cli build
```

Expected: PASS, no type errors.

---

## Task 3: Registry Loader

**Files:**
- Create: `packages/harness-kit/src/registry/loader.ts`
- Create: `packages/harness-kit/tests/registry/loader.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// packages/harness-kit/tests/registry/loader.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { loadMcpManifests } from '../../src/registry/loader.js'

let tmpDir: string

beforeEach(async () => {
  tmpDir = join(tmpdir(), `hk-test-${Date.now()}`)
  await mkdir(join(tmpDir, 'playwright'), { recursive: true })
  await mkdir(join(tmpDir, 'firecrawl'), { recursive: true })
  await writeFile(
    join(tmpDir, 'playwright', 'manifest.json'),
    JSON.stringify({
      name: 'playwright',
      type: 'mcp',
      description: 'Browser automation',
      version: '1.0.0',
      command: 'npx',
      args: ['@playwright/mcp@latest'],
    })
  )
  await writeFile(
    join(tmpDir, 'firecrawl', 'manifest.json'),
    JSON.stringify({
      name: 'firecrawl',
      type: 'mcp',
      description: 'Web scraping',
      version: '1.0.0',
      command: 'npx',
      args: ['-y', 'firecrawl-mcp'],
      env: { FIRECRAWL_API_KEY: '${FIRECRAWL_API_KEY}' },
    })
  )
})

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true })
})

describe('loadMcpManifests', () => {
  it('loads all manifests from directory', async () => {
    const manifests = await loadMcpManifests(tmpDir)
    expect(manifests).toHaveLength(2)
    expect(manifests.map((m) => m.name).sort()).toEqual(['firecrawl', 'playwright'])
  })

  it('returns manifest fields correctly', async () => {
    const manifests = await loadMcpManifests(tmpDir)
    const pw = manifests.find((m) => m.name === 'playwright')
    expect(pw).toMatchObject({
      name: 'playwright',
      type: 'mcp',
      command: 'npx',
      args: ['@playwright/mcp@latest'],
    })
  })

  it('returns empty array for empty directory', async () => {
    const emptyDir = join(tmpdir(), `hk-empty-${Date.now()}`)
    await mkdir(emptyDir, { recursive: true })
    const manifests = await loadMcpManifests(emptyDir)
    expect(manifests).toHaveLength(0)
    await rm(emptyDir, { recursive: true })
  })

  it('skips directories without manifest.json', async () => {
    await mkdir(join(tmpDir, 'no-manifest'), { recursive: true })
    const manifests = await loadMcpManifests(tmpDir)
    expect(manifests).toHaveLength(2) // still only 2
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
pnpm --filter @harness-kit/cli test
```

Expected: FAIL — `Cannot find module '../../src/registry/loader.js'`

- [ ] **Step 3: Implement loader**

```ts
// packages/harness-kit/src/registry/loader.ts
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { McpManifest } from './types.js'

export async function loadMcpManifests(mcpDir: string): Promise<McpManifest[]> {
  let entries: string[]
  try {
    entries = await readdir(mcpDir)
  } catch {
    return []
  }

  const manifests: McpManifest[] = []
  for (const entry of entries) {
    const manifestPath = join(mcpDir, entry, 'manifest.json')
    try {
      const raw = await readFile(manifestPath, 'utf-8')
      manifests.push(JSON.parse(raw) as McpManifest)
    } catch (err: unknown) {
      // skip only if file doesn't exist; re-throw parse errors
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
    }
  }
  return manifests
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
pnpm --filter @harness-kit/cli test
```

Expected: PASS — all 4 loader tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/harness-kit/src/registry/ packages/harness-kit/tests/registry/
git commit -m "feat(registry): add McpManifest type and manifest loader"
```

---

## Task 4: MCP Manifest Files

**Files:**
- Create: `packages/harness-kit/registry/mcp/*/manifest.json` (14 files)

No tests — these are static data files. Correctness verified by Task 3 loader tests using real files in Task 5.

- [ ] **Step 1: Create registry/mcp/ directory structure and manifests**

Create each file below exactly:

```json
// registry/mcp/playwright/manifest.json
{
  "name": "playwright",
  "type": "mcp",
  "description": "Browser automation — accessibility snapshots, E2E test generation",
  "version": "1.0.0",
  "command": "npx",
  "args": ["@playwright/mcp@latest"]
}
```

```json
// registry/mcp/agent-browser/manifest.json
{
  "name": "agent-browser",
  "type": "mcp",
  "description": "Vercel Labs — persistent browser sessions via Chrome DevTools Protocol",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@vercel-labs/agent-browser-mcp"]
}
```

```json
// registry/mcp/stagehand/manifest.json
{
  "name": "stagehand",
  "type": "mcp",
  "description": "AI-native browser automation — natural language commands, Browserbase",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@browserbasehq/stagehand-mcp"],
  "env": {
    "BROWSERBASE_API_KEY": "${BROWSERBASE_API_KEY}",
    "BROWSERBASE_PROJECT_ID": "${BROWSERBASE_PROJECT_ID}"
  }
}
```

```json
// registry/mcp/tavily/manifest.json
{
  "name": "tavily",
  "type": "mcp",
  "description": "Real-time web search + content extraction in one call",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "tavily-mcp@0.1.4"],
  "env": {
    "TAVILY_API_KEY": "${TAVILY_API_KEY}"
  }
}
```

```json
// registry/mcp/exa/manifest.json
{
  "name": "exa",
  "type": "mcp",
  "description": "Semantic search optimized for code, GitHub, and documentation",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "exa-mcp-server"],
  "env": {
    "EXA_API_KEY": "${EXA_API_KEY}"
  }
}
```

```json
// registry/mcp/brave-search/manifest.json
{
  "name": "brave-search",
  "type": "mcp",
  "description": "Privacy-focused web search",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-brave-search"],
  "env": {
    "BRAVE_API_KEY": "${BRAVE_API_KEY}"
  }
}
```

```json
// registry/mcp/firecrawl/manifest.json
{
  "name": "firecrawl",
  "type": "mcp",
  "description": "HTML to markdown, JS-enabled scraping, managed service",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "firecrawl-mcp"],
  "env": {
    "FIRECRAWL_API_KEY": "${FIRECRAWL_API_KEY}"
  }
}
```

```json
// registry/mcp/crawl4ai/manifest.json
{
  "name": "crawl4ai",
  "type": "mcp",
  "description": "Open-source self-hosted crawler — Docker, 62k stars",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "crawl4ai-mcp"]
}
```

```json
// registry/mcp/spider/manifest.json
{
  "name": "spider",
  "type": "mcp",
  "description": "Rust-based crawler — anti-bot protection, full-site crawl",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@spider-cloud/spider-mcp"],
  "env": {
    "SPIDER_API_KEY": "${SPIDER_API_KEY}"
  }
}
```

```json
// registry/mcp/apify/manifest.json
{
  "name": "apify",
  "type": "mcp",
  "description": "1000+ pre-built actors for Amazon, LinkedIn, and more",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "apify-mcp-server"],
  "env": {
    "APIFY_TOKEN": "${APIFY_TOKEN}"
  }
}
```

```json
// registry/mcp/bright-data/manifest.json
{
  "name": "bright-data",
  "type": "mcp",
  "description": "Residential proxies — bypass anti-bot protection",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "brightdata-mcp"],
  "env": {
    "BRIGHTDATA_API_KEY": "${BRIGHTDATA_API_KEY}"
  }
}
```

```json
// registry/mcp/context7/manifest.json
{
  "name": "context7",
  "type": "mcp",
  "description": "Version-specific library documentation for any package",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@upstash/context7-mcp"]
}
```

```json
// registry/mcp/github/manifest.json
{
  "name": "github",
  "type": "mcp",
  "description": "GitHub — repos, issues, PRs, code search",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
  }
}
```

```json
// registry/mcp/supabase/manifest.json
{
  "name": "supabase",
  "type": "mcp",
  "description": "Supabase — database, auth, storage",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@supabase/mcp-server-supabase@latest"],
  "env": {
    "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
  }
}
```

```json
// registry/mcp/vercel/manifest.json
{
  "name": "vercel",
  "type": "mcp",
  "description": "Vercel — deployments, domains, environment variables",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@vercel/mcp-adapter"],
  "env": {
    "VERCEL_TOKEN": "${VERCEL_TOKEN}"
  }
}
```

- [ ] **Step 2: Verify loader reads real manifests**

```bash
node --input-type=module <<'EOF'
import { loadMcpManifests } from './packages/harness-kit/src/registry/loader.js'
// Note: run after build
EOF
```

Instead, run the existing loader tests which use temp dir mocks — they already pass. Manual verification happens in Task 7.

- [ ] **Step 3: Commit**

```bash
git add packages/harness-kit/registry/mcp/
git commit -m "feat(registry): add MCP manifest files for all supported integrations"
```

---

## Task 5: Filter Logic (Pure Function)

**Files:**
- Create: `packages/harness-kit/src/wizard/filter.ts`
- Create: `packages/harness-kit/tests/wizard/filter.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// packages/harness-kit/tests/wizard/filter.test.ts
import { describe, it, expect } from 'vitest'
import { filterOptions } from '../../src/wizard/filter.js'
import type { TechOption } from '../../src/wizard/types.js'

const OPTIONS: TechOption[] = [
  { id: 'nextjs', label: 'Next.js', hint: 'fullstack React framework', category: 'Web Frameworks', tags: ['react', 'typescript', 'fullstack'] },
  { id: 'react', label: 'React', hint: 'frontend only', category: 'Web Frameworks', tags: ['react', 'typescript', 'frontend'] },
  { id: 'python-fastapi', label: 'Python + FastAPI', hint: 'async Python API', category: 'Backend', tags: ['python', 'api', 'backend'] },
  { id: 'langchain', label: 'LangChain', hint: 'Python / JavaScript', category: 'AI', tags: ['ai', 'python', 'javascript', 'llm'] },
  { id: 'docker', label: 'Docker', hint: 'containerization', category: 'Platform', tags: ['platform', 'devops'] },
]

describe('filterOptions', () => {
  it('returns all options for empty query', () => {
    expect(filterOptions('', OPTIONS)).toHaveLength(OPTIONS.length)
  })

  it('matches by label (case-insensitive)', () => {
    const result = filterOptions('next', OPTIONS)
    expect(result.map((o) => o.id)).toContain('nextjs')
    expect(result).toHaveLength(1)
  })

  it('matches by tag', () => {
    const result = filterOptions('python', OPTIONS)
    const ids = result.map((o) => o.id)
    expect(ids).toContain('python-fastapi')
    expect(ids).toContain('langchain')
  })

  it('matches by hint', () => {
    const result = filterOptions('fullstack', OPTIONS)
    expect(result.map((o) => o.id)).toContain('nextjs')
  })

  it('returns empty array for no match', () => {
    expect(filterOptions('xxxxxxxx', OPTIONS)).toHaveLength(0)
  })

  it('matches react in both Next.js (tag) and React (label)', () => {
    const result = filterOptions('react', OPTIONS)
    const ids = result.map((o) => o.id)
    expect(ids).toContain('nextjs')
    expect(ids).toContain('react')
  })

  it('trims whitespace from query', () => {
    const result = filterOptions('  docker  ', OPTIONS)
    expect(result.map((o) => o.id)).toContain('docker')
  })
})
```

- [ ] **Step 2: Run — verify fails**

```bash
pnpm --filter @harness-kit/cli test
```

Expected: FAIL — `Cannot find module '../../src/wizard/filter.js'`

- [ ] **Step 3: Implement filterOptions**

```ts
// packages/harness-kit/src/wizard/filter.ts
import type { TechOption } from './types.js'

export function filterOptions(query: string, options: TechOption[]): TechOption[] {
  const q = query.trim().toLowerCase()
  if (!q) return options
  return options.filter((opt) => {
    return (
      opt.label.toLowerCase().includes(q) ||
      opt.hint.toLowerCase().includes(q) ||
      opt.tags.some((tag) => tag.toLowerCase().includes(q))
    )
  })
}
```

- [ ] **Step 4: Run — verify passes**

```bash
pnpm --filter @harness-kit/cli test
```

Expected: PASS — all 7 filter tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/harness-kit/src/wizard/filter.ts packages/harness-kit/tests/wizard/filter.test.ts
git commit -m "feat(wizard): add pure filterOptions function with tests"
```

---

## Task 6: Tech Options Constant

**Files:**
- Create: `packages/harness-kit/src/wizard/tech-options.ts`

No separate tests — this is static data. Verified by SearchableMultiselect smoke test in Task 7.

- [ ] **Step 1: Create TECH_OPTIONS**

```ts
// packages/harness-kit/src/wizard/tech-options.ts
import type { TechOption } from './types.js'

export const TECH_OPTIONS: TechOption[] = [
  // ── Web Frameworks ──────────────────────────────────────────
  { id: 'nextjs', label: 'Next.js', hint: 'fullstack React framework', category: 'Web Frameworks', tags: ['react', 'typescript', 'fullstack', 'vercel'] },
  { id: 'nuxt', label: 'Nuxt', hint: 'fullstack Vue framework', category: 'Web Frameworks', tags: ['vue', 'typescript', 'fullstack'] },
  { id: 'sveltekit', label: 'SvelteKit', hint: 'fullstack Svelte framework', category: 'Web Frameworks', tags: ['svelte', 'typescript', 'fullstack'] },
  { id: 'react', label: 'React', hint: 'frontend only', category: 'Web Frameworks', tags: ['react', 'typescript', 'frontend'] },
  { id: 'vue', label: 'Vue', hint: 'frontend only', category: 'Web Frameworks', tags: ['vue', 'typescript', 'frontend'] },
  { id: 'angular', label: 'Angular', hint: 'frontend only', category: 'Web Frameworks', tags: ['angular', 'typescript', 'frontend'] },
  { id: 'vanilla-ts', label: 'Vanilla TypeScript', hint: 'no framework', category: 'Web Frameworks', tags: ['typescript', 'frontend'] },

  // ── Backend ──────────────────────────────────────────────────
  { id: 'node-express', label: 'Node.js + Express', hint: 'minimal Node.js API', category: 'Backend', tags: ['node', 'javascript', 'typescript', 'api', 'backend'] },
  { id: 'node-fastify', label: 'Node.js + Fastify', hint: 'fast Node.js API', category: 'Backend', tags: ['node', 'javascript', 'typescript', 'api', 'backend'] },
  { id: 'python-fastapi', label: 'Python + FastAPI', hint: 'async Python API', category: 'Backend', tags: ['python', 'api', 'backend', 'async'] },
  { id: 'python-django', label: 'Python + Django', hint: 'batteries-included Python', category: 'Backend', tags: ['python', 'api', 'backend'] },
  { id: 'go', label: 'Go', hint: 'compiled, fast', category: 'Backend', tags: ['go', 'golang', 'backend', 'api'] },
  { id: 'rust', label: 'Rust', hint: 'systems, WASM', category: 'Backend', tags: ['rust', 'backend', 'wasm'] },
  { id: 'java-spring', label: 'Java + Spring', hint: 'enterprise Java', category: 'Backend', tags: ['java', 'spring', 'backend', 'enterprise'] },

  // ── Database ──────────────────────────────────────────────────
  { id: 'postgresql', label: 'PostgreSQL', hint: 'relational database', category: 'Database', tags: ['database', 'sql', 'relational', 'postgres'] },
  { id: 'mysql', label: 'MySQL', hint: 'relational database', category: 'Database', tags: ['database', 'sql', 'relational'] },
  { id: 'mongodb', label: 'MongoDB', hint: 'document database', category: 'Database', tags: ['database', 'nosql', 'document', 'mongo'] },
  { id: 'sqlite', label: 'SQLite', hint: 'embedded database', category: 'Database', tags: ['database', 'sql', 'embedded'] },
  { id: 'redis', label: 'Redis', hint: 'in-memory cache / pub-sub', category: 'Database', tags: ['database', 'cache', 'redis', 'nosql'] },
  { id: 'dynamodb', label: 'DynamoDB', hint: 'AWS managed NoSQL', category: 'Database', tags: ['database', 'nosql', 'aws', 'dynamo'] },
  { id: 'supabase', label: 'Supabase', hint: 'PostgreSQL + auth + storage', category: 'Database', tags: ['database', 'postgres', 'auth', 'storage', 'supabase'] },

  // ── Platform ──────────────────────────────────────────────────
  { id: 'docker', label: 'Docker', hint: 'containerization', category: 'Platform', tags: ['docker', 'container', 'devops', 'platform'] },
  { id: 'github-actions', label: 'GitHub Actions', hint: 'CI/CD', category: 'Platform', tags: ['ci', 'cd', 'github', 'devops', 'platform'] },
  { id: 'terraform', label: 'Terraform', hint: 'infrastructure as code', category: 'Platform', tags: ['terraform', 'iac', 'devops', 'platform'] },
  { id: 'kubernetes', label: 'Kubernetes', hint: 'container orchestration', category: 'Platform', tags: ['kubernetes', 'k8s', 'container', 'devops', 'platform'] },
  { id: 'aws-cdk', label: 'AWS CDK', hint: 'AWS infrastructure as code', category: 'Platform', tags: ['aws', 'cdk', 'iac', 'platform', 'devops'] },

  // ── AI ────────────────────────────────────────────────────────
  { id: 'langchain', label: 'LangChain', hint: 'Python / JavaScript', category: 'AI', tags: ['ai', 'llm', 'python', 'javascript', 'langchain'] },
  { id: 'langgraph', label: 'LangGraph', hint: 'graph-based agent workflows', category: 'AI', tags: ['ai', 'agents', 'graph', 'python', 'langgraph'] },
  { id: 'anthropic-sdk', label: 'Anthropic SDK', hint: 'direct Claude API', category: 'AI', tags: ['ai', 'claude', 'anthropic', 'llm', 'api'] },
  { id: 'openai-sdk', label: 'OpenAI SDK', hint: 'direct OpenAI API', category: 'AI', tags: ['ai', 'openai', 'gpt', 'llm', 'api'] },
  { id: 'vercel-ai-sdk', label: 'Vercel AI SDK', hint: 'edge-optimized AI', category: 'AI', tags: ['ai', 'vercel', 'llm', 'streaming', 'edge'] },
  { id: 'crewai', label: 'CrewAI', hint: 'multi-agent framework', category: 'AI', tags: ['ai', 'agents', 'crew', 'python', 'multi-agent'] },
  { id: 'llamaindex', label: 'LlamaIndex', hint: 'RAG / data pipelines', category: 'AI', tags: ['ai', 'rag', 'llm', 'python', 'data'] },
]
```

- [ ] **Step 2: Commit**

```bash
git add packages/harness-kit/src/wizard/tech-options.ts
git commit -m "feat(wizard): add TECH_OPTIONS constant with full tech stack list"
```

---

## Task 7: SearchableMultiselect Component

**Files:**
- Create: `packages/harness-kit/src/wizard/steps/tech-stack-select.ts`

TUI components cannot be unit tested with vitest (requires raw terminal). This task verifies via manual smoke test.

- [ ] **Step 1: Verify @clack/core Prompt API**

Before implementing, check what `@clack/core` exports:

```bash
node --input-type=module -e "
import * as core from '@clack/core';
console.log(Object.keys(core));
"
```

Expected output includes: `Prompt`, `TextPrompt`, `SelectPrompt`, `MultiSelectPrompt` (or similar). Note the exact exports — implementation below uses `Prompt`.

- [ ] **Step 2: Implement SearchableMultiselect**

```ts
// packages/harness-kit/src/wizard/steps/tech-stack-select.ts
import { Prompt } from '@clack/core'
import chalk from 'chalk'
import { filterOptions } from '../filter.js'
import type { TechOption } from '../types.js'

// Group options by category for rendering
function groupByCategory(options: TechOption[]): Map<string, TechOption[]> {
  const groups = new Map<string, TechOption[]>()
  for (const opt of options) {
    const group = groups.get(opt.category) ?? []
    group.push(opt)
    groups.set(opt.category, group)
  }
  return groups
}

// Build flat index of filtered options (for cursor navigation)
function flatIndex(options: TechOption[]): TechOption[] {
  return options
}

export async function selectTechStack(options: TechOption[]): Promise<string[]> {
  let query = ''
  let cursor = 0
  const selected = new Set<string>()

  return new Promise((resolve, reject) => {
    // @clack/core Prompt handles raw mode, keypress, and rendering
    // render() is called after each keypress; return the string to display
    const prompt = new Prompt({
      render() {
        const filtered = filterOptions(query, options)
        const flat = flatIndex(filtered)

        // Clamp cursor to valid range
        if (cursor >= flat.length) cursor = Math.max(0, flat.length - 1)

        const groups = groupByCategory(filtered)
        const lines: string[] = []

        lines.push(
          chalk.cyan('?') + ' Select your tech stack ' + chalk.dim('(type to search):')
        )
        lines.push('')
        lines.push('  Search: ' + chalk.white(query) + chalk.dim('▌'))
        lines.push('')

        let idx = 0
        for (const [category, items] of groups) {
          lines.push(chalk.dim('  ── ' + category + ' ' + '─'.repeat(Math.max(0, 45 - category.length))))
          for (const item of items) {
            const isActive = idx === cursor
            const isSelected = selected.has(item.id)
            const checkbox = isSelected ? chalk.green('◉') : chalk.dim('◯')
            const label = isActive ? chalk.cyan(item.label) : item.label
            const hint = chalk.dim(item.hint)
            const prefix = isActive ? chalk.cyan('›') : ' '
            lines.push(`  ${prefix} ${checkbox}  ${label.padEnd(20)} ${hint}`)
            idx++
          }
        }

        lines.push('')
        lines.push(
          chalk.dim(
            `  ${selected.size} selected   [↑↓] navigate   [Space] toggle   [Enter] confirm`
          )
        )
        return lines.join('\n')
      },
    })

    // Handle keypresses
    prompt.on('key', (key: { name?: string; sequence?: string }) => {
      const filtered = filterOptions(query, options)
      const flat = flatIndex(filtered)

      if (key.name === 'up') {
        cursor = Math.max(0, cursor - 1)
      } else if (key.name === 'down') {
        cursor = Math.min(flat.length - 1, cursor + 1)
      } else if (key.name === 'space') {
        const item = flat[cursor]
        if (item) {
          if (selected.has(item.id)) selected.delete(item.id)
          else selected.add(item.id)
        }
      } else if (key.name === 'return') {
        resolve(Array.from(selected))
      } else if (key.name === 'backspace') {
        query = query.slice(0, -1)
        cursor = 0
      } else if (key.sequence && key.sequence.length === 1 && !key.sequence.match(/[\x00-\x1f]/)) {
        query += key.sequence
        cursor = 0
      }
    })

    prompt.on('error', reject)

    prompt.prompt()
  })
}
```

> **Note:** `@clack/core` Prompt's event API (`prompt.on('key', ...)`) may differ from the above. If the `key` event is not exposed, check the @clack/core source for the actual event name or override the internal `_handleKeypress` method. As a fallback, implement using Node's `readline` + `process.stdin` with `setRawMode(true)`.

- [ ] **Step 3: Build to verify TypeScript compiles**

```bash
pnpm --filter @harness-kit/cli build
```

Expected: PASS — no type errors.

- [ ] **Step 4: Manual smoke test**

Create a temporary test script (do NOT commit this):

```ts
// /tmp/test-multiselect.mjs
import { selectTechStack } from './packages/harness-kit/dist/wizard/steps/tech-stack-select.js'
import { TECH_OPTIONS } from './packages/harness-kit/dist/wizard/tech-options.js'

const selected = await selectTechStack(TECH_OPTIONS)
console.log('\nSelected:', selected)
process.exit(0)
```

```bash
pnpm --filter @harness-kit/cli build
node /tmp/test-multiselect.mjs
```

Expected behavior:
- Terminal renders the searchable list with categories
- Typing filters the list in realtime
- Arrow keys move cursor
- Space toggles selection (◯ → ◉)
- Enter prints selected IDs and exits

If the @clack/core API does not match — see Note in Step 2 and adjust accordingly.

- [ ] **Step 5: Commit**

```bash
git add packages/harness-kit/src/wizard/steps/ packages/harness-kit/src/wizard/tech-options.ts packages/harness-kit/src/wizard/types.ts packages/harness-kit/src/wizard/filter.ts
git commit -m "feat(wizard): add SearchableMultiselect TUI component and tech options"
```

---

## Task 8: Wire into CLI (smoke test entry point)

Connect SearchableMultiselect to `harness-kit init` command so it can be run end-to-end from terminal. Full wizard wiring is Plan B — this is minimal wiring for testing Plan A output.

**Files:**
- Modify: `packages/harness-kit/src/index.ts`

- [ ] **Step 1: Add `init` command stub**

```ts
// packages/harness-kit/src/index.ts
import { Command } from 'commander'
import { HARNESS_KIT_VERSION } from '@harness-kit/core'
import { selectTechStack } from './wizard/steps/tech-stack-select.js'
import { TECH_OPTIONS } from './wizard/tech-options.js'

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
      const selected = await selectTechStack(TECH_OPTIONS)
      console.log('\nSelected tech:', selected)
      // Full wizard wiring in Plan B
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

- [ ] **Step 2: Run existing tests — verify they still pass**

```bash
pnpm --filter @harness-kit/cli test
```

Expected: PASS — existing CLI tests still green.

- [ ] **Step 3: Build and smoke test via CLI**

```bash
pnpm --filter @harness-kit/cli build
node packages/harness-kit/dist/index.js init
```

Expected: SearchableMultiselect renders in terminal, selection works, Enter prints selected IDs.

- [ ] **Step 4: Commit**

```bash
git add packages/harness-kit/src/index.ts
git commit -m "feat(cli): wire init command stub with SearchableMultiselect"
```

---

## Done — Plan A Complete

At this point:
- `filterOptions()` is tested and working
- `loadMcpManifests()` is tested and working
- All 15 MCP manifests exist in `registry/mcp/`
- `SearchableMultiselect` renders in terminal and is reachable via `harness-kit init`
- `TECH_OPTIONS` covers all 34 tech stack entries across 5 categories

**Next:** Plan B — xstate machine, all wizard steps, AI generation, Handlebars templates, apply engine, full CLI wiring.
