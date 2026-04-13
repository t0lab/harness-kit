# Bundle Registry Redesign

## Mục tiêu

Thay thế hệ thống manifest phẳng với `installType` đơn bằng **mô hình bundle** — mỗi entry trong registry là một package tự hoàn chỉnh gồm nhiều loại artifact (MCP, skill, tool, hook, rule, agent, command, plugin, file), được nhóm theo roles để cài đặt có mục tiêu.

---

## Vấn đề hiện tại

Registry hiện tại có ba subdirectory phẳng (`mcp/`, `tools/`, `plugins/`) với mỗi entry chỉ có một `installType`. Điều này không đủ khi:

1. Một techstack như `mem0` vừa là memory backend vừa là MCP tool — cần artifact sets khác nhau tùy use case.
2. `agent-browser` cần cả npm install (`tool`) lẫn skill folder (`skill`).
3. Workflow presets như `tdd` hay `conventional-commits` không phải MCP server — chúng là bundle gồm rules, hooks, skills.
4. Wizard hardcode tất cả options; thêm integration mới yêu cầu sửa wizard source code.

---

## Thiết kế

### 1. Cấu trúc Bundle

Mỗi bundle là một directory trong `registry/` chứa typed manifest và các artifact files:

```
registry/
  mem0/
    manifest.ts
    skills/
      mem0/
        SKILL.md
        references/
          api-docs.md
      mem0-docker/
        SKILL.md
        scripts/
          setup.sh
  tavily/
    manifest.ts
    skills/
      tavily/
        SKILL.md
        references/
          best-practices.md
  conventional-commits/
    manifest.ts
    skills/
      conventional-commits/
        SKILL.md
    rules/
      conventional-commits.md
    hooks/
      commit-msg.sh
  docs-as-code/
    manifest.ts
    skills/
      docs-as-code/
        SKILL.md
    files/
      AGENTS.md.hbs
      spec-template.md
      llms.txt
```

Tên artifact files mô tả **nội dung của chúng**, không encode role. Manifest là source of truth cho việc role nào dùng artifact nào.

---

### 2. BundleManifest Interface

Không có field `category` riêng. Role keys trong `roles` đóng vai trò category — bundle xuất hiện trong wizard zone tương ứng với từng role key là `BundleCategory`. `defaultRole` khai báo explicit role nào được dùng khi `add` không có `--role`.

```ts
interface BundleManifest {
  name: string
  description: string
  version: string
  experimental: boolean
  defaultRole: string        // key trong roles, dùng khi 'add' không có --role

  common: {
    artifacts: Artifact[]    // cài cho mọi role
    env?: EnvVar[]           // env vars dùng chung
    requires?: string[]      // system deps chung (vd: 'node')
  }

  // Mỗi key là BundleCategory → bundle xuất hiện trong wizard zone tương ứng
  // Partial vì bundle chỉ có một số roles, không phải tất cả categories
  // Wizard zones của bundle = Object.keys(roles) (đều là BundleCategory)
  roles: Partial<Record<BundleCategory, {
    artifacts: Artifact[]    // chỉ cài khi role match
    env?: EnvVar[]           // env vars riêng của role
    requires?: string[]      // system deps riêng của role (vd: 'docker' chỉ cho memory role)
  }>>
}

// Wizard zones của một bundle = role keys thuộc BundleCategory
// Default role khi 'add' không có --role = defaultRole field

type BundleCategory =
  | 'git-workflow'     // → WizardContext.gitWorkflow
  | 'workflow-preset'  // → WizardContext.workflowPresets  (bao gồm 'docs-as-code')
  | 'memory'           // → WizardContext.memory
  | 'browser'          // → WizardContext.browserTools
  | 'search'           // → WizardContext.webSearch
  | 'scrape'           // → WizardContext.webScrape
  | 'library-docs'     // → WizardContext.libraryDocs
  | 'doc-conversion'   // → WizardContext.docConversion
  | 'code-execution'   // → WizardContext.codeExecution
  | 'dev-integration'  // → WizardContext.devIntegrations
  | 'cloud-infra'      // → WizardContext.cloudInfra
  | 'observability'    // → WizardContext.observability
  | 'mcp-tool'         // role phụ không có wizard zone riêng, chỉ qua --role flag

// Phân biệt hai hệ thống hook:
// - hook     : Claude Code hooks (PreToolUse...) → .claude/hooks/
// - git-hook : git hooks (pre-commit...) → .git/hooks/
type ClaudeHookType = 'PreToolUse' | 'PostToolUse' | 'Stop' | 'Notification'
type GitHookName    = 'pre-commit' | 'commit-msg' | 'pre-push'

type Artifact =
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

interface EnvVar {
  key: string
  description: string
  required: boolean
  default?: string
}
```

**Không có `selfHosted` flag.** Mọi service đều được xử lý như nhau — kết nối tới endpoint với credentials. Cloud hay self-hosted là lựa chọn của user, không phải concern của manifest.

**`src` paths** là relative tới bundle directory. **`dest` paths** là relative tới project root.

---

**Ví dụ — `mem0`** (multi-role: `memory` là BundleCategory → wizard zone; `mcp-tool` chỉ qua `--role`):
```ts
export const manifest: BundleManifest = {
  name: 'mem0',
  description: 'Semantic memory layer — local-first, Docker: Qdrant + Postgres',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'memory',

  common: {
    artifacts: [
      { type: 'mcp', command: 'npx', args: ['-y', 'mem0-mcp@latest'] }
    ],
    env: [{ key: 'MEM0_API_KEY', description: 'API key từ app.mem0.ai', required: true }]
  },

  roles: {
    memory: {                         // BundleCategory → xuất hiện trong wizard zone 'memory'
      artifacts: [
        { type: 'skill', src: 'skills/mem0', dest: '.agents/skills/mem0' },
        { type: 'skill', src: 'skills/mem0-docker', dest: '.agents/skills/mem0-docker' }
      ],
      requires: ['docker']            // docker chỉ cần cho memory role
    },
    'mcp-tool': {                     // không phải BundleCategory → chỉ qua --role
      artifacts: [
        { type: 'skill', src: 'skills/mem0', dest: '.agents/skills/mem0' }
      ]
    }
  }
}
```

**Ví dụ — `tavily`** (single role, `defaultRole: 'search'`):
```ts
export const manifest: BundleManifest = {
  name: 'tavily',
  description: 'Agentic search — kết quả có cấu trúc, free tier',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'search',

  common: {
    artifacts: [
      { type: 'mcp', command: 'npx', args: ['-y', 'tavily-mcp@latest'], env: { TAVILY_API_KEY: '${TAVILY_API_KEY}' } }
    ],
    env: [{ key: 'TAVILY_API_KEY', description: 'API key từ app.tavily.com', required: true }]
  },

  roles: {
    search: {                         // BundleCategory → wizard zone 'search'
      artifacts: [
        { type: 'skill', src: 'skills/tavily', dest: '.agents/skills/tavily' }
      ]
    }
  }
}
```

**Ví dụ — `conventional-commits`** (workflow bundle, không có MCP):
```ts
export const manifest: BundleManifest = {
  name: 'conventional-commits',
  description: 'Conventional Commits format + semantic versioning',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'git-workflow',

  common: {
    artifacts: [
      { type: 'rule', src: 'rules/conventional-commits.md', dest: '.claude/rules/conventional-commits.md' }
    ]
  },

  roles: {
    'git-workflow': {                 // BundleCategory → wizard zone 'git-workflow'
      artifacts: [
        { type: 'skill',    src: 'skills/conventional-commits', dest: '.agents/skills/conventional-commits' },
        { type: 'git-hook', src: 'hooks/commit-msg.sh', hookName: 'commit-msg' }
      ]
    }
  }
}
```

**Ví dụ — `docs-as-code`** (workflow-preset):
```ts
export const manifest: BundleManifest = {
  name: 'docs-as-code',
  description: 'AGENTS.md, spec template, ADR structure, llms.txt',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'workflow-preset',

  common: {
    artifacts: [
      { type: 'file', src: 'files/AGENTS.md.hbs', dest: 'AGENTS.md' },
      { type: 'file', src: 'files/llms.txt', dest: 'llms.txt' }
    ]
  },

  roles: {
    'workflow-preset': {              // BundleCategory → wizard zone 'workflow-preset'
      artifacts: [
        { type: 'skill', src: 'skills/docs-as-code', dest: '.agents/skills/docs-as-code' }
      ]
    }
  }
}
```

---

### 3. Phân phối Registry

**V1 — Bundled in CLI:** Toàn bộ bundles ship cùng harness-kit package tại `packages/harness-kit/registry/`. Không cần network.

**V2 — Remote registry (tương lai):** Bundles host trên GitHub repo riêng. CLI fetch qua GitHub raw URLs, versioning qua git tags. Field `registryUrl` trong `harness.json` có thể cấu hình.

**Loading mechanism (V1):** Manifests là TypeScript files — không JSON.parse, không filesystem scan. Registry được load qua barrel file `src/registry/index.ts`:

```ts
// src/registry/index.ts
import { manifest as mem0Manifest }   from '../../registry/mem0/manifest.js'
import { manifest as tavilyManifest } from '../../registry/tavily/manifest.js'
// ...

const ALL_BUNDLES: BundleManifest[] = [mem0Manifest, tavilyManifest, ...]

export function getAllBundles(): BundleManifest[] {
  return ALL_BUNDLES
}

export function getBundlesByCategory(category: BundleCategory): BundleManifest[] {
  return ALL_BUNDLES.filter(b => b.category === category)
}

export function getBundle(name: string): BundleManifest {
  const b = ALL_BUNDLES.find(b => b.name === name)
  if (!b) throw new Error(`Bundle not found: ${name}`)
  return b
}
```

Đây là điều kiện tiên quyết để có compile-time type safety.

---

### 4. WizardContext

Zone fields giữ nguyên cho wizard step navigation (back/forward). Giá trị là **bundle names** (strings) — không phải union types hardcoded. Wizard gọi `getBundlesByCategory()` để populate options cho mỗi zone.

```ts
interface WizardContext {
  // Project metadata
  projectName: string
  projectPurpose: string
  projectUsers: string
  projectConstraints: string
  selectedTech: string[]
  detectedIssues: string[]
  aiGeneration: boolean
  installSelected: boolean

  // Wizard zones — string[] bundle names được chọn theo category
  // docsAsCode boolean cũ → bundle 'docs-as-code' trong workflowPresets
  gitWorkflow: string[]
  workflowPresets: string[]
  memory: string              // single-select, 'none' nếu không chọn
  browserTools: string[]
  webSearch: string[]
  webScrape: string[]
  libraryDocs: string[]
  docConversion: string[]
  codeExecution: string[]
  devIntegrations: string[]
  cloudInfra: string[]
  observability: string[]
}
```

Khi apply, zones flatten thành danh sách bundles. Role luôn là `bundle.defaultRole` — wizard không quyết định role, chỉ quyết định bundle nào được chọn:

```ts
function collectSelectedBundles(ctx: WizardContext): Array<{ name: string; role: string }> {
  const names = [
    ...ctx.gitWorkflow, ...ctx.workflowPresets,
    ...(ctx.memory !== 'none' ? [ctx.memory] : []),
    ...ctx.browserTools, ...ctx.webSearch, ...ctx.webScrape,
    ...ctx.libraryDocs, ...ctx.docConversion, ...ctx.codeExecution,
    ...ctx.devIntegrations, ...ctx.cloudInfra, ...ctx.observability,
  ]
  return names.map(name => ({ name, role: getBundle(name).defaultRole }))
}
```

`--role` flag trong CLI `add` là cách duy nhất để override `defaultRole`.

---

### 5. Định dạng `harness.json`

Flat array — machine-readable, một entry per installed bundle. `checksums` lưu SHA-256 của từng file đã copy để phát hiện user modifications khi `update`:

```json
{
  "version": "1.0.0",
  "registryUrl": "https://raw.githubusercontent.com/t0lab/harness-kit/main",
  "bundles": [
    {
      "name": "conventional-commits",
      "roles": ["git-workflow"],
      "version": "1.0.0",
      "checksums": {
        ".agents/skills/conventional-commits/SKILL.md": "sha256:abc123",
        ".claude/rules/conventional-commits.md": "sha256:def456"
      }
    },
    {
      "name": "mem0",
      "roles": ["memory"],
      "version": "1.0.1",
      "checksums": {
        ".agents/skills/mem0/SKILL.md": "sha256:xyz789"
      }
    }
  ]
}
```

`checksums` chỉ track file artifacts (skill, rule, hook, agent, command, file) — không track MCP entries hay tool installs.

`harness-kit add mem0 --role mcp-tool` khi `mem0` đã có → append `'mcp-tool'` vào `roles[]`, merge checksums mới, không tạo entry mới.

---

### 6. CLI Commands

```bash
# Init wizard — đọc registry, group bundles theo category
harness-kit init

# Add bundle với category làm default role
harness-kit add tavily

# Add bundle với role override
harness-kit add mem0 --role mcp-tool

# Liệt kê bundles trong registry (grouped by category)
harness-kit list

# Update bundle lên version mới nhất
harness-kit update tavily
harness-kit update          # update tất cả
```

---

### 7. Apply Flow

Khi install một bundle (qua `init` hoặc `add`):

```
1. Load manifest: getBundle(name) từ registry index
2. Xác định role: bundle.category (hoặc --role flag nếu có)
3. Resolve artifact set = common.artifacts + (roles?.[role]?.artifacts ?? [])
4. Với mỗi artifact:
     mcp      → merge entry vào .mcp.json
     skill    → copy directory recursively tới dest
     tool     → chạy installCmd (npm/pip/brew)
     plugin   → chạy: claude plugin install <installSource>
     hook     → copy tới .claude/hooks/<dest>, chmod +x
     git-hook → copy tới .git/hooks/<hookName>, chmod +x
     rule     → copy tới dest
     agent    → copy tới dest
     command  → copy tới dest
     file     → copy tới dest
     (cho mỗi file copied: ghi SHA-256 vào checksums map)
5. Thu thập env vars = common.env + (roles?.[role]?.env ?? [])
   → prompt user cho required vars chưa có trong environment
   → append vào .env (hoặc in export commands)
6. Cập nhật harness.json:
   → nếu bundle chưa có: thêm { name, roles: [role], version, checksums }
   → nếu bundle đã có:   append role vào roles[], merge checksums
```

**Conflict policy (shadcn model — user owns the files):**
- **First install:** copy tất cả artifacts.
- **`add` với role mới trên bundle đã có:** chỉ install `roles[newRole].artifacts` — skip common artifacts dest đã tồn tại.
- **`update`:** overwrite tất cả artifacts. Trước khi overwrite từng file, so sánh SHA-256 hiện tại với `checksums` trong `harness.json` — nếu khác nhau (user đã sửa), prompt confirm trước khi overwrite.

**Multi-role semantics:**
Khi `mem0` có `roles: ['memory']` và user chạy `add mem0 --role mcp-tool`:
- Chỉ install `roles['mcp-tool'].artifacts` — không re-install common artifacts đã có.
- `harness.json`: `roles` → `['memory', 'mcp-tool']`, merge checksums mới.
- `update mem0` re-apply **tất cả** roles hiện có.

---

### 8. Wizard Zone → Registry Mapping

Wizard gọi `getBundlesByCategory(category)` cho từng step — không hardcode bundle names:

```
Step "Git workflow"      → getBundlesByCategory('git-workflow')
Step "Memory"            → getBundlesByCategory('memory')
Step "Workflow presets"  → getBundlesByCategory('workflow-preset')  // bao gồm docs-as-code
Step "Browser tools"     → getBundlesByCategory('browser')
Step "Web search"        → getBundlesByCategory('search')
Step "Web scrape"        → getBundlesByCategory('scrape')
...
```

Thêm bundle mới vào registry + barrel index → tự động xuất hiện trong wizard, không cần sửa wizard source.

---

## Migration từ thiết kế hiện tại

| Trước | Sau |
|-------|-----|
| `registry/mcp/`, `registry/tools/`, `registry/plugins/` | `registry/<bundle-name>/` phẳng |
| `manifest.json` (runtime JSON parse) | `manifest.ts` (compile-time TypeScript) |
| `installType` discriminant đơn | `common` + `roles?` structure |
| `AnyManifest = McpManifest \| ToolManifest \| PluginManifest` | `BundleManifest` |
| `category` field riêng + `defaultRole` + `supportedRoles` | `defaultRole` + `roles: Partial<Record<BundleCategory, ...>>` |
| `loadManifests(registryDir)` filesystem scan | `getBundle()` / `getBundlesByCategory()` từ barrel index |
| `WizardContext.browserTools: ('playwright' \| 'agent-browser')[]` | `WizardContext.browserTools: string[]` |
| `WizardContext.docsAsCode: boolean` | Bundle `docs-as-code` trong `workflowPresets` |
| Options hardcoded trong `harness-config.ts` | Wizard gọi `getBundlesByCategory()` |
| `selfHosted: boolean` | Bỏ — mọi service chỉ cần endpoint + credentials |
| `harness.json` modules array | `harness.json` bundles array với roles + checksums |
| Không có `observability` zone | `observability: string[]` trong WizardContext |
