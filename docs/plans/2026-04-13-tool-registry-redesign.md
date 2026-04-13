# Thiết kế lại Tool Registry — Implementation Plan

> **Dành cho agentic workers:** REQUIRED SUB-SKILL: Dùng superpowers:subagent-driven-development (khuyến nghị) hoặc superpowers:executing-plans để thực hiện plan này từng task. Các bước dùng cú pháp checkbox (`- [ ]`) để theo dõi tiến độ.

**Goal:** Thay thế danh sách MCP tool rời rạc trong wizard bằng 8 category có cấu trúc, tái cấu trúc registry thành 3 subdirs theo loại tool, bổ sung 21 manifest mới, và thêm cảnh báo dependency trước khi apply.

**Architecture:** Thay `McpManifest` bằng discriminated union `AnyManifest` (mcp/plugin/tool), thêm `registry/plugins/` và `registry/tools/` bên cạnh `registry/mcp/`, cập nhật loader để load từ cả 3 subdirs, cập nhật `WizardContext` với các field category mới, tái cấu trúc `harness-config.ts` thành 8 prompts.

**Tech Stack:** TypeScript 5, vitest, @clack/prompts, Node.js fs/promises, JSON manifest files

---

## Cấu trúc file

| File | Loại thay đổi | Mô tả |
|------|--------------|-------|
| `src/registry/types.ts` | Sửa | Thay `McpManifest` bằng discriminated union `AnyManifest` |
| `src/registry/loader.ts` | Sửa | `loadMcpManifests` → `loadManifests(registryDir)`, load từ 3 subdirs |
| `src/wizard/types.ts` | Sửa | Cập nhật `WizardContext`, union `memory` |
| `src/wizard/index.ts` | Sửa | Cập nhật `initialContext` |
| `src/wizard/steps/harness-config.ts` | Sửa | 8 prompts tái cấu trúc |
| `src/wizard/steps/preview-apply.ts` | Sửa | `collectMcpIds` dùng field mới; filter `installType === 'mcp'`; cảnh báo dependency |
| `templates/mcp.json.hbs` | Kiểm tra | Không cần sửa nếu `mcpConfigs` vẫn là `McpManifest[]` |
| `registry/mcp/*/manifest.json` (×10) | Sửa | Thêm `installType`, `requires`, `selfHosted`, `experimental` |
| `registry/mcp/*/manifest.json` (×19) | Tạo mới | Manifest MCP mới |
| `registry/plugins/claude-mem/manifest.json` | Tạo mới | Plugin manifest |
| `registry/tools/markitdown/manifest.json` | Tạo mới | Tool manifest |
| `tests/registry/loader.test.ts` | Sửa | Test `AnyManifest` + load từ subdirs |
| `tests/wizard/preview-apply.test.ts` | Tạo mới | Test `collectMcpIds` và cảnh báo |

---

## Task 1: Thay McpManifest bằng AnyManifest + cập nhật loader

**Files:**
- Sửa: `packages/harness-kit/src/registry/types.ts`
- Sửa: `packages/harness-kit/src/registry/loader.ts`
- Sửa: `packages/harness-kit/tests/registry/loader.test.ts`

- [ ] **Bước 1: Viết test failing cho AnyManifest và loader mới**

Thay toàn bộ nội dung `tests/registry/loader.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { loadManifests } from '../../src/registry/loader.js'

let tmpDir: string

beforeEach(async () => {
  tmpDir = join(tmpdir(), `hk-test-${Date.now()}`)
  // Tạo cấu trúc registry 3 subdirs
  await mkdir(join(tmpDir, 'mcp', 'playwright'), { recursive: true })
  await mkdir(join(tmpDir, 'mcp', 'firecrawl'), { recursive: true })
  await mkdir(join(tmpDir, 'plugins', 'claude-mem'), { recursive: true })
  await mkdir(join(tmpDir, 'tools', 'markitdown'), { recursive: true })

  await writeFile(
    join(tmpDir, 'mcp', 'playwright', 'manifest.json'),
    JSON.stringify({
      name: 'playwright',
      description: 'Browser automation',
      version: '1.0.0',
      installType: 'mcp',
      command: 'npx',
      args: ['@playwright/mcp@latest'],
      requires: [],
      selfHosted: false,
      experimental: false,
    })
  )
  await writeFile(
    join(tmpDir, 'mcp', 'firecrawl', 'manifest.json'),
    JSON.stringify({
      name: 'firecrawl',
      description: 'Web scraping',
      version: '1.0.0',
      installType: 'mcp',
      command: 'npx',
      args: ['-y', 'firecrawl-mcp'],
      env: { FIRECRAWL_API_KEY: '${FIRECRAWL_API_KEY}' },
      requires: [],
      selfHosted: false,
      experimental: false,
    })
  )
  await writeFile(
    join(tmpDir, 'plugins', 'claude-mem', 'manifest.json'),
    JSON.stringify({
      name: 'claude-mem',
      description: 'Session memory cho Claude Code',
      version: '1.0.0',
      installType: 'plugin',
      installSource: 'github:thedotmack/claude-mem',
      requires: ['bun', 'chromadb', 'sqlite'],
      selfHosted: true,
      experimental: true,
    })
  )
  await writeFile(
    join(tmpDir, 'tools', 'markitdown', 'manifest.json'),
    JSON.stringify({
      name: 'markitdown',
      description: 'PDF/Word/HTML → markdown',
      version: '1.0.0',
      installType: 'tool',
      installCmd: 'pip install markitdown',
      requires: ['python'],
      selfHosted: false,
      experimental: false,
    })
  )
})

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true })
})

describe('loadManifests', () => {
  it('load được manifest từ cả 3 subdirs (mcp, plugins, tools)', async () => {
    const manifests = await loadManifests(tmpDir)
    expect(manifests).toHaveLength(4)
    expect(manifests.map((m) => m.name).sort()).toEqual(['claude-mem', 'firecrawl', 'markitdown', 'playwright'])
  })

  it('McpManifest có đủ command và args', async () => {
    const manifests = await loadManifests(tmpDir)
    const pw = manifests.find((m) => m.name === 'playwright')
    expect(pw?.installType).toBe('mcp')
    if (pw?.installType === 'mcp') {
      expect(pw.command).toBe('npx')
      expect(pw.args).toEqual(['@playwright/mcp@latest'])
    }
  })

  it('PluginManifest có installSource, không có command', async () => {
    const manifests = await loadManifests(tmpDir)
    const cm = manifests.find((m) => m.name === 'claude-mem')
    expect(cm?.installType).toBe('plugin')
    if (cm?.installType === 'plugin') {
      expect(cm.installSource).toBe('github:thedotmack/claude-mem')
    }
  })

  it('ToolManifest có installCmd, không có command', async () => {
    const manifests = await loadManifests(tmpDir)
    const md = manifests.find((m) => m.name === 'markitdown')
    expect(md?.installType).toBe('tool')
    if (md?.installType === 'tool') {
      expect(md.installCmd).toBe('pip install markitdown')
    }
  })

  it('trả về array rỗng nếu thư mục không tồn tại', async () => {
    const manifests = await loadManifests('/nonexistent/path')
    expect(manifests).toHaveLength(0)
  })

  it('bỏ qua folder không có manifest.json', async () => {
    await mkdir(join(tmpDir, 'mcp', 'no-manifest'), { recursive: true })
    const manifests = await loadManifests(tmpDir)
    expect(manifests).toHaveLength(4) // không tăng thêm
  })
})
```

- [ ] **Bước 2: Chạy test để xác nhận failing**

```bash
cd packages/harness-kit && pnpm vitest run tests/registry/loader.test.ts
```

Expected: FAIL — `loadManifests` không tồn tại.

- [ ] **Bước 3: Cập nhật src/registry/types.ts**

Thay toàn bộ nội dung:

```ts
interface BaseManifest {
  name: string
  description: string
  version: string
  requires: string[]
  selfHosted: boolean
  experimental: boolean
}

export interface McpManifest extends BaseManifest {
  installType: 'mcp'
  command: string
  args: string[]
  env?: Record<string, string>
}

export interface PluginManifest extends BaseManifest {
  installType: 'plugin'
  installSource: string
}

export interface ToolManifest extends BaseManifest {
  installType: 'tool'
  installCmd: string
}

export type AnyManifest = McpManifest | PluginManifest | ToolManifest
```

- [ ] **Bước 4: Cập nhật src/registry/loader.ts**

Thay toàn bộ nội dung:

```ts
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { AnyManifest } from './types.js'

const SUBDIRS = ['mcp', 'plugins', 'tools'] as const

async function loadFromSubdir(subdir: string): Promise<AnyManifest[]> {
  let entries: string[]
  try {
    entries = await readdir(subdir)
  } catch {
    return []
  }

  const manifests: AnyManifest[] = []
  for (const entry of entries) {
    const manifestPath = join(subdir, entry, 'manifest.json')
    try {
      const raw = await readFile(manifestPath, 'utf-8')
      manifests.push(JSON.parse(raw) as AnyManifest)
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
    }
  }
  return manifests
}

export async function loadManifests(registryDir: string): Promise<AnyManifest[]> {
  const results = await Promise.all(
    SUBDIRS.map((sub) => loadFromSubdir(join(registryDir, sub)))
  )
  return results.flat()
}

/** @deprecated Dùng loadManifests() thay thế */
export async function loadMcpManifests(mcpDir: string) {
  return loadFromSubdir(mcpDir)
}
```

- [ ] **Bước 5: Chạy test để xác nhận pass**

```bash
pnpm vitest run tests/registry/loader.test.ts
```

Expected: PASS tất cả 6 test cases.

- [ ] **Bước 6: Commit**

```bash
git add src/registry/types.ts src/registry/loader.ts tests/registry/loader.test.ts
git commit -m "feat(registry): replace McpManifest with AnyManifest discriminated union, add multi-subdir loader"
```

---

## Task 2: Cập nhật WizardContext và initialContext

**Files:**
- Sửa: `packages/harness-kit/src/wizard/types.ts`
- Sửa: `packages/harness-kit/src/wizard/index.ts`

- [ ] **Bước 1: Cập nhật WizardContext trong types.ts**

Thay nội dung `src/wizard/types.ts`:

```ts
export interface TechOption {
  id: string
  label: string
  hint: string
  category: string
  tags: string[]
}

export interface DetectedIssue {
  label: string
  found: boolean
  installCmd?: string
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
  memory: 'file-based' | 'mem0' | 'obsidian' | 'letta' | 'mempalace' | 'claude-mem' | 'none'
  docsAsCode: boolean
  workflowPresets: string[]
  browserTools: string[]
  webSearch: string[]
  webScrape: string[]
  libraryDocs: string[]
  docConversion: string[]
  codeExecution: string[]
  devIntegrations: string[]
  cloudInfra: string[]
  observability: string[]
  aiGenerationEnabled: boolean
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

- [ ] **Bước 2: Cập nhật initialContext trong index.ts**

Trong `src/wizard/index.ts`, thay `initialContext`:

```ts
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
  webScrape: ['firecrawl'],
  libraryDocs: ['context7'],
  docConversion: [],
  codeExecution: [],
  devIntegrations: ['github'],
  cloudInfra: [],
  observability: [],
  aiGenerationEnabled: false,
}
```

> **Lưu ý build continuity:** Sau commit này, TypeScript build sẽ **fail** vì `harness-config.ts` và `preview-apply.ts` vẫn còn dùng `webCrawl` và `otherMcp`. Đây là trạng thái chuyển tiếp có chủ ý — build sẽ pass trở lại sau Task 7. Không chạy `pnpm build` sau Task 2.

- [ ] **Bước 3: Commit**

```bash
git add src/wizard/types.ts src/wizard/index.ts
git commit -m "feat(wizard): update WizardContext — new tool category fields, rename webCrawl→webScrape"
```

---

## Task 3: Cập nhật 10 manifest hiện có

**Files:** `packages/harness-kit/registry/mcp/*/manifest.json` (10 files)

Thêm 4 fields (`installType`, `requires`, `selfHosted`, `experimental`) vào tất cả manifest hiện có.

- [ ] **Bước 1: Cập nhật agent-browser/manifest.json**

```json
{
  "name": "agent-browser",
  "type": "mcp",
  "description": "Token-efficient browser snapshots (~200-400 tokens/page)",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "agent-browser-mcp"],
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 2: Cập nhật brave-search/manifest.json**

```json
{
  "name": "brave-search",
  "type": "mcp",
  "description": "Brave Search — independent index, privacy-focused",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-brave-search"],
  "env": {
    "BRAVE_API_KEY": "${BRAVE_API_KEY}"
  },
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 3: Cập nhật context7/manifest.json**

```json
{
  "name": "context7",
  "type": "mcp",
  "description": "Context7 — version-specific docs for any package",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@upstash/context7-mcp"],
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 4: Cập nhật crawl4ai/manifest.json**

```json
{
  "name": "crawl4ai",
  "type": "mcp",
  "description": "Crawl4AI — open source web scraping, self-hosted Docker",
  "version": "1.0.0",
  "command": "uvx",
  "args": ["crawl4ai-mcp"],
  "installType": "mcp",
  "requires": ["docker"],
  "selfHosted": true,
  "experimental": false
}
```

- [ ] **Bước 5: Cập nhật firecrawl/manifest.json**

```json
{
  "name": "firecrawl",
  "type": "mcp",
  "description": "Firecrawl — HTML→markdown, JS-enabled scraping",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "firecrawl-mcp"],
  "env": {
    "FIRECRAWL_API_KEY": "${FIRECRAWL_API_KEY}"
  },
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 6: Cập nhật github/manifest.json**

```json
{
  "name": "github",
  "type": "mcp",
  "description": "GitHub — repos, issues, PRs, code search",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
  },
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 7: Cập nhật playwright/manifest.json**

```json
{
  "name": "playwright",
  "type": "mcp",
  "description": "Playwright — accessibility snapshots, E2E test generation",
  "version": "1.0.0",
  "command": "npx",
  "args": ["@playwright/mcp@latest"],
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 8: Cập nhật supabase/manifest.json**

```json
{
  "name": "supabase",
  "type": "mcp",
  "description": "Supabase — Postgres + auth + storage",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@supabase/mcp-server-supabase@latest"],
  "env": {
    "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
  },
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 9: Cập nhật tavily/manifest.json**

```json
{
  "name": "tavily",
  "type": "mcp",
  "description": "Tavily — agentic search, structured results, free tier",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "tavily-mcp@0.1.4"],
  "env": {
    "TAVILY_API_KEY": "${TAVILY_API_KEY}"
  },
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 10: Cập nhật vercel/manifest.json**

```json
{
  "name": "vercel",
  "type": "mcp",
  "description": "Vercel — deployments, domains, logs, env vars",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@vercel/mcp-adapter"],
  "env": {
    "VERCEL_TOKEN": "${VERCEL_TOKEN}"
  },
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 11: Commit**

```bash
git add registry/mcp/
git commit -m "chore(registry): add installType/requires/selfHosted/experimental to existing manifests"
```

---

## Task 4: Tạo manifest mới — Memory (MCP) & Browser

**Files:** Tạo folder mới trong `packages/harness-kit/registry/mcp/`

> **Lưu ý:** Trước khi implement, xác minh `command`/`args` chính xác tại docs chính thức của từng tool. Các giá trị dưới đây là best-known tại thời điểm viết spec.

- [ ] **Bước 1: Tạo registry/mcp/obsidian/manifest.json**

```json
{
  "name": "obsidian",
  "type": "mcp",
  "description": "Obsidian — đồng bộ với Obsidian vault",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "mcp-obsidian"],
  "env": {
    "OBSIDIAN_API_KEY": "${OBSIDIAN_API_KEY}",
    "OBSIDIAN_HOST": "http://localhost:27123"
  },
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 2: Tạo mem0/manifest.json**

Manifest này dùng cho OpenMemory self-hosted (Docker) — phù hợp với hint trong wizard "local-first, Docker: Qdrant + Postgres":

```json
{
  "name": "mem0",
  "type": "mcp",
  "description": "mem0 / OpenMemory — local-first, Docker: Qdrant + Postgres",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@mem0/mcp-server"],
  "env": {
    "MEM0_API_KEY": "${MEM0_API_KEY}"
  },
  "installType": "mcp",
  "requires": ["docker"],
  "selfHosted": true,
  "experimental": false
}
```

> Nếu user muốn dùng mem0 cloud API thay vì self-hosted, họ có thể xoá bước Docker setup. `requires: ["docker"]` phản ánh đúng wizard hint và spec.

- [ ] **Bước 3: Tạo letta/manifest.json**

```json
{
  "name": "letta",
  "type": "mcp",
  "description": "Letta — stateful agents, tự host bằng Docker",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "letta-mcp-server"],
  "env": {
    "LETTA_BASE_URL": "${LETTA_BASE_URL:-http://localhost:8283}",
    "LETTA_TOKEN": "${LETTA_TOKEN}"
  },
  "installType": "mcp",
  "requires": ["docker"],
  "selfHosted": true,
  "experimental": false
}
```

- [ ] **Bước 4: Tạo mempalace/manifest.json**

```json
{
  "name": "mempalace",
  "type": "mcp",
  "description": "MemPalace — knowledge graph local, 19 tools (thử nghiệm — cần Python + ChromaDB)",
  "version": "1.0.0",
  "command": "uvx",
  "args": ["mempalace"],
  "installType": "mcp",
  "requires": ["python", "chromadb"],
  "selfHosted": true,
  "experimental": true
}
```

- [ ] **Bước 5: Tạo registry/plugins/claude-mem/manifest.json** *(plugin — không phải mcp/)*

```json
{
  "name": "claude-mem",
  "description": "Session memory cho Claude Code, hybrid semantic search (PolyForm NC license)",
  "version": "1.0.0",
  "installType": "plugin",
  "installSource": "github:thedotmack/claude-mem",
  "requires": ["bun", "chromadb", "sqlite"],
  "selfHosted": true,
  "experimental": true
}
```

- [ ] **Bước 6: Tạo registry/tools/markitdown/manifest.json** *(tool — không phải mcp/)*

```json
{
  "name": "markitdown",
  "description": "PDF/Word/HTML/audio → markdown (Python local)",
  "version": "1.0.0",
  "installType": "tool",
  "installCmd": "pip install markitdown",
  "requires": ["python"],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 7: Tạo registry/mcp/browser-use/manifest.json**

```json
{
  "name": "browser-use",
  "type": "mcp",
  "description": "browser-use — Playwright điều khiển bằng ngôn ngữ tự nhiên",
  "version": "1.0.0",
  "command": "uvx",
  "args": ["browser-use-mcp-server"],
  "env": {
    "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}"
  },
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 9: Tạo registry/mcp/stagehand/manifest.json**

```json
{
  "name": "stagehand",
  "type": "mcp",
  "description": "Stagehand — CDP-native, tự sửa selector khi DOM thay đổi",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@browserbasehq/mcp-stagehand"],
  "env": {
    "BROWSERBASE_API_KEY": "${BROWSERBASE_API_KEY}",
    "BROWSERBASE_PROJECT_ID": "${BROWSERBASE_PROJECT_ID}",
    "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}"
  },
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 10: Commit**

```bash
git add registry/mcp/obsidian registry/mcp/mem0 registry/mcp/letta registry/mcp/mempalace registry/mcp/browser-use registry/mcp/stagehand registry/plugins/claude-mem registry/tools/markitdown
git commit -m "feat(registry): add Memory/Browser MCP manifests, plugin (claude-mem), tool (markitdown)"
```

---

## Task 5: Tạo manifest mới — Search, Scrape, Code

**Files:** Tạo 5 folder mới trong `packages/harness-kit/registry/mcp/`

- [ ] **Bước 1: Tạo exa/manifest.json**

```json
{
  "name": "exa",
  "type": "mcp",
  "description": "Exa — tìm kiếm ngữ nghĩa, tối ưu cho code + GitHub",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "exa-mcp-server"],
  "env": {
    "EXA_API_KEY": "${EXA_API_KEY}"
  },
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 3: Tạo perplexity/manifest.json**

Xác minh command tại: `github.com/perplexityai/modelcontextprotocol`

```json
{
  "name": "perplexity",
  "type": "mcp",
  "description": "Perplexity — tổng hợp câu trả lời, không chỉ links",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@perplexity-ai/mcp-server"],
  "env": {
    "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}"
  },
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 4: Tạo jina/manifest.json**

```json
{
  "name": "jina",
  "type": "mcp",
  "description": "Jina Reader — không cần config, miễn phí, scrape từng trang",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@jina-ai/mcp-server-jina"],
  "env": {
    "JINA_API_KEY": "${JINA_API_KEY}"
  },
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 5: Tạo spider/manifest.json** (đổi tên từ "Spider.cloud" trong wizard)

Xác minh tại: `spider.cloud/docs/mcp`

```json
{
  "name": "spider",
  "type": "mcp",
  "description": "Spider.cloud — Rust, chống bot, crawl toàn site",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@spider-cloud/spider-mcp"],
  "env": {
    "SPIDER_API_KEY": "${SPIDER_API_KEY}"
  },
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 6: Tạo e2b/manifest.json**

```json
{
  "name": "e2b",
  "type": "mcp",
  "description": "E2B — cloud sandbox bảo mật, tính tiền theo giây",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@e2b/mcp-server"],
  "env": {
    "E2B_API_KEY": "${E2B_API_KEY}"
  },
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 7: Tạo daytona/manifest.json**

Xác minh tại: `daytona.io/docs/en/mcp/`

```json
{
  "name": "daytona",
  "type": "mcp",
  "description": "Daytona — cloud sandbox, khởi động dưới 100ms",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@daytonaio/mcp-server"],
  "env": {
    "DAYTONA_API_KEY": "${DAYTONA_API_KEY}"
  },
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 8: Commit**

```bash
git add registry/mcp/exa registry/mcp/perplexity registry/mcp/jina registry/mcp/spider registry/mcp/e2b registry/mcp/daytona
git commit -m "feat(registry): add Search, Scrape, Code execution manifests (exa, perplexity, jina, spider, e2b, daytona)"
```

---

## Task 6: Tạo manifest mới — Dev, Cloud, Observability

**Files:** Tạo 7 folder mới trong `packages/harness-kit/registry/mcp/`

- [ ] **Bước 1: Tạo linear/manifest.json**

```json
{
  "name": "linear",
  "type": "mcp",
  "description": "Linear — quản lý issue, OAuth",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@linear/mcp-server"],
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 2: Tạo notion/manifest.json**

```json
{
  "name": "notion",
  "type": "mcp",
  "description": "Notion — docs + database",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@notionhq/notion-mcp-server"],
  "env": {
    "NOTION_API_KEY": "${NOTION_API_KEY}"
  },
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 3: Tạo slack/manifest.json**

```json
{
  "name": "slack",
  "type": "mcp",
  "description": "Slack — nhắn tin, OAuth",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-slack"],
  "env": {
    "SLACK_BOT_TOKEN": "${SLACK_BOT_TOKEN}",
    "SLACK_TEAM_ID": "${SLACK_TEAM_ID}"
  },
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 4: Tạo atlassian/manifest.json**

```json
{
  "name": "atlassian",
  "type": "mcp",
  "description": "Atlassian — Jira + Confluence, OAuth, chỉ dùng Cloud",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@atlassian/mcp-server"],
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 5: Tạo cloudflare/manifest.json**

```json
{
  "name": "cloudflare",
  "type": "mcp",
  "description": "Cloudflare — Workers, R2, D1, KV, AI Gateway",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@cloudflare/mcp-server-cloudflare"],
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 6: Tạo postgresql/manifest.json**

```json
{
  "name": "postgresql",
  "type": "mcp",
  "description": "PostgreSQL — truy vấn read-only (Anthropic official)",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-postgres"],
  "env": {
    "POSTGRES_CONNECTION_STRING": "${POSTGRES_CONNECTION_STRING}"
  },
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 7: Tạo langfuse/manifest.json**

```json
{
  "name": "langfuse",
  "type": "mcp",
  "description": "Langfuse — tracing, evals, quản lý prompt (self-hosted hoặc cloud)",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "langfuse-mcp"],
  "env": {
    "LANGFUSE_SECRET_KEY": "${LANGFUSE_SECRET_KEY}",
    "LANGFUSE_PUBLIC_KEY": "${LANGFUSE_PUBLIC_KEY}",
    "LANGFUSE_HOST": "${LANGFUSE_HOST:-https://cloud.langfuse.com}"
  },
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 8: Tạo helicone/manifest.json**

```json
{
  "name": "helicone",
  "type": "mcp",
  "description": "Helicone — monitoring qua proxy, hỗ trợ 100+ model",
  "version": "1.0.0",
  "command": "npx",
  "args": ["-y", "@helicone/mcp-server"],
  "env": {
    "HELICONE_API_KEY": "${HELICONE_API_KEY}"
  },
  "installType": "mcp",
  "requires": [],
  "selfHosted": false,
  "experimental": false
}
```

- [ ] **Bước 9: Commit**

```bash
git add registry/mcp/linear registry/mcp/notion registry/mcp/slack registry/mcp/atlassian registry/mcp/cloudflare registry/mcp/postgresql registry/mcp/langfuse registry/mcp/helicone
git commit -m "feat(registry): add Dev, Cloud, Observability manifests (linear, notion, slack, atlassian, cloudflare, postgresql, langfuse, helicone)"
```

---

## Task 7: Cập nhật harness-config.ts

**Files:**
- Sửa: `packages/harness-kit/src/wizard/steps/harness-config.ts`

Tái cấu trúc toàn bộ file thành 8 category prompts. Tool có `experimental: true` trong manifest sẽ có hậu tố `(thử nghiệm)` trong hint.

> **Lưu ý markitdown:** `markitdown` là CLI tool Python local, không phải MCP server — không cần manifest trong `registry/mcp/`. Nó xuất hiện trong `docConversion[]` của context nhưng `collectMcpIds` không spread `docConversion`, nên nó không vào `.mcp.json`. Đây là hành vi đúng — user cài markitdown riêng, không qua MCP config.

- [ ] **Bước 1: Thay toàn bộ nội dung harness-config.ts**

```ts
import * as p from '@clack/prompts'
import type { WizardContext } from '../types.js'

export async function stepHarnessConfig(ctx: WizardContext): Promise<Partial<WizardContext>> {
  if (ctx.selectedTech.length > 0) {
    p.log.step(`Tech stack: ${ctx.selectedTech.join(', ')}`)
  }

  // ── 1. Git workflow ──────────────────────────────────────────
  const gitWorkflow = await p.multiselect({
    message: 'Git workflow:',
    initialValues: ['conventional-commits', 'branch-strategy', 'pre-commit-hooks'],
    options: [
      { value: 'conventional-commits', label: 'Conventional Commits', hint: 'commit format + semantic versioning' },
      { value: 'branch-strategy', label: 'Branch strategy', hint: 'feature/fix/chore naming, PR < 400 dòng' },
      { value: 'pre-commit-hooks', label: 'Pre-commit hooks', hint: 'lint + typecheck + test trước khi commit' },
      { value: 'commit-signing', label: 'Commit signing', hint: 'GPG / SSH' },
    ],
    required: false,
  })
  if (p.isCancel(gitWorkflow)) { p.cancel('Đã huỷ'); process.exit(0) }

  // ── 2. Long-term memory ──────────────────────────────────────
  const memory = await p.select({
    message: 'Long-term memory:',
    options: [
      { value: 'file-based', label: 'File-based', hint: '.claude/memory/ — local, không cần gì thêm' },
      { value: 'mem0', label: 'mem0 / OpenMemory', hint: 'local-first, Docker: Qdrant + Postgres' },
      { value: 'obsidian', label: 'Obsidian MCP', hint: 'đồng bộ với Obsidian vault' },
      { value: 'letta', label: 'Letta', hint: 'stateful agents, tự host Docker' },
      { value: 'mempalace', label: 'MemPalace (thử nghiệm)', hint: 'knowledge graph local, cần Python + ChromaDB' },
      { value: 'claude-mem', label: 'claude-mem (thử nghiệm)', hint: 'session memory Claude Code, cần Bun + ChromaDB; PolyForm NC license' },
      { value: 'none', label: 'Không dùng' },
    ],
  })
  if (p.isCancel(memory)) { p.cancel('Đã huỷ'); process.exit(0) }

  // ── 3. Docs as code ──────────────────────────────────────────
  const docsAsCode = await p.confirm({
    message: 'Docs as code? (AGENTS.md, spec template, ADR structure, llms.txt)',
    initialValue: true,
  })
  if (p.isCancel(docsAsCode)) { p.cancel('Đã huỷ'); process.exit(0) }

  // ── 4. Workflow presets ──────────────────────────────────────
  const workflowPresets = await p.multiselect({
    message: 'Workflow presets:',
    initialValues: ['spec-driven', 'tdd', 'planning-first', 'quality-gates'],
    options: [
      { value: 'spec-driven', label: 'Spec-driven', hint: 'brainstorm → spec → plan → implement' },
      { value: 'tdd', label: 'TDD', hint: 'viết test failing trước khi implement' },
      { value: 'planning-first', label: 'Planning-first', hint: 'draft plan → review → implement' },
      { value: 'quality-gates', label: 'Quality gates', hint: 'test pass trước khi done (Stop hook)' },
      { value: 'parallel-agents', label: 'Parallel agents', hint: 'subagent cho các task độc lập' },
      { value: 'systematic-debugging', label: 'Systematic debugging', hint: 'reproduce → isolate → verify → fix' },
      { value: 'code-review-gates', label: 'Code review gates', hint: 'review trước khi commit/merge' },
      { value: 'security-review', label: 'Security review', hint: 'validate bash, chặn ops nguy hiểm' },
      { value: 'context-discipline', label: 'Context discipline', hint: 'fresh session rules, task decomp guide' },
    ],
    required: false,
  })
  if (p.isCancel(workflowPresets)) { p.cancel('Đã huỷ'); process.exit(0) }

  // ── 5. Browser automation ────────────────────────────────────
  const browserTools = await p.multiselect({
    message: 'Browser automation:',
    initialValues: ['playwright'],
    options: [
      { value: 'playwright', label: 'Playwright MCP', hint: 'accessibility snapshots, tạo E2E test' },
      { value: 'browser-use', label: 'browser-use', hint: 'Playwright điều khiển bằng ngôn ngữ tự nhiên' },
      { value: 'stagehand', label: 'Stagehand', hint: 'CDP-native, tự sửa selector khi DOM thay đổi' },
      { value: 'agent-browser', label: 'agent-browser', hint: 'snapshot tiết kiệm token (~200-400 token/trang)' },
    ],
    required: false,
  })
  if (p.isCancel(browserTools)) { p.cancel('Đã huỷ'); process.exit(0) }

  // ── 6. Web search ────────────────────────────────────────────
  const webSearch = await p.multiselect({
    message: 'Web search:',
    initialValues: ['tavily'],
    options: [
      { value: 'tavily', label: 'Tavily MCP', hint: 'agentic search, kết quả có cấu trúc, free tier' },
      { value: 'exa', label: 'Exa MCP', hint: 'tìm kiếm ngữ nghĩa, tối ưu cho code + GitHub' },
      { value: 'perplexity', label: 'Perplexity MCP', hint: 'tổng hợp câu trả lời, không chỉ links' },
      { value: 'brave-search', label: 'Brave Search MCP', hint: 'index độc lập, bảo vệ quyền riêng tư' },
    ],
    required: false,
  })
  if (p.isCancel(webSearch)) { p.cancel('Đã huỷ'); process.exit(0) }

  // ── 7. Web scrape ────────────────────────────────────────────
  const webScrape = await p.multiselect({
    message: 'Web scrape:',
    initialValues: ['firecrawl'],
    options: [
      { value: 'firecrawl', label: 'Firecrawl MCP', hint: 'HTML→markdown, hỗ trợ JS' },
      { value: 'crawl4ai', label: 'Crawl4AI MCP', hint: 'open source, tự host Docker' },
      { value: 'jina', label: 'Jina Reader MCP', hint: 'không cần config, miễn phí, scrape từng trang' },
      { value: 'spider', label: 'Spider.cloud MCP', hint: 'Rust, chống bot, crawl toàn site' },
    ],
    required: false,
  })
  if (p.isCancel(webScrape)) { p.cancel('Đã huỷ'); process.exit(0) }

  // ── 8. Library docs ──────────────────────────────────────────
  const libraryDocs = await p.multiselect({
    message: 'Library docs:',
    options: [
      { value: 'context7', label: 'Context7 MCP', hint: 'docs theo version cho mọi package' },
    ],
    required: false,
  })
  if (p.isCancel(libraryDocs)) { p.cancel('Đã huỷ'); process.exit(0) }

  // ── 9. Doc conversion ────────────────────────────────────────
  const docConversion = await p.multiselect({
    message: 'Chuyển đổi tài liệu:',
    options: [
      { value: 'markitdown', label: 'MarkItDown', hint: 'PDF/Word/HTML/audio → markdown (Python, local)' },
    ],
    required: false,
  })
  if (p.isCancel(docConversion)) { p.cancel('Đã huỷ'); process.exit(0) }

  // ── 10. Code execution ───────────────────────────────────────
  const codeExecution = await p.multiselect({
    message: 'Code execution sandbox:',
    options: [
      { value: 'e2b', label: 'E2B', hint: 'cloud sandbox bảo mật, tính tiền theo giây' },
      { value: 'daytona', label: 'Daytona', hint: 'cloud sandbox, khởi động dưới 100ms' },
    ],
    required: false,
  })
  if (p.isCancel(codeExecution)) { p.cancel('Đã huỷ'); process.exit(0) }

  // ── 11. Dev integrations ─────────────────────────────────────
  const devIntegrations = await p.multiselect({
    message: 'Dev integrations:',
    initialValues: ['github'],
    options: [
      { value: 'github', label: 'GitHub MCP', hint: 'issues, PRs, tìm kiếm code' },
      { value: 'linear', label: 'Linear MCP', hint: 'quản lý issue, OAuth' },
      { value: 'notion', label: 'Notion MCP', hint: 'docs + database' },
      { value: 'slack', label: 'Slack MCP', hint: 'nhắn tin, OAuth' },
      { value: 'atlassian', label: 'Atlassian MCP', hint: 'Jira + Confluence, OAuth, chỉ dùng Cloud' },
    ],
    required: false,
  })
  if (p.isCancel(devIntegrations)) { p.cancel('Đã huỷ'); process.exit(0) }

  // ── 12. Cloud & infra ────────────────────────────────────────
  const cloudInfra = await p.multiselect({
    message: 'Cloud & infra:',
    options: [
      { value: 'vercel', label: 'Vercel MCP', hint: 'deploy, domain, logs, env vars' },
      { value: 'cloudflare', label: 'Cloudflare MCP', hint: 'Workers, R2, D1, KV, AI Gateway' },
      { value: 'supabase', label: 'Supabase MCP', hint: 'Postgres + auth + storage' },
      { value: 'postgresql', label: 'PostgreSQL MCP', hint: 'truy vấn read-only (Anthropic official)' },
    ],
    required: false,
  })
  if (p.isCancel(cloudInfra)) { p.cancel('Đã huỷ'); process.exit(0) }

  // ── 13. Observability ────────────────────────────────────────
  const observability = await p.multiselect({
    message: 'Observability:',
    options: [
      { value: 'langfuse', label: 'Langfuse', hint: 'tracing, evals, quản lý prompt — self-hosted hoặc cloud' },
      { value: 'helicone', label: 'Helicone', hint: 'monitoring qua proxy, hỗ trợ 100+ model' },
    ],
    required: false,
  })
  if (p.isCancel(observability)) { p.cancel('Đã huỷ'); process.exit(0) }

  return {
    gitWorkflow: gitWorkflow as string[],
    memory: memory as WizardContext['memory'],
    docsAsCode: Boolean(docsAsCode),
    workflowPresets: workflowPresets as string[],
    browserTools: browserTools as string[],
    webSearch: webSearch as string[],
    webScrape: webScrape as string[],
    libraryDocs: libraryDocs as string[],
    docConversion: docConversion as string[],
    codeExecution: codeExecution as string[],
    devIntegrations: devIntegrations as string[],
    cloudInfra: cloudInfra as string[],
    observability: observability as string[],
  }
}
```

- [ ] **Bước 2: Build để kiểm tra TypeScript**

```bash
cd packages/harness-kit && pnpm build
```

Expected: Không có TypeScript error.

- [ ] **Bước 3: Commit**

```bash
git add src/wizard/steps/harness-config.ts
git commit -m "feat(wizard): restructure harness-config into 8 tool categories"
```

---

## Task 8: Cập nhật preview-apply.ts và viết test

**Files:**
- Sửa: `packages/harness-kit/src/wizard/steps/preview-apply.ts`
- Tạo: `packages/harness-kit/tests/wizard/preview-apply.test.ts`

- [ ] **Bước 1: Viết test failing cho collectMcpIds**

Tạo `tests/wizard/preview-apply.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { collectMcpIds } from '../../src/wizard/steps/preview-apply.js'
import type { WizardContext } from '../../src/wizard/types.js'

const baseCtx: WizardContext = {
  projectName: 'test',
  projectPurpose: '',
  projectUsers: '',
  projectConstraints: '',
  selectedTech: [],
  detectedIssues: [],
  installSelected: false,
  gitWorkflow: [],
  memory: 'file-based',
  docsAsCode: false,
  workflowPresets: [],
  browserTools: [],
  webSearch: [],
  webScrape: [],
  libraryDocs: [],
  docConversion: [],
  codeExecution: [],
  devIntegrations: [],
  cloudInfra: [],
  observability: [],
  aiGenerationEnabled: false,
}

describe('collectMcpIds', () => {
  it('gộp tất cả MCP tool id từ tất cả category fields', () => {
    const ctx: WizardContext = {
      ...baseCtx,
      browserTools: ['playwright'],
      webSearch: ['tavily'],
      webScrape: ['firecrawl'],
      libraryDocs: ['context7'],
      codeExecution: ['e2b'],
      devIntegrations: ['github', 'linear'],
      cloudInfra: ['vercel'],
      observability: ['langfuse'],
    }
    const ids = collectMcpIds(ctx)
    expect(ids).toEqual([
      'playwright', 'tavily', 'firecrawl', 'context7',
      'e2b', 'github', 'linear', 'vercel', 'langfuse',
    ])
  })

  it('không bao gồm field memory trong MCP ids', () => {
    // memory là string scalar, không phải array — không vào collectMcpIds
    // Filter installType: plugin xảy ra ở stepPreviewApply khi load manifest
    const ctx: WizardContext = { ...baseCtx, memory: 'claude-mem', devIntegrations: ['github'] }
    const ids = collectMcpIds(ctx)
    expect(ids).toEqual(['github'])
    expect(ids).not.toContain('claude-mem')
  })
})
```

- [ ] **Bước 2: Cập nhật preview-apply.ts**

Thay hàm `buildMcpList` và cập nhật `stepPreviewApply`:

```ts
import * as p from '@clack/prompts'
import chalk from 'chalk'
import { Listr } from 'listr2'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeScaffoldFile } from '../../engine/scaffolder.js'
import { renderTemplate } from '../../engine/template-renderer.js'
import { loadManifests } from '../../registry/loader.js'
import type { WizardContext } from '../types.js'
import type { ScaffoldFile } from '../../engine/scaffolder.js'

const REGISTRY_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../registry')

// Export để test có thể import
export function collectMcpIds(ctx: WizardContext): string[] {
  return [
    ...ctx.browserTools,
    ...ctx.webSearch,
    ...ctx.webScrape,
    ...ctx.libraryDocs,
    ...ctx.docConversion,
    ...ctx.codeExecution,
    ...ctx.devIntegrations,
    ...ctx.cloudInfra,
    ...ctx.observability,
  ]
}

function buildDependencyWarnings(manifests: Awaited<ReturnType<typeof loadManifests>>, selectedIds: string[]): string[] {
  const warnings: string[] = []
  for (const id of selectedIds) {
    const manifest = manifests.find((m) => m.name === id)
    if (manifest && manifest.requires.length > 0) {
      warnings.push(`${manifest.name} — cần ${manifest.requires.join(' + ')}`)
    }
  }
  return warnings
}

function buildModules(ctx: WizardContext): string[] {
  return [
    ...(ctx.gitWorkflow.includes('conventional-commits') ? ['rules/git-conventional'] : []),
    ...(ctx.selectedTech.some((t) => ['nextjs', 'react', 'vue', 'sveltekit', 'vanilla-ts'].includes(t)) ? ['rules/typescript'] : []),
    ...(ctx.workflowPresets.includes('tdd') ? ['skills/tdd-workflow'] : []),
    ...(ctx.workflowPresets.includes('spec-driven') ? ['skills/brainstorming'] : []),
    ...(ctx.gitWorkflow.includes('pre-commit-hooks') ? ['hooks/pre-commit'] : []),
    ...(ctx.workflowPresets.includes('quality-gates') ? ['hooks/quality-gate'] : []),
  ]
}

export async function stepPreviewApply(ctx: WizardContext): Promise<void> {
  const cwd = process.cwd()
  const allMcpIds = collectMcpIds(ctx)

  const allManifests = await loadManifests(REGISTRY_DIR)

  // Chỉ đưa vào mcp.json các tool có installType === 'mcp'
  const selectedManifests = allManifests.filter(
    (m): m is import('../../registry/types.js').McpManifest =>
      m.installType === 'mcp' && allMcpIds.includes(m.name)
  )
  const selectedIds = selectedManifests.map((m) => m.name)

  // Cảnh báo dependency
  const depWarnings = buildDependencyWarnings(allManifests, allMcpIds)

  const noteLines = [
    '── Core ──────────────────────────────────────────────',
    '  ✦ CLAUDE.md  (template)',
    '  ✦ AGENTS.md',
    '  ✦ harness.json',
    '  ✦ llms.txt',
    '── Claude config ─────────────────────────────────────',
    '  ✦ .claude/settings.json',
    `── MCP config (${selectedIds.length}) ──────────────────────────────────────`,
    `  ✦ .mcp.json  (${selectedIds.join(', ') || 'none'})`,
    ...(ctx.docsAsCode ? [
      '── Docs ──────────────────────────────────────────────',
      '  ✦ docs/DESIGN.md',
    ] : []),
    ...(depWarnings.length > 0 ? [
      '── Cần cài thêm ──────────────────────────────────────',
      ...depWarnings.map((w) => `  ⚠ ${w}`),
    ] : []),
  ]

  p.note(noteLines.join('\n'), 'Sẽ scaffold:')

  const confirm = await p.confirm({ message: 'Apply?', initialValue: true })
  if (p.isCancel(confirm) || !confirm) { p.cancel('Đã huỷ'); process.exit(0) }

  const modules = buildModules(ctx)
  const templateCtx = {
    ...ctx,
    mcp: selectedIds,
    mcpConfigs: selectedManifests,
    modules,
    aiGenerationEnabled: false,
  }

  const files: ScaffoldFile[] = []

  const tasks = new Listr([
    {
      title: 'Rendering templates...',
      task: async () => {
        files.push(
          { relativePath: 'CLAUDE.md', content: await renderTemplate('CLAUDE.md.hbs', templateCtx) },
          { relativePath: 'AGENTS.md', content: await renderTemplate('AGENTS.md.hbs', templateCtx) },
          { relativePath: 'harness.json', content: await renderTemplate('harness.json.hbs', templateCtx) },
          { relativePath: 'llms.txt', content: await renderTemplate('llms.txt.hbs', templateCtx) },
          { relativePath: '.claude/settings.json', content: await renderTemplate('settings.json.hbs', templateCtx) },
        )
        if (selectedIds.length > 0) {
          files.push({ relativePath: '.mcp.json', content: await renderTemplate('mcp.json.hbs', templateCtx) })
        }
        if (ctx.docsAsCode) {
          files.push({ relativePath: 'docs/DESIGN.md', content: `# ${ctx.projectName} — Design\n\n${ctx.projectPurpose}\n` })
        }
      },
    },
    {
      title: 'Writing files...',
      task: async () => {
        for (const file of files) {
          await writeScaffoldFile(cwd, file, 'overwrite')
        }
      },
    },
  ])

  await tasks.run()

  p.outro(`harness-kit initialized.\nRun: ${chalk.blue('harness-kit status')} to see your harness.`)
}
```

- [ ] **Bước 3: Chạy test**

```bash
cd packages/harness-kit && pnpm vitest run tests/wizard/
```

Expected: PASS.

- [ ] **Bước 4: Build để kiểm tra TypeScript**

```bash
pnpm build
```

Expected: Không có error.

- [ ] **Bước 5: Commit**

```bash
git add src/wizard/steps/preview-apply.ts tests/wizard/preview-apply.test.ts
git commit -m "feat(wizard): update buildMcpList for new categories, add dependency warnings"
```

---

## Task 9: Cập nhật template mcp.json.hbs

**Files:**
- Sửa: `packages/harness-kit/templates/mcp.json.hbs`

Template hiện tại đã dùng `mcpConfigs` (không dùng trực tiếp `webCrawl` hay `otherMcp`) nên chỉ cần kiểm tra và xác nhận không có reference cũ nào còn sót.

- [ ] **Bước 1: Kiểm tra template**

Đọc `templates/mcp.json.hbs` — xác nhận không có `webCrawl`, `otherMcp` trong template.

Template hiện tại dùng `{{#each mcpConfigs}}` — `mcpConfigs` được build trong `preview-apply.ts` từ `selectedManifests`. Không cần thay đổi template.

- [ ] **Bước 2: Kiểm tra các template khác**

```bash
grep -r "webCrawl\|otherMcp" packages/harness-kit/templates/
```

Expected: Không có kết quả.

- [ ] **Bước 3: Build và chạy toàn bộ test**

```bash
cd packages/harness-kit && pnpm build && pnpm vitest run
```

Expected: Build thành công, tất cả test PASS.

- [ ] **Bước 4: Commit nếu có thay đổi, hoặc ghi nhận không cần thay đổi**

Nếu không có thay đổi:
```bash
git commit --allow-empty -m "chore: verify mcp.json.hbs template — no changes needed"
```

Nếu có sửa:
```bash
git add templates/mcp.json.hbs
git commit -m "fix(template): update mcp.json.hbs field references"
```

---

## Task 10: Build cuối và kiểm tra toàn bộ

- [ ] **Bước 1: Chạy toàn bộ test suite**

```bash
cd packages/harness-kit && pnpm vitest run
```

Expected: Tất cả PASS.

- [ ] **Bước 2: Build production**

```bash
pnpm -r build
```

Expected: Build thành công không có warning.

- [ ] **Bước 3: Chạy wizard thủ công để kiểm tra UX**

```bash
node dist/index.js
```

Kiểm tra:
- 8 category prompt hiển thị đúng
- Tool có `(thử nghiệm)` hiển thị rõ trong hint
- Cảnh báo dependency hiển thị trước khi apply nếu có tool cần Docker/Python

- [ ] **Bước 4: Commit tổng kết nếu cần**

Nếu có fix nhỏ phát sinh từ bước kiểm tra thủ công, commit riêng với message mô tả cụ thể.
