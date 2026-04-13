# Thiết kế lại Tool Registry

**Ngày:** 2026-04-13
**Trạng thái:** Bản nháp

## Mục tiêu

Thay thế danh sách MCP tool rời rạc trong wizard bằng một taxonomy đầy đủ, có cấu trúc rõ ràng theo từng loại công cụ agent. Mỗi category cung cấp các lựa chọn tốt nhất với thông tin rõ ràng về dependency và cách triển khai. Xoá bỏ nhóm "Other MCP" chung chung.

## Vấn đề hiện tại

- Thiếu hoàn toàn các category: code execution sandbox, observability
- "Other MCP" là nhóm catch-all không có logic phân loại rõ ràng
- Web search và web scrape được liệt kê không nhất quán
- Memory options không hiển thị dependency (Docker, Python, ChromaDB) trước khi user chọn
- Registry chỉ có `registry/mcp/` — không phân biệt các loại tool khác nhau (plugin, CLI tool)

## Kiến trúc

### Cấu trúc registry mới

```
registry/
  mcp/        ← spawn process, ghi .mcp.json
  plugins/    ← Claude Code plugin (scaffold ghi harness.json)
  tools/      ← local CLI/library (scaffold ghi harness.json)
```

`builtin` (file-based memory, none) không có registry entry — wizard xử lý trực tiếp bằng code.

### AnyManifest — discriminated union

`McpManifest` trong `src/registry/types.ts` được thay bằng discriminated union `AnyManifest`:

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
  installSource: string   // 'github:owner/repo'
}

export interface ToolManifest extends BaseManifest {
  installType: 'tool'
  installCmd: string      // 'pip install markitdown'
}

export type AnyManifest = McpManifest | PluginManifest | ToolManifest
```

| `installType` | Registry dir | Wizard action | `command`/`args`? |
|--------------|-------------|--------------|------------------|
| `mcp` | `registry/mcp/` | ghi `.mcp.json` | ✅ |
| `plugin` | `registry/plugins/` | ghi `installSource` vào `harness.json` | ❌ |
| `tool` | `registry/tools/` | ghi `installCmd` vào `harness.json` | ❌ |
| `builtin` | không có | code xử lý trực tiếp | ❌ |

### Registry loader — cập nhật

`loadMcpManifests(dir)` → `loadManifests(baseDir)` load từ tất cả 3 subdirs, trả về `AnyManifest[]`:

```ts
export async function loadManifests(registryDir: string): Promise<AnyManifest[]>
```

### WizardContext — fields cập nhật

```ts
// Xoá:
otherMcp: string[]

// Thêm:
codeExecution: string[]
devIntegrations: string[]
cloudInfra: string[]
observability: string[]

// Đổi tên:
webCrawl → webScrape

// memory: giữ nguyên union rõ ràng:
memory: 'file-based' | 'mem0' | 'obsidian' | 'letta' | 'mempalace' | 'claude-mem' | 'none'
```

WizardContext đầy đủ sau khi cập nhật:

```ts
interface WizardContext {
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
```

### initialContext defaults

```ts
const initialContext: WizardContext = {
  // ...các field không đổi...
  webScrape: ['firecrawl'],
  devIntegrations: ['github'],
  cloudInfra: [],
  codeExecution: [],
  observability: [],
}
```

### Cảnh báo dependency ở preview step

Khi user chọn tool có `requires` không rỗng, `preview-apply.ts` hiển thị cảnh báo trước khi apply:

```
⚠  Một số tool cần cài thêm:
   • MemPalace — cần python + chromadb
   • mem0 — cần docker
```

Cảnh báo chỉ để thông tin, không chặn apply. Tool `experimental: true` hiển thị hậu tố `(thử nghiệm)` trong hint multiselect.

---

## 8 Tool Categories

### 1. Memory & Knowledge

| id | label | hint | installType | requires |
|----|-------|------|-------------|----------|
| `file-based` | File-based | `.claude/memory/` — local, không cần gì thêm | builtin | [] |
| `mem0` | mem0 / OpenMemory | local-first, Docker: Qdrant + Postgres | mcp | [docker] |
| `obsidian` | Obsidian MCP | đồng bộ với Obsidian vault | mcp | [] |
| `letta` | Letta | stateful agents, tự host Docker | mcp | [docker] |
| `mempalace` | MemPalace | knowledge graph local, 19 tools (thử nghiệm) | mcp | [python, chromadb] |
| `claude-mem` | claude-mem | session memory Claude Code (PolyForm NC license) | plugin | [bun, chromadb, sqlite] |
| `none` | Không dùng | — | builtin | [] |

### 2. Browser Automation

| id | label | hint | installType |
|----|-------|------|-------------|
| `playwright` | Playwright MCP | accessibility snapshots, tạo E2E test | mcp |
| `browser-use` | browser-use | Playwright điều khiển bằng ngôn ngữ tự nhiên | mcp |
| `stagehand` | Stagehand | CDP-native, tự sửa selector khi DOM thay đổi | mcp |
| `agent-browser` | agent-browser | snapshot tiết kiệm token (~200-400 token/trang) | mcp |

### 3. Web Search

| id | label | hint | installType |
|----|-------|------|-------------|
| `tavily` | Tavily MCP | agentic search, kết quả có cấu trúc, free tier | mcp |
| `exa` | Exa MCP | tìm kiếm ngữ nghĩa, tối ưu cho code + GitHub | mcp |
| `perplexity` | Perplexity MCP | tổng hợp câu trả lời (không chỉ links) | mcp |
| `brave-search` | Brave Search MCP | index độc lập, bảo vệ quyền riêng tư | mcp |

### 4. Web Scrape

*(đổi tên từ "Web crawl")*

| id | label | hint | installType |
|----|-------|------|-------------|
| `firecrawl` | Firecrawl MCP | HTML→markdown, hỗ trợ JS | mcp |
| `crawl4ai` | Crawl4AI MCP | open source, tự host Docker | mcp |
| `jina` | Jina Reader MCP | không cần config, miễn phí, scrape từng trang | mcp |
| `spider` | Spider.cloud MCP | Rust, chống bot, crawl toàn site | mcp |

### 5. Code Execution *(mới)*

| id | label | hint | installType | requires |
|----|-------|------|-------------|----------|
| `e2b` | E2B | cloud sandbox, tính tiền theo giây | mcp | [api-key] |
| `daytona` | Daytona | cloud sandbox, khởi động dưới 100ms | mcp | [api-key] |

### 6. Dev Integrations *(thay thế "Other MCP")*

| id | label | hint | installType |
|----|-------|------|-------------|
| `github` | GitHub MCP | issues, PRs, tìm kiếm code | mcp |
| `linear` | Linear MCP | quản lý issue, OAuth | mcp |
| `notion` | Notion MCP | docs + database | mcp |
| `slack` | Slack MCP | nhắn tin, OAuth | mcp |
| `atlassian` | Atlassian MCP | Jira + Confluence, OAuth, chỉ dùng Cloud | mcp |

### 7. Cloud & Infra *(tách từ "Other MCP")*

| id | label | hint | installType |
|----|-------|------|-------------|
| `vercel` | Vercel MCP | deploy, domain, logs, env vars | mcp |
| `cloudflare` | Cloudflare MCP | Workers, R2, D1, KV, AI Gateway | mcp |
| `supabase` | Supabase MCP | Postgres + auth + storage | mcp |
| `postgresql` | PostgreSQL MCP | truy vấn read-only (Anthropic official) | mcp |

### 8. Observability *(mới)*

| id | label | hint | installType | requires |
|----|-------|------|-------------|----------|
| `langfuse` | Langfuse | tracing, evals, quản lý prompt — self-hosted hoặc cloud | mcp | [docker] hoặc [api-key] |
| `helicone` | Helicone | monitoring qua proxy, hỗ trợ 100+ model | mcp | [api-key] |

### Doc Conversion *(giữ nguyên, không đổi)*

| id | label | hint | installType | requires |
|----|-------|------|-------------|----------|
| `markitdown` | MarkItDown | PDF/Word/HTML/audio → markdown | tool | [python] |

---

## Danh sách file cần tạo / sửa

### Cấu trúc registry mới

```
registry/
  mcp/
    (10 manifest hiện có — thêm fields mới)
    obsidian/manifest.json        ← thiếu trong registry hiện tại
    mem0/manifest.json
    letta/manifest.json
    mempalace/manifest.json
    browser-use/manifest.json
    stagehand/manifest.json
    exa/manifest.json
    perplexity/manifest.json
    jina/manifest.json
    e2b/manifest.json
    daytona/manifest.json
    linear/manifest.json
    notion/manifest.json
    slack/manifest.json
    atlassian/manifest.json
    cloudflare/manifest.json
    postgresql/manifest.json
    langfuse/manifest.json
    helicone/manifest.json
  plugins/                        ← folder mới
    claude-mem/manifest.json
  tools/                          ← folder mới
    markitdown/manifest.json
```

### File nguồn cần sửa

| File | Thay đổi |
|------|----------|
| `src/registry/types.ts` | Thay `McpManifest` bằng discriminated union `AnyManifest` (McpManifest \| PluginManifest \| ToolManifest) |
| `src/registry/loader.ts` | `loadMcpManifests` → `loadManifests(registryDir)` — load từ `mcp/`, `plugins/`, `tools/` |
| `src/wizard/types.ts` | Cập nhật union `memory`, đổi tên `webCrawl→webScrape`, xoá `otherMcp`, thêm 4 fields mới |
| `src/wizard/steps/harness-config.ts` | 8 prompts tái cấu trúc |
| `src/wizard/steps/preview-apply.ts` | `collectMcpIds` dùng field mới; filter `installType !== 'mcp'` trước khi ghi `.mcp.json`; cảnh báo dependency |
| `src/wizard/index.ts` | Cập nhật `initialContext` |
| `templates/mcp.json.hbs` | Kiểm tra — không cần sửa nếu `mcpConfigs` vẫn là McpManifest[] |

---

## Quyết định thiết kế

**Tại sao `builtin` không có registry entry?** `file-based` và `none` không có config artifact — wizard xử lý trực tiếp bằng code (scaffold `.claude/memory/` hoặc skip). Không cần registry overhead.

**Tại sao `plugin` ghi vào `harness.json` thay vì scaffold `.claude/plugins/`?** Plugin structure phức tạp (skills, hooks, commands) — harness-kit không nên reproduce nó. Ghi `installSource` vào `harness.json` để user biết tự cài qua Claude Code marketplace.

**Tại sao `tool` ghi vào `harness.json` thay vì CLAUDE.md?** `harness.json` là source of truth cho trạng thái harness, không phải để đọc bởi agent. CLAUDE.md là context cho agent — không nên nhét install instructions vào đó.

**Tại sao bỏ Apify và Bright Data?** Niche enterprise (Apify actors, residential proxies) không phù hợp với người dùng harness-kit thông thường. Jina Reader tốt hơn cho tác vụ phổ biến nhất.

**Tại sao tách Dev Integrations và Cloud & Infra?** Dev tools (GitHub, Linear) về project management; cloud/infra (Vercel, Cloudflare) về deployment. Gộp chung gây nhầm lẫn.

**Tại sao giữ MemPalace?** MIT, local-only, structured knowledge graph duy nhất. `experimental: true` đảm bảo wizard minh bạch.

**Tại sao không gộp `webScrape` + `webSearch`?** Search = ranked results cho query; scrape = structured content từ URL cụ thể. Khác nhau về intent.

**Tại sao giữ `memory` là union type?** Cho phép exhaustive check trong `preview-apply.ts` khi phân nhánh (ví dụ: scaffold `.claude/memory/` chỉ cho `'file-based'`).
