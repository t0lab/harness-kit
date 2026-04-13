# Bundle Registry Redesign — Kế hoạch triển khai

> **Dành cho agentic workers:** BẮT BUỘC DÙNG SUB-SKILL: superpowers:subagent-driven-development (khuyến nghị) hoặc superpowers:executing-plans để implement từng task. Các bước dùng cú pháp checkbox (`- [ ]`) để theo dõi tiến độ.

**Mục tiêu:** Thay thế JSON manifests phẳng và `AnyManifest` discriminated union bằng `BundleManifest` TypeScript có kiểu, một barrel registry index, và wizard tải động từ registry.

**Kiến trúc:** `BundleManifest` có `common` artifacts (cài cho mọi role) và `roles: Partial<Record<BundleCategory, ...>>` (artifacts + requires theo role). Toàn bộ 25 bundle manifests nằm trong `src/registry/bundles/<name>/manifest.ts` và được re-export qua `src/registry/index.ts`. Wizard gọi `getBundlesByCategory()` cho các zone tool/MCP; zone git-workflow và workflow-preset vẫn hardcode tạm thời (các bundle cho zone đó chưa tồn tại). `loader.ts` bị xóa.

**Tech Stack:** TypeScript 5, vitest, tsup, @clack/prompts, xstate, pnpm workspaces. Toàn bộ thao tác trong `packages/harness-kit/`.

---

## Bản đồ file

**Tạo mới:**
- `src/registry/bundles/tavily/manifest.ts` — search bundle (ví dụ MCP)
- `src/registry/bundles/mem0/manifest.ts` — memory bundle (ví dụ multi-role)
- `src/registry/bundles/playwright/manifest.ts`
- `src/registry/bundles/browser-use/manifest.ts`
- `src/registry/bundles/agent-browser/manifest.ts`
- `src/registry/bundles/brave-search/manifest.ts`
- `src/registry/bundles/exa/manifest.ts`
- `src/registry/bundles/perplexity/manifest.ts`
- `src/registry/bundles/firecrawl/manifest.ts`
- `src/registry/bundles/crawl4ai/manifest.ts`
- `src/registry/bundles/jina/manifest.ts`
- `src/registry/bundles/context7/manifest.ts`
- `src/registry/bundles/markitdown/manifest.ts`
- `src/registry/bundles/e2b/manifest.ts`
- `src/registry/bundles/github/manifest.ts`
- `src/registry/bundles/notion/manifest.ts`
- `src/registry/bundles/slack/manifest.ts`
- `src/registry/bundles/vercel/manifest.ts`
- `src/registry/bundles/cloudflare/manifest.ts`
- `src/registry/bundles/supabase/manifest.ts`
- `src/registry/bundles/postgresql/manifest.ts`
- `src/registry/bundles/obsidian/manifest.ts`
- `src/registry/bundles/mempalace/manifest.ts`
- `src/registry/bundles/claude-mem/manifest.ts`
- `src/registry/bundles/docs-as-code/manifest.ts`
- `src/registry/index.ts`
- `tests/registry/index.test.ts`

**Sửa đổi:**
- `src/registry/types.ts` — viết lại hoàn toàn
- `src/wizard/types.ts` — xóa `docsAsCode`, đổi kiểu `memory`
- `src/wizard/index.ts` — cập nhật `initialContext`
- `src/wizard/steps/harness-config.ts` — dùng `getBundlesByCategory()` động cho các zone tool/MCP
- `src/wizard/steps/preview-apply.ts` — dùng `getBundle()`, xóa `REGISTRY_DIR`
- `tests/wizard/preview-apply.test.ts` — cập nhật cho API mới

**Xóa (Task 10):**
- `src/registry/loader.ts`
- `tests/registry/loader.test.ts`
- `registry/mcp/*/manifest.json` (21 file)
- `registry/tools/*/manifest.json` (2 file)
- `registry/plugins/*/manifest.json` (1 file)

---

## Task 1: Tạo mới `src/registry/types.ts`

**Files:**
- Sửa: `packages/harness-kit/src/registry/types.ts`

- [ ] **Bước 1: Thay toàn bộ file bằng types mới**

```ts
// packages/harness-kit/src/registry/types.ts

export type BundleCategory =
  | 'git-workflow'
  | 'workflow-preset'
  | 'memory'
  | 'browser'
  | 'search'
  | 'scrape'
  | 'library-docs'
  | 'doc-conversion'
  | 'code-execution'
  | 'dev-integration'
  | 'cloud-infra'
  | 'observability'
  | 'mcp-tool'

export type ClaudeHookType = 'PreToolUse' | 'PostToolUse' | 'Stop' | 'Notification'
export type GitHookName = 'pre-commit' | 'commit-msg' | 'pre-push'

export type Artifact =
  | { type: 'mcp';      command: string; args: string[]; env?: Record<string, string> }
  | { type: 'skill';    src: string; dest: string }
  | { type: 'tool';     installCmd: string }
  | { type: 'plugin';   installSource: string }
  | { type: 'hook';     src: string; dest: string; hookType: ClaudeHookType; matcher?: string }
  | { type: 'git-hook'; src: string; hookName: GitHookName }
  | { type: 'rule';     src: string; dest: string }
  | { type: 'agent';    src: string; dest: string }
  | { type: 'command';  src: string; dest: string }
  | { type: 'file';     src: string; dest: string }

export interface EnvVar {
  key: string
  description: string
  required: boolean
  default?: string
}

export interface BundleManifest {
  name: string
  description: string
  version: string
  experimental: boolean
  defaultRole: string
  common: {
    artifacts: Artifact[]
    env?: EnvVar[]
    requires?: string[]
  }
  roles: Partial<Record<BundleCategory, {
    artifacts: Artifact[]
    env?: EnvVar[]
    requires?: string[]
  }>>
}
```

- [ ] **Bước 2: Kiểm tra TypeScript không có lỗi**

Chạy: `cd packages/harness-kit && pnpm tsc --noEmit 2>&1 | head -20`

Kỳ vọng: Chỉ có lỗi ở các file import types cũ (loader.ts, preview-apply.ts) — sẽ fix ở các task sau. Không có lỗi trong `types.ts`.

- [ ] **Bước 3: Commit**

```bash
git add packages/harness-kit/src/registry/types.ts
git commit -m "refactor(registry): replace AnyManifest with BundleManifest types"
```

---

## Task 2: Bundle manifest đầu tiên — `tavily` (pattern MCP single-role)

**Files:**
- Tạo: `packages/harness-kit/src/registry/bundles/tavily/manifest.ts`
- Test: `packages/harness-kit/tests/registry/bundles/tavily.test.ts`

- [ ] **Bước 1: Viết test thất bại**

```ts
// packages/harness-kit/tests/registry/bundles/tavily.test.ts
import { describe, it, expect } from 'vitest'
import { manifest } from '../../../src/registry/bundles/tavily/manifest.js'

describe('tavily manifest', () => {
  it('has correct name and defaultRole', () => {
    expect(manifest.name).toBe('tavily')
    expect(manifest.defaultRole).toBe('search')
  })

  it('has MCP artifact in common', () => {
    const mcp = manifest.common.artifacts.find(a => a.type === 'mcp')
    expect(mcp).toBeDefined()
    if (mcp?.type === 'mcp') {
      expect(mcp.command).toBe('npx')
      expect(mcp.args).toContain('tavily-mcp@0.1.4')
    }
  })

  it('has search role', () => {
    expect(manifest.roles['search']).toBeDefined()
  })

  it('has TAVILY_API_KEY env var', () => {
    const envKey = manifest.common.env?.find(e => e.key === 'TAVILY_API_KEY')
    expect(envKey).toBeDefined()
    expect(envKey?.required).toBe(true)
  })
})
```

- [ ] **Bước 2: Chạy test — xác nhận thất bại**

Chạy: `cd packages/harness-kit && pnpm vitest run tests/registry/bundles/tavily.test.ts`
Kỳ vọng: FAIL — "Cannot find module"

- [ ] **Bước 3: Tạo manifest**

```ts
// packages/harness-kit/src/registry/bundles/tavily/manifest.ts
import type { BundleManifest } from '../../types.js'

export const manifest: BundleManifest = {
  name: 'tavily',
  description: 'Tavily — agentic search, structured results, free tier',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'search',
  common: {
    artifacts: [
      {
        type: 'mcp',
        command: 'npx',
        args: ['-y', 'tavily-mcp@0.1.4'],
        env: { TAVILY_API_KEY: '${TAVILY_API_KEY}' },
      },
    ],
    env: [{ key: 'TAVILY_API_KEY', description: 'API key từ app.tavily.com', required: true }],
  },
  roles: {
    search: { artifacts: [] },
  },
}
```

- [ ] **Bước 4: Chạy test — xác nhận thành công**

Chạy: `cd packages/harness-kit && pnpm vitest run tests/registry/bundles/tavily.test.ts`
Kỳ vọng: PASS

- [ ] **Bước 5: Commit**

```bash
git add packages/harness-kit/src/registry/bundles/tavily/ packages/harness-kit/tests/registry/bundles/
git commit -m "feat(registry): add tavily bundle manifest (TypeScript)"
```

---

## Task 3: Bundle manifest multi-role — `mem0`

**Files:**
- Tạo: `packages/harness-kit/src/registry/bundles/mem0/manifest.ts`
- Test: `packages/harness-kit/tests/registry/bundles/mem0.test.ts`

- [ ] **Bước 1: Viết test thất bại**

```ts
// packages/harness-kit/tests/registry/bundles/mem0.test.ts
import { describe, it, expect } from 'vitest'
import { manifest } from '../../../src/registry/bundles/mem0/manifest.js'

describe('mem0 manifest', () => {
  it('has defaultRole memory and mcp-tool extra role', () => {
    expect(manifest.defaultRole).toBe('memory')
    expect(manifest.roles['memory']).toBeDefined()
    expect(manifest.roles['mcp-tool']).toBeDefined()
  })

  it('memory role has docker requires', () => {
    expect(manifest.roles['memory']?.requires).toContain('docker')
  })

  it('MCP artifact is in common (shared across roles)', () => {
    const mcp = manifest.common.artifacts.find(a => a.type === 'mcp')
    expect(mcp).toBeDefined()
  })

  it('mcp-tool role has no requires', () => {
    expect(manifest.roles['mcp-tool']?.requires ?? []).toHaveLength(0)
  })
})
```

- [ ] **Bước 2: Chạy test — xác nhận thất bại**

Chạy: `cd packages/harness-kit && pnpm vitest run tests/registry/bundles/mem0.test.ts`
Kỳ vọng: FAIL

- [ ] **Bước 3: Tạo manifest**

```ts
// packages/harness-kit/src/registry/bundles/mem0/manifest.ts
import type { BundleManifest } from '../../types.js'

export const manifest: BundleManifest = {
  name: 'mem0',
  description: 'mem0 / OpenMemory — local-first, Docker: Qdrant + Postgres',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'memory',
  common: {
    artifacts: [
      {
        type: 'mcp',
        command: 'npx',
        args: ['-y', '@mem0/mcp-server'],
        env: { MEM0_API_KEY: '${MEM0_API_KEY}' },
      },
    ],
    env: [{ key: 'MEM0_API_KEY', description: 'API key từ app.mem0.ai', required: true }],
  },
  roles: {
    memory: {
      artifacts: [],
      requires: ['docker'],
    },
    'mcp-tool': {
      artifacts: [],
    },
  },
}
```

- [ ] **Bước 4: Chạy test — xác nhận thành công**

Chạy: `cd packages/harness-kit && pnpm vitest run tests/registry/bundles/mem0.test.ts`
Kỳ vọng: PASS

- [ ] **Bước 5: Commit**

```bash
git add packages/harness-kit/src/registry/bundles/mem0/ packages/harness-kit/tests/registry/bundles/mem0.test.ts
git commit -m "feat(registry): add mem0 bundle manifest with memory + mcp-tool roles"
```

---

## Task 4: 23 bundle manifests còn lại

**Files:**
- Tạo: `src/registry/bundles/<name>/manifest.ts` cho mỗi bundle bên dưới

Không cần test riêng cho từng bundle — barrel index test ở Task 5 bao phủ tất cả. TypeScript compilation là bước kiểm tra.

- [ ] **Bước 1: Tạo 23 file manifest theo code bên dưới**

**Browser bundles:**

```ts
// src/registry/bundles/playwright/manifest.ts
import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'playwright',
  description: 'Playwright — accessibility snapshots, E2E test generation',
  version: '1.0.0', experimental: false, defaultRole: 'browser',
  common: { artifacts: [{ type: 'mcp', command: 'npx', args: ['@playwright/mcp@latest'] }] },
  roles: { browser: { artifacts: [] } },
}
```

```ts
// src/registry/bundles/browser-use/manifest.ts
import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'browser-use',
  description: 'browser-use — Playwright driven by natural language',
  version: '1.0.0', experimental: false, defaultRole: 'browser',
  common: {
    artifacts: [{ type: 'mcp', command: 'uvx', args: ['browser-use-mcp-server'], env: { ANTHROPIC_API_KEY: '${ANTHROPIC_API_KEY}' } }],
    env: [{ key: 'ANTHROPIC_API_KEY', description: 'Anthropic API key', required: true }],
  },
  roles: { browser: { artifacts: [] } },
}
```

```ts
// src/registry/bundles/agent-browser/manifest.ts
import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'agent-browser',
  description: 'Token-efficient browser automation via accessibility snapshots (~200-400 tokens/page)',
  version: '1.0.0', experimental: false, defaultRole: 'browser',
  common: { artifacts: [{ type: 'tool', installCmd: 'npm install -g agent-browser' }] },
  roles: { browser: { artifacts: [] } },
}
```

**Search bundles:**

```ts
// src/registry/bundles/exa/manifest.ts
import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'exa',
  description: 'Exa — semantic search, optimized for code + GitHub',
  version: '1.0.0', experimental: false, defaultRole: 'search',
  common: {
    artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', 'exa-mcp-server'], env: { EXA_API_KEY: '${EXA_API_KEY}' } }],
    env: [{ key: 'EXA_API_KEY', description: 'API key từ exa.ai', required: true }],
  },
  roles: { search: { artifacts: [] } },
}
```

```ts
// src/registry/bundles/perplexity/manifest.ts
import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'perplexity',
  description: 'Perplexity — synthesized answers, not just links',
  version: '1.0.0', experimental: false, defaultRole: 'search',
  common: {
    artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', '@perplexity-ai/mcp-server'], env: { PERPLEXITY_API_KEY: '${PERPLEXITY_API_KEY}' } }],
    env: [{ key: 'PERPLEXITY_API_KEY', description: 'API key từ perplexity.ai', required: true }],
  },
  roles: { search: { artifacts: [] } },
}
```

```ts
// src/registry/bundles/brave-search/manifest.ts
import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'brave-search',
  description: 'Brave Search — independent index, privacy-focused',
  version: '1.0.0', experimental: false, defaultRole: 'search',
  common: {
    artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', '@modelcontextprotocol/server-brave-search'], env: { BRAVE_API_KEY: '${BRAVE_API_KEY}' } }],
    env: [{ key: 'BRAVE_API_KEY', description: 'API key từ brave.com/search/api', required: true }],
  },
  roles: { search: { artifacts: [] } },
}
```

**Scrape bundles:**

```ts
// src/registry/bundles/firecrawl/manifest.ts
import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'firecrawl',
  description: 'Firecrawl — HTML→markdown, JS-enabled scraping',
  version: '1.0.0', experimental: false, defaultRole: 'scrape',
  common: {
    artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', 'firecrawl-mcp'], env: { FIRECRAWL_API_KEY: '${FIRECRAWL_API_KEY}' } }],
    env: [{ key: 'FIRECRAWL_API_KEY', description: 'API key từ firecrawl.dev', required: true }],
  },
  roles: { scrape: { artifacts: [] } },
}
```

```ts
// src/registry/bundles/crawl4ai/manifest.ts
import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'crawl4ai',
  description: 'Crawl4AI — open source web scraping, self-hosted Docker',
  version: '1.0.0', experimental: false, defaultRole: 'scrape',
  common: { artifacts: [{ type: 'mcp', command: 'uvx', args: ['crawl4ai-mcp'] }] },
  roles: { scrape: { artifacts: [], requires: ['docker'] } },
}
```

```ts
// src/registry/bundles/jina/manifest.ts
import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'jina',
  description: 'Jina Reader — no config needed, free, single-page scraping',
  version: '1.0.0', experimental: false, defaultRole: 'scrape',
  common: {
    artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', '@jina-ai/mcp-server-jina'], env: { JINA_API_KEY: '${JINA_API_KEY}' } }],
    env: [{ key: 'JINA_API_KEY', description: 'API key từ jina.ai (optional, free tier)', required: false }],
  },
  roles: { scrape: { artifacts: [] } },
}
```

**Library docs:**

```ts
// src/registry/bundles/context7/manifest.ts
import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'context7',
  description: 'Context7 — version-specific docs for any package',
  version: '1.0.0', experimental: false, defaultRole: 'library-docs',
  common: { artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', '@upstash/context7-mcp'] }] },
  roles: { 'library-docs': { artifacts: [] } },
}
```

**Doc conversion:**

```ts
// src/registry/bundles/markitdown/manifest.ts
import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'markitdown',
  description: 'PDF/Word/HTML/audio → markdown (Python local)',
  version: '1.0.0', experimental: false, defaultRole: 'doc-conversion',
  common: { artifacts: [{ type: 'tool', installCmd: 'pip install markitdown' }] },
  roles: { 'doc-conversion': { artifacts: [], requires: ['python'] } },
}
```

**Code execution:**

```ts
// src/registry/bundles/e2b/manifest.ts
import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'e2b',
  description: 'E2B — secure cloud sandbox, billed per second',
  version: '1.0.0', experimental: false, defaultRole: 'code-execution',
  common: {
    artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', '@e2b/mcp-server'], env: { E2B_API_KEY: '${E2B_API_KEY}' } }],
    env: [{ key: 'E2B_API_KEY', description: 'API key từ e2b.dev', required: true }],
  },
  roles: { 'code-execution': { artifacts: [] } },
}
```

**Dev integrations:**

```ts
// src/registry/bundles/github/manifest.ts
import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'github',
  description: 'GitHub — repos, issues, PRs, code search',
  version: '1.0.0', experimental: false, defaultRole: 'dev-integration',
  common: {
    artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'], env: { GITHUB_PERSONAL_ACCESS_TOKEN: '${GITHUB_PERSONAL_ACCESS_TOKEN}' } }],
    env: [{ key: 'GITHUB_PERSONAL_ACCESS_TOKEN', description: 'GitHub personal access token', required: true }],
  },
  roles: { 'dev-integration': { artifacts: [] } },
}
```

```ts
// src/registry/bundles/notion/manifest.ts
import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'notion',
  description: 'Notion — docs + database',
  version: '1.0.0', experimental: false, defaultRole: 'dev-integration',
  common: {
    artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', '@notionhq/notion-mcp-server'], env: { NOTION_API_KEY: '${NOTION_API_KEY}' } }],
    env: [{ key: 'NOTION_API_KEY', description: 'Integration token từ notion.so/my-integrations', required: true }],
  },
  roles: { 'dev-integration': { artifacts: [] } },
}
```

```ts
// src/registry/bundles/slack/manifest.ts
import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'slack',
  description: 'Slack — messaging, OAuth',
  version: '1.0.0', experimental: false, defaultRole: 'dev-integration',
  common: {
    artifacts: [{
      type: 'mcp', command: 'npx', args: ['-y', '@modelcontextprotocol/server-slack'],
      env: { SLACK_BOT_TOKEN: '${SLACK_BOT_TOKEN}', SLACK_TEAM_ID: '${SLACK_TEAM_ID}' },
    }],
    env: [
      { key: 'SLACK_BOT_TOKEN', description: 'Bot token từ Slack app settings', required: true },
      { key: 'SLACK_TEAM_ID', description: 'Team/workspace ID', required: true },
    ],
  },
  roles: { 'dev-integration': { artifacts: [] } },
}
```

**Cloud infra:**

```ts
// src/registry/bundles/vercel/manifest.ts
import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'vercel',
  description: 'Vercel — deployments, domains, logs, env vars',
  version: '1.0.0', experimental: false, defaultRole: 'cloud-infra',
  common: {
    artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', '@vercel/mcp-adapter'], env: { VERCEL_TOKEN: '${VERCEL_TOKEN}' } }],
    env: [{ key: 'VERCEL_TOKEN', description: 'API token từ vercel.com/account/tokens', required: true }],
  },
  roles: { 'cloud-infra': { artifacts: [] } },
}
```

```ts
// src/registry/bundles/cloudflare/manifest.ts
import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'cloudflare',
  description: 'Cloudflare — Workers, R2, D1, KV, AI Gateway',
  version: '1.0.0', experimental: false, defaultRole: 'cloud-infra',
  common: { artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', '@cloudflare/mcp-server-cloudflare'] }] },
  roles: { 'cloud-infra': { artifacts: [] } },
}
```

```ts
// src/registry/bundles/supabase/manifest.ts
import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'supabase',
  description: 'Supabase — Postgres + auth + storage',
  version: '1.0.0', experimental: false, defaultRole: 'cloud-infra',
  common: {
    artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', '@supabase/mcp-server-supabase@latest'], env: { SUPABASE_ACCESS_TOKEN: '${SUPABASE_ACCESS_TOKEN}' } }],
    env: [{ key: 'SUPABASE_ACCESS_TOKEN', description: 'Access token từ supabase.com/dashboard/account/tokens', required: true }],
  },
  roles: { 'cloud-infra': { artifacts: [] } },
}
```

```ts
// src/registry/bundles/postgresql/manifest.ts
import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'postgresql',
  description: 'PostgreSQL — read-only queries (Anthropic official)',
  version: '1.0.0', experimental: false, defaultRole: 'cloud-infra',
  common: {
    artifacts: [{ type: 'mcp', command: 'npx', args: ['-y', '@modelcontextprotocol/server-postgres'], env: { POSTGRES_CONNECTION_STRING: '${POSTGRES_CONNECTION_STRING}' } }],
    env: [{ key: 'POSTGRES_CONNECTION_STRING', description: 'PostgreSQL connection string (postgres://user:pass@host/db)', required: true }],
  },
  roles: { 'cloud-infra': { artifacts: [] } },
}
```

**Memory bundles:**

```ts
// src/registry/bundles/obsidian/manifest.ts
import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'obsidian',
  description: 'Obsidian — sync with Obsidian vault',
  version: '1.0.0', experimental: false, defaultRole: 'memory',
  common: {
    artifacts: [{
      type: 'mcp', command: 'npx', args: ['-y', 'obsidian-mcp-server'],
      env: { OBSIDIAN_API_KEY: '${OBSIDIAN_API_KEY}', OBSIDIAN_HOST: 'http://localhost:27123' },
    }],
    env: [
      { key: 'OBSIDIAN_API_KEY', description: 'API key từ Obsidian Local REST API plugin', required: true },
      { key: 'OBSIDIAN_HOST', description: 'Obsidian REST API host', required: false, default: 'http://localhost:27123' },
    ],
  },
  roles: { memory: { artifacts: [] } },
}
```

```ts
// src/registry/bundles/mempalace/manifest.ts
import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'mempalace',
  description: 'MemPalace — local knowledge graph, 19 tools (needs Python + ChromaDB)',
  version: '1.0.0', experimental: true, defaultRole: 'memory',
  common: { artifacts: [{ type: 'mcp', command: 'uvx', args: ['mempalace'] }] },
  roles: { memory: { artifacts: [], requires: ['python', 'chromadb'] } },
}
```

```ts
// src/registry/bundles/claude-mem/manifest.ts
import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'claude-mem',
  description: 'Session memory for Claude Code, hybrid semantic search (PolyForm NC license)',
  version: '1.0.0', experimental: true, defaultRole: 'memory',
  common: { artifacts: [{ type: 'plugin', installSource: 'github:thedotmack/claude-mem' }] },
  roles: { memory: { artifacts: [], requires: ['bun', 'chromadb', 'sqlite'] } },
}
```

**Workflow preset:**

```ts
// src/registry/bundles/docs-as-code/manifest.ts
import type { BundleManifest } from '../../types.js'
export const manifest: BundleManifest = {
  name: 'docs-as-code',
  description: 'AGENTS.md, spec template, ADR structure, llms.txt',
  version: '1.0.0', experimental: false, defaultRole: 'workflow-preset',
  common: { artifacts: [] },
  roles: { 'workflow-preset': { artifacts: [] } },
}
```

- [ ] **Bước 2: Kiểm tra TypeScript compile thành công**

Chạy: `cd packages/harness-kit && pnpm tsc --noEmit 2>&1 | grep "bundles"`
Kỳ vọng: Không có lỗi trong `src/registry/bundles/`

- [ ] **Bước 3: Commit**

```bash
git add packages/harness-kit/src/registry/bundles/
git commit -m "feat(registry): add 23 bundle manifests as TypeScript"
```

---

## Task 5: Tạo `src/registry/index.ts` + tests

**Files:**
- Tạo: `packages/harness-kit/src/registry/index.ts`
- Tạo: `packages/harness-kit/tests/registry/index.test.ts`

- [ ] **Bước 1: Viết tests thất bại**

```ts
// packages/harness-kit/tests/registry/index.test.ts
import { describe, it, expect } from 'vitest'
import { getAllBundles, getBundlesByCategory, getBundle } from '../../src/registry/index.js'

describe('getAllBundles', () => {
  it('returns at least 25 bundles', () => {
    expect(getAllBundles().length).toBeGreaterThanOrEqual(25)
  })

  it('every bundle has required fields', () => {
    for (const b of getAllBundles()) {
      expect(b.name).toBeTruthy()
      expect(b.defaultRole).toBeTruthy()
      expect(b.common).toBeDefined()
      expect(b.roles).toBeDefined()
    }
  })

  it('no duplicate names', () => {
    const names = getAllBundles().map(b => b.name)
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('getBundlesByCategory', () => {
  it('returns search bundles: tavily, exa, perplexity, brave-search', () => {
    const names = getBundlesByCategory('search').map(b => b.name)
    expect(names).toContain('tavily')
    expect(names).toContain('exa')
    expect(names).toContain('perplexity')
    expect(names).toContain('brave-search')
  })

  it('returns browser bundles: playwright, browser-use, agent-browser', () => {
    const names = getBundlesByCategory('browser').map(b => b.name)
    expect(names).toContain('playwright')
    expect(names).toContain('browser-use')
    expect(names).toContain('agent-browser')
  })

  it('returns memory bundles: mem0, obsidian, mempalace, claude-mem', () => {
    const names = getBundlesByCategory('memory').map(b => b.name)
    expect(names).toContain('mem0')
    expect(names).toContain('obsidian')
    expect(names).toContain('mempalace')
    expect(names).toContain('claude-mem')
  })

  it('mem0 also appears in mcp-tool category', () => {
    const names = getBundlesByCategory('mcp-tool').map(b => b.name)
    expect(names).toContain('mem0')
  })

  it('returns empty array for category with no bundles', () => {
    expect(getBundlesByCategory('observability')).toHaveLength(0)
  })
})

describe('getBundle', () => {
  it('returns bundle by name', () => {
    const b = getBundle('tavily')
    expect(b.name).toBe('tavily')
  })

  it('throws for unknown bundle name', () => {
    expect(() => getBundle('nonexistent')).toThrow('Bundle not found: nonexistent')
  })
})
```

- [ ] **Bước 2: Chạy test — xác nhận thất bại**

Chạy: `cd packages/harness-kit && pnpm vitest run tests/registry/index.test.ts`
Kỳ vọng: FAIL — "Cannot find module"

- [ ] **Bước 3: Tạo `src/registry/index.ts`**

```ts
// packages/harness-kit/src/registry/index.ts
import type { BundleManifest, BundleCategory } from './types.js'

import { manifest as tavilyM }       from './bundles/tavily/manifest.js'
import { manifest as mem0M }         from './bundles/mem0/manifest.js'
import { manifest as playwrightM }   from './bundles/playwright/manifest.js'
import { manifest as browserUseM }   from './bundles/browser-use/manifest.js'
import { manifest as agentBrowserM } from './bundles/agent-browser/manifest.js'
import { manifest as braveSearchM }  from './bundles/brave-search/manifest.js'
import { manifest as exaM }          from './bundles/exa/manifest.js'
import { manifest as perplexityM }   from './bundles/perplexity/manifest.js'
import { manifest as firecrawlM }    from './bundles/firecrawl/manifest.js'
import { manifest as crawl4aiM }     from './bundles/crawl4ai/manifest.js'
import { manifest as jinaM }         from './bundles/jina/manifest.js'
import { manifest as context7M }     from './bundles/context7/manifest.js'
import { manifest as markitdownM }   from './bundles/markitdown/manifest.js'
import { manifest as e2bM }          from './bundles/e2b/manifest.js'
import { manifest as githubM }       from './bundles/github/manifest.js'
import { manifest as notionM }       from './bundles/notion/manifest.js'
import { manifest as slackM }        from './bundles/slack/manifest.js'
import { manifest as vercelM }       from './bundles/vercel/manifest.js'
import { manifest as cloudflareM }   from './bundles/cloudflare/manifest.js'
import { manifest as supabaseM }     from './bundles/supabase/manifest.js'
import { manifest as postgresqlM }   from './bundles/postgresql/manifest.js'
import { manifest as obsidianM }     from './bundles/obsidian/manifest.js'
import { manifest as mempalaceM }    from './bundles/mempalace/manifest.js'
import { manifest as claudeMemM }    from './bundles/claude-mem/manifest.js'
import { manifest as docsAsCodeM }   from './bundles/docs-as-code/manifest.js'

const ALL_BUNDLES: BundleManifest[] = [
  tavilyM, mem0M, playwrightM, browserUseM, agentBrowserM,
  braveSearchM, exaM, perplexityM, firecrawlM, crawl4aiM,
  jinaM, context7M, markitdownM, e2bM, githubM,
  notionM, slackM, vercelM, cloudflareM, supabaseM,
  postgresqlM, obsidianM, mempalaceM, claudeMemM, docsAsCodeM,
]

export function getAllBundles(): BundleManifest[] {
  return ALL_BUNDLES
}

export function getBundlesByCategory(category: BundleCategory): BundleManifest[] {
  return ALL_BUNDLES.filter((b) => category in b.roles)
}

export function getBundle(name: string): BundleManifest {
  const bundle = ALL_BUNDLES.find((b) => b.name === name)
  if (!bundle) throw new Error(`Bundle not found: ${name}`)
  return bundle
}
```

- [ ] **Bước 4: Chạy tests — xác nhận thành công**

Chạy: `cd packages/harness-kit && pnpm vitest run tests/registry/index.test.ts`
Kỳ vọng: PASS

- [ ] **Bước 5: Commit**

```bash
git add packages/harness-kit/src/registry/index.ts packages/harness-kit/tests/registry/index.test.ts
git commit -m "feat(registry): add barrel index with getAllBundles, getBundlesByCategory, getBundle"
```

---

## Task 6: Cập nhật `WizardContext` và `initialContext`

**Files:**
- Sửa: `packages/harness-kit/src/wizard/types.ts`
- Sửa: `packages/harness-kit/src/wizard/index.ts`

- [ ] **Bước 1: Cập nhật `src/wizard/types.ts`**

Xóa `docsAsCode: boolean`. Đổi `memory` từ union type sang `string`.

```ts
// packages/harness-kit/src/wizard/types.ts
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
  memory: string              // 'none' | 'file-based' | tên bundle
  workflowPresets: string[]   // 'docs-as-code' thay cho boolean docsAsCode cũ
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

- [ ] **Bước 2: Cập nhật `initialContext` trong `src/wizard/index.ts`**

Thay thế dòng 11-33 (object `initialContext`):

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
  workflowPresets: ['spec-driven', 'tdd', 'planning-first', 'quality-gates', 'docs-as-code'],
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

Lưu ý: `docsAsCode: true` → `'docs-as-code'` được thêm vào `workflowPresets`.

- [ ] **Bước 3: Kiểm tra TypeScript compile**

Chạy: `cd packages/harness-kit && pnpm tsc --noEmit 2>&1 | grep -v "loader\|preview-apply\|harness-config" | head -20`
Kỳ vọng: Chỉ còn lỗi ở các file sẽ được refactor ở task sau.

- [ ] **Bước 4: Commit**

```bash
git add packages/harness-kit/src/wizard/types.ts packages/harness-kit/src/wizard/index.ts
git commit -m "refactor(wizard): remove docsAsCode field, change memory to string"
```

---

## Task 7: Refactor `harness-config.ts` — tải động từ registry

**Files:**
- Sửa: `packages/harness-kit/src/wizard/steps/harness-config.ts`

Các zone tool/MCP (browser, search, scrape, library-docs, doc-conversion, code-execution, dev-integration, cloud-infra, observability, memory) giờ đọc options từ `getBundlesByCategory()`. Zone git-workflow và workflow-preset vẫn hardcode (chưa có bundles cho các zone đó). Prompt `docsAsCode` bị xóa. Zone observability chỉ render khi có bundles — hiện tại trả về `[]` nên bị skip.

- [ ] **Bước 1: Thay toàn bộ `harness-config.ts`**

```ts
// packages/harness-kit/src/wizard/steps/harness-config.ts
import * as p from '@clack/prompts'
import { getBundlesByCategory } from '../../registry/index.js'
import type { WizardContext } from '../types.js'

function bundleOptions(category: Parameters<typeof getBundlesByCategory>[0]) {
  return getBundlesByCategory(category).map((b) => ({
    value: b.name,
    label: b.name,
    hint: b.description,
  }))
}

export async function stepHarnessConfig(ctx: WizardContext): Promise<Partial<WizardContext>> {
  if (ctx.selectedTech.length > 0) {
    p.log.step(`Tech stack: ${ctx.selectedTech.join(', ')}`)
  }

  // ── 1. Git workflow (hardcode — bundle chưa có trong registry) ───────────
  const gitWorkflow = await p.multiselect({
    message: 'Git workflow:',
    initialValues: ['conventional-commits', 'branch-strategy', 'pre-commit-hooks'],
    options: [
      { value: 'conventional-commits', label: 'Conventional Commits', hint: 'commit format + semantic versioning' },
      { value: 'branch-strategy',      label: 'Branch strategy',      hint: 'feature/fix/chore naming, PR < 400 lines' },
      { value: 'pre-commit-hooks',     label: 'Pre-commit hooks',     hint: 'lint + typecheck + test before commit' },
      { value: 'commit-signing',       label: 'Commit signing',       hint: 'GPG / SSH' },
    ],
    required: false,
  })
  if (p.isCancel(gitWorkflow)) { p.cancel('Cancelled'); process.exit(0) }

  // ── 2. Long-term memory (từ registry) ────────────────────────────────────
  const memory = await p.select({
    message: 'Long-term memory:',
    options: [
      { value: 'file-based', label: 'File-based', hint: '.claude/memory/ — local, no dependencies' },
      ...bundleOptions('memory'),
      { value: 'none', label: 'None' },
    ],
  })
  if (p.isCancel(memory)) { p.cancel('Cancelled'); process.exit(0) }

  // ── 3. Workflow presets (hardcode — bundle chưa có trong registry) ────────
  const workflowPresets = await p.multiselect({
    message: 'Workflow presets:',
    initialValues: ['spec-driven', 'tdd', 'planning-first', 'quality-gates', 'docs-as-code'],
    options: [
      { value: 'spec-driven',          label: 'Spec-driven',          hint: 'brainstorm → spec → plan → implement' },
      { value: 'tdd',                  label: 'TDD',                  hint: 'write failing test before implementing' },
      { value: 'planning-first',       label: 'Planning-first',       hint: 'draft plan → review → implement' },
      { value: 'quality-gates',        label: 'Quality gates',        hint: 'tests pass before done (Stop hook)' },
      { value: 'parallel-agents',      label: 'Parallel agents',      hint: 'subagents for independent tasks' },
      { value: 'systematic-debugging', label: 'Systematic debugging', hint: 'reproduce → isolate → verify → fix' },
      { value: 'code-review-gates',    label: 'Code review gates',    hint: 'review before commit/merge' },
      { value: 'security-review',      label: 'Security review',      hint: 'validate bash, block dangerous ops' },
      { value: 'context-discipline',   label: 'Context discipline',   hint: 'fresh session rules, task decomp guide' },
      { value: 'docs-as-code',         label: 'Docs as code',         hint: 'AGENTS.md, spec template, ADR structure, llms.txt' },
    ],
    required: false,
  })
  if (p.isCancel(workflowPresets)) { p.cancel('Cancelled'); process.exit(0) }

  // ── 4. Browser automation (từ registry) ──────────────────────────────────
  const browserTools = await p.multiselect({
    message: 'Browser automation:',
    initialValues: ['playwright'],
    options: bundleOptions('browser'),
    required: false,
  })
  if (p.isCancel(browserTools)) { p.cancel('Cancelled'); process.exit(0) }

  // ── 5. Web search (từ registry) ───────────────────────────────────────────
  const webSearch = await p.multiselect({
    message: 'Web search:',
    initialValues: ['tavily'],
    options: bundleOptions('search'),
    required: false,
  })
  if (p.isCancel(webSearch)) { p.cancel('Cancelled'); process.exit(0) }

  // ── 6. Web scrape (từ registry) ───────────────────────────────────────────
  const webScrape = await p.multiselect({
    message: 'Web scrape:',
    initialValues: ['firecrawl'],
    options: bundleOptions('scrape'),
    required: false,
  })
  if (p.isCancel(webScrape)) { p.cancel('Cancelled'); process.exit(0) }

  // ── 7. Library docs (từ registry) ─────────────────────────────────────────
  const libraryDocs = await p.multiselect({
    message: 'Library docs:',
    initialValues: ['context7'],
    options: bundleOptions('library-docs'),
    required: false,
  })
  if (p.isCancel(libraryDocs)) { p.cancel('Cancelled'); process.exit(0) }

  // ── 8. Document conversion (từ registry) ─────────────────────────────────
  const docConversion = await p.multiselect({
    message: 'Document conversion:',
    options: bundleOptions('doc-conversion'),
    required: false,
  })
  if (p.isCancel(docConversion)) { p.cancel('Cancelled'); process.exit(0) }

  // ── 9. Code execution sandbox (từ registry) ──────────────────────────────
  const codeExecution = await p.multiselect({
    message: 'Code execution sandbox:',
    options: bundleOptions('code-execution'),
    required: false,
  })
  if (p.isCancel(codeExecution)) { p.cancel('Cancelled'); process.exit(0) }

  // ── 10. Dev integrations (từ registry) ───────────────────────────────────
  const devIntegrations = await p.multiselect({
    message: 'Dev integrations:',
    initialValues: ['github'],
    options: bundleOptions('dev-integration'),
    required: false,
  })
  if (p.isCancel(devIntegrations)) { p.cancel('Cancelled'); process.exit(0) }

  // ── 11. Cloud & infra (từ registry) ──────────────────────────────────────
  const cloudInfra = await p.multiselect({
    message: 'Cloud & infra:',
    options: bundleOptions('cloud-infra'),
    required: false,
  })
  if (p.isCancel(cloudInfra)) { p.cancel('Cancelled'); process.exit(0) }

  // ── 12. Observability (từ registry — skip nếu chưa có bundle nào) ─────────
  let observability: string[] = []
  const observabilityOptions = bundleOptions('observability')
  if (observabilityOptions.length > 0) {
    const result = await p.multiselect({
      message: 'Observability:',
      options: observabilityOptions,
      required: false,
    })
    if (p.isCancel(result)) { p.cancel('Cancelled'); process.exit(0) }
    observability = result as string[]
  }

  return {
    gitWorkflow: gitWorkflow as string[],
    memory: memory as string,
    workflowPresets: workflowPresets as string[],
    browserTools: browserTools as string[],
    webSearch: webSearch as string[],
    webScrape: webScrape as string[],
    libraryDocs: libraryDocs as string[],
    docConversion: docConversion as string[],
    codeExecution: codeExecution as string[],
    devIntegrations: devIntegrations as string[],
    cloudInfra: cloudInfra as string[],
    observability,
  }
}
```

- [ ] **Bước 2: Kiểm tra TypeScript compile không có lỗi**

Chạy: `cd packages/harness-kit && pnpm tsc --noEmit 2>&1 | grep "harness-config" | head -10`
Kỳ vọng: Không có lỗi trong harness-config.ts

- [ ] **Bước 3: Commit**

```bash
git add packages/harness-kit/src/wizard/steps/harness-config.ts
git commit -m "refactor(wizard): harness-config reads tool/MCP zones from registry"
```

---

## Task 8: Refactor `preview-apply.ts`

**Files:**
- Sửa: `packages/harness-kit/src/wizard/steps/preview-apply.ts`

- [ ] **Bước 1: Thay toàn bộ `preview-apply.ts`**

Thay đổi chính:
- Xóa `REGISTRY_DIR`, import `loadManifests`
- `collectMcpIds` → `collectSelectedBundles` trả về `{name, role}[]`
- `buildDependencyWarnings` dùng `bundle.common.requires + roles[role].requires`
- Filter MCP dùng type check trên artifact
- `ctx.docsAsCode` → `ctx.workflowPresets.includes('docs-as-code')`

```ts
// packages/harness-kit/src/wizard/steps/preview-apply.ts
import * as p from '@clack/prompts'
import chalk from 'chalk'
import { Listr } from 'listr2'
import { writeScaffoldFile } from '../../engine/scaffolder.js'
import { renderTemplate } from '../../engine/template-renderer.js'
import { getBundle } from '../../registry/index.js'
import type { Artifact, BundleCategory } from '../../registry/types.js'
import type { WizardContext } from '../types.js'
import type { ScaffoldFile } from '../../engine/scaffolder.js'

interface McpConfig {
  name: string
  command: string
  args: string[]
  env?: Record<string, string>
}

export function collectSelectedBundles(ctx: WizardContext): Array<{ name: string; role: string }> {
  const names = [
    ...ctx.browserTools,
    ...ctx.webSearch,
    ...ctx.webScrape,
    ...ctx.libraryDocs,
    ...ctx.docConversion,
    ...ctx.codeExecution,
    ...ctx.devIntegrations,
    ...ctx.cloudInfra,
    ...ctx.observability,
    ...(ctx.memory !== 'none' && ctx.memory !== 'file-based' ? [ctx.memory] : []),
  ]
  return names
    .filter((name) => {
      try { getBundle(name); return true } catch { return false }
    })
    .map((name) => ({ name, role: getBundle(name).defaultRole }))
}

function resolveArtifacts(name: string, role: string): Artifact[] {
  const bundle = getBundle(name)
  const roleArtifacts = bundle.roles[role as BundleCategory]?.artifacts ?? []
  return [...bundle.common.artifacts, ...roleArtifacts]
}

function buildMcpConfigs(selected: Array<{ name: string; role: string }>): McpConfig[] {
  return selected.flatMap(({ name, role }) =>
    resolveArtifacts(name, role)
      .filter((a): a is Extract<Artifact, { type: 'mcp' }> => a.type === 'mcp')
      .map((a) => ({ name, command: a.command, args: a.args, env: a.env }))
  )
}

function buildDependencyWarnings(selected: Array<{ name: string; role: string }>): string[] {
  return selected.flatMap(({ name, role }) => {
    const bundle = getBundle(name)
    const requires = [
      ...(bundle.common.requires ?? []),
      ...(bundle.roles[role as BundleCategory]?.requires ?? []),
    ]
    return requires.length > 0 ? [`${name} — needs ${requires.join(' + ')}`] : []
  })
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
  const selectedBundles = collectSelectedBundles(ctx)
  const mcpConfigs = buildMcpConfigs(selectedBundles)
  const depWarnings = buildDependencyWarnings(selectedBundles)
  const hasDocs = ctx.workflowPresets.includes('docs-as-code')

  const noteLines = [
    '── Core ──────────────────────────────────────────────',
    '  ✦ CLAUDE.md  (template)',
    '  ✦ AGENTS.md',
    '  ✦ harness.json',
    '  ✦ llms.txt',
    '── Claude config ─────────────────────────────────────',
    '  ✦ .claude/settings.json',
    `── MCP config (${mcpConfigs.length}) ──────────────────────────────────────`,
    `  ✦ .mcp.json  (${mcpConfigs.map((m) => m.name).join(', ') || 'none'})`,
    ...(hasDocs ? [
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
  if (p.isCancel(confirm) || !confirm) { p.cancel('Cancelled'); process.exit(0) }

  const modules = buildModules(ctx)
  const templateCtx = {
    ...ctx,
    mcp: mcpConfigs.map((m) => m.name),
    mcpConfigs,
    modules,
    aiGenerationEnabled: false,
  }

  const files: ScaffoldFile[] = []

  const tasks = new Listr([
    {
      title: 'Rendering templates...',
      task: async () => {
        files.push(
          { relativePath: 'CLAUDE.md',              content: await renderTemplate('CLAUDE.md.hbs', templateCtx) },
          { relativePath: 'AGENTS.md',              content: await renderTemplate('AGENTS.md.hbs', templateCtx) },
          { relativePath: 'harness.json',           content: await renderTemplate('harness.json.hbs', templateCtx) },
          { relativePath: 'llms.txt',               content: await renderTemplate('llms.txt.hbs', templateCtx) },
          { relativePath: '.claude/settings.json',  content: await renderTemplate('settings.json.hbs', templateCtx) },
        )
        if (mcpConfigs.length > 0) {
          files.push({ relativePath: '.mcp.json', content: await renderTemplate('mcp.json.hbs', templateCtx) })
        }
        if (hasDocs) {
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

- [ ] **Bước 2: Kiểm tra TypeScript compile không có lỗi**

Chạy: `cd packages/harness-kit && pnpm tsc --noEmit 2>&1 | head -20`
Kỳ vọng: Lỗi duy nhất còn lại là trong `loader.ts` (sẽ xóa ở Task 10).

- [ ] **Bước 3: Commit**

```bash
git add packages/harness-kit/src/wizard/steps/preview-apply.ts
git commit -m "refactor(wizard): preview-apply uses bundle registry index, removes REGISTRY_DIR"
```

---

## Task 9: Cập nhật tests

**Files:**
- Sửa: `packages/harness-kit/tests/wizard/preview-apply.test.ts`
- Xóa: `packages/harness-kit/tests/registry/loader.test.ts` (thực hiện ở Task 10)

- [ ] **Bước 1: Viết lại `tests/wizard/preview-apply.test.ts`**

Tests cũ dùng `collectMcpIds`. Thay bằng tests cho `collectSelectedBundles`.

```ts
// packages/harness-kit/tests/wizard/preview-apply.test.ts
import { describe, it, expect } from 'vitest'
import { collectSelectedBundles } from '../../src/wizard/steps/preview-apply.js'
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

describe('collectSelectedBundles', () => {
  it('returns bundles from all tool zones with their defaultRole', () => {
    const ctx: WizardContext = {
      ...baseCtx,
      browserTools: ['playwright'],
      webSearch: ['tavily'],
      webScrape: ['firecrawl'],
      libraryDocs: ['context7'],
      codeExecution: ['e2b'],
      devIntegrations: ['github'],
    }
    const bundles = collectSelectedBundles(ctx)
    expect(bundles).toContainEqual({ name: 'playwright', role: 'browser' })
    expect(bundles).toContainEqual({ name: 'tavily', role: 'search' })
    expect(bundles).toContainEqual({ name: 'firecrawl', role: 'scrape' })
    expect(bundles).toContainEqual({ name: 'context7', role: 'library-docs' })
    expect(bundles).toContainEqual({ name: 'e2b', role: 'code-execution' })
    expect(bundles).toContainEqual({ name: 'github', role: 'dev-integration' })
  })

  it('includes memory bundle when not file-based or none', () => {
    const ctx: WizardContext = { ...baseCtx, memory: 'mem0' }
    const bundles = collectSelectedBundles(ctx)
    expect(bundles).toContainEqual({ name: 'mem0', role: 'memory' })
  })

  it('excludes file-based memory (not a bundle)', () => {
    const ctx: WizardContext = { ...baseCtx, memory: 'file-based', devIntegrations: ['github'] }
    const bundles = collectSelectedBundles(ctx)
    expect(bundles.map(b => b.name)).not.toContain('file-based')
    expect(bundles).toContainEqual({ name: 'github', role: 'dev-integration' })
  })

  it('silently skips unknown bundle names (not in registry)', () => {
    const ctx: WizardContext = { ...baseCtx, devIntegrations: ['github', 'linear'] }
    // 'linear' chưa có trong registry
    const bundles = collectSelectedBundles(ctx)
    expect(bundles).toContainEqual({ name: 'github', role: 'dev-integration' })
    expect(bundles.map(b => b.name)).not.toContain('linear')
  })
})
```

- [ ] **Bước 2: Chạy tests — xác nhận thành công**

Chạy: `cd packages/harness-kit && pnpm vitest run tests/wizard/preview-apply.test.ts`
Kỳ vọng: PASS

- [ ] **Bước 3: Commit**

```bash
git add packages/harness-kit/tests/wizard/preview-apply.test.ts
git commit -m "test(wizard): update preview-apply tests for collectSelectedBundles"
```

---

## Task 10: Xóa các file cũ

**Các file cần xóa:**
- `packages/harness-kit/src/registry/loader.ts`
- `packages/harness-kit/tests/registry/loader.test.ts`
- Tất cả `registry/mcp/*/manifest.json` (21 file)
- Tất cả `registry/tools/*/manifest.json` (2 file)
- Tất cả `registry/plugins/*/manifest.json` (1 file)

- [ ] **Bước 1: Xóa source và test file cũ**

```bash
rm packages/harness-kit/src/registry/loader.ts
rm packages/harness-kit/tests/registry/loader.test.ts
```

- [ ] **Bước 2: Xóa các JSON manifest cũ**

```bash
find packages/harness-kit/registry/mcp packages/harness-kit/registry/tools packages/harness-kit/registry/plugins \
  -name 'manifest.json' -delete
```

- [ ] **Bước 3: Kiểm tra TypeScript compile sạch**

Chạy: `cd packages/harness-kit && pnpm tsc --noEmit`
Kỳ vọng: Không có lỗi.

- [ ] **Bước 4: Commit**

```bash
git add -A
git commit -m "chore(registry): delete JSON manifests and loader.ts (replaced by TypeScript bundles)"
```

---

## Task 11: Build cuối và chạy toàn bộ tests

- [ ] **Bước 1: Build package**

Chạy: `cd packages/harness-kit && pnpm build`
Kỳ vọng: Build thành công, không có lỗi TypeScript.

- [ ] **Bước 2: Chạy tất cả tests**

Chạy: `cd packages/harness-kit && pnpm vitest run`
Kỳ vọng: Tất cả tests pass. Suite bao gồm:
- `tests/registry/index.test.ts`
- `tests/registry/bundles/tavily.test.ts`
- `tests/registry/bundles/mem0.test.ts`
- `tests/wizard/preview-apply.test.ts`

- [ ] **Bước 3: Chạy toàn bộ monorepo test**

Chạy: `cd /home/liamlee/t0lab/harness-kit && pnpm test`
Kỳ vọng: Tất cả packages pass.
