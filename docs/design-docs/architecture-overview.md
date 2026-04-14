 # Tổng quan kiến trúc

Tài liệu này là bản đồ API surface của toàn bộ codebase. Mục đích: agent có thể tra cứu nhanh mà không cần đọc source file.

---

## Package: @harness-kit/core (`packages/core/`)

**Trách nhiệm:** Định nghĩa tất cả shared types và constants. Không chứa logic, không có side effects.

**File:** `packages/core/src/types.ts`

| Export | Loại | Mô tả |
|--------|------|-------|
| `BundleCategory` | `type` | Union của 8 category string: `'git-workflow' \| 'workflow-preset' \| 'memory' \| 'browser' \| 'search' \| 'scrape' \| 'dev-integration' \| 'mcp-tool'` |
| `ClaudeHookType` | `type` | Union: `'PreToolUse' \| 'PostToolUse' \| 'Stop' \| 'Notification'` |
| `GitHookName` | `type` | Union: `'pre-commit' \| 'commit-msg' \| 'pre-push'` |
| `Artifact` | `type` | Discriminated union (10 variants) cho từng loại artifact: `mcp`, `skill`, `tool`, `plugin`, `hook`, `git-hook`, `rule`, `agent`, `command`, `file` |
| `EnvVar` | `interface` | `{ key, description, required, default? }` — một biến môi trường cần thiết cho bundle |
| `BundleManifest` | `interface` | Schema đầy đủ của một bundle: `name`, `description`, `version`, `experimental`, `defaultRole`, `common.artifacts`, `common.env?`, `common.requires?`, `roles` |
| `HarnessConfig` | `interface` | Schema của `harness.json`: `{ version, registry, techStack, bundles }` |

---

## Module: Registry (`packages/harness-kit/src/registry/`)

**Trách nhiệm:** Đóng gói toàn bộ bundle manifests thành một TypeScript bundle duy nhất. Là nguồn sự thật duy nhất về danh sách bundles có sẵn (40+ bundles). Không đọc file — dữ liệu được nhúng tĩnh lúc build.

**File:** `src/registry/index.ts`

| Export | Signature | Mô tả |
|--------|-----------|-------|
| `getAllBundles` | `(): BundleManifest[]` | Trả về toàn bộ danh sách bundles |
| `getBundlesByCategory` | `(category: BundleCategory): BundleManifest[]` | Lọc bundles theo category — bundle được tính nếu **có role tương ứng** (không chỉ `defaultRole`) |
| `getBundle` | `(name: string): BundleManifest` | Lấy một bundle theo tên; ném lỗi nếu không tìm thấy |
| `getRecommendedByCategory` | `(category: BundleCategory): BundleManifest[]` | Lọc bundles có `recommended: true` trong role của category đó |

**Không nên gọi:** Truy cập trực tiếp từng `manifest.js` file trong `bundles/` — luôn dùng các hàm trên.

**File:** `src/registry/types.ts` — re-export convenience module: re-export toàn bộ types từ `@harness-kit/core` để các module trong `src/` có thể import từ `../registry/types.js` thay vì `@harness-kit/core`. Không chứa logic.

---

## Module: Config (`packages/harness-kit/src/config/`)

### harness-reader.ts

**Trách nhiệm:** Đọc, ghi, và kiểm tra sự tồn tại của `harness.json` trong project directory. Validate schema bằng Zod khi đọc.

| Export | Signature | Mô tả |
|--------|-----------|-------|
| `harnessExists` | `(cwd: string): Promise<boolean>` | Kiểm tra `harness.json` có tồn tại trong `cwd` không |
| `readHarnessConfig` | `(cwd: string): Promise<HarnessConfig>` | Đọc và validate `harness.json`; ném lỗi nếu schema không hợp lệ |
| `writeHarnessConfig` | `(cwd: string, config: HarnessConfig): Promise<void>` | Ghi `harness.json` (pretty-printed JSON) |

**Không nên gọi:** Đọc `harness.json` trực tiếp bằng `readFile` — luôn dùng `readHarnessConfig` để đảm bảo validation.

---

### mcp-reader.ts

**Trách nhiệm:** Đọc, ghi `.mcp.json` và truy vấn danh sách MCP server keys. Schema đọc là loose — giữ nguyên các entry hiện có dù không đúng cấu trúc chuẩn.

| Export | Loại | Mô tả |
|--------|------|-------|
| `McpServerEntry` | `interface` | `{ command: string; args: string[]; env?: Record<string, string> }` |
| `McpJson` | `interface` | `{ mcpServers: Record<string, unknown> }` |
| `readMcpJson` | `(cwd: string): Promise<McpJson>` | Đọc `.mcp.json`; trả về `{ mcpServers: {} }` nếu file không tồn tại |
| `writeMcpJson` | `(cwd: string, data: McpJson): Promise<void>` | Ghi `.mcp.json` (pretty-printed JSON) |
| `readMcpJsonKeys` | `(cwd: string): Promise<Set<string>>` | Trả về Set các key trong `mcpServers` — dùng để kiểm tra bundle đã có MCP entry chưa |

---

## Module: Engine (`packages/harness-kit/src/engine/`)

### artifact-installer.ts

**Trách nhiệm:** Cài đặt artifacts từ một bundle vào project. Hiện tại hỗ trợ đầy đủ `mcp` artifacts (ghi vào `.mcp.json`); các loại khác (`tool`, v.v.) trả về warning để người dùng tự xử lý.

| Export | Loại | Mô tả |
|--------|------|-------|
| `InstallResult` | `interface` | `{ mcpUpdated: boolean; warnings: string[] }` |
| `installBundle` | `(cwd: string, bundle: BundleManifest, role: string): Promise<InstallResult>` | Kết hợp `common.artifacts` + role artifacts, xử lý từng loại; ghi `.mcp.json` nếu có MCP artifact |

**Lưu ý:** Artifact types `skill`, `hook`, `git-hook`, `rule`, `agent`, `command`, `file` chưa được cài đặt tự động — trả về warning "not yet supported".

---

### scaffolder.ts

**Trách nhiệm:** Ghi file vào filesystem với chiến lược xử lý xung đột (overwrite hoặc skip).

| Export | Loại | Mô tả |
|--------|------|-------|
| `ScaffoldFile` | `interface` | `{ relativePath: string; content: string }` |
| `ConflictStrategy` | `type` | `'overwrite' \| 'skip'` |
| `writeScaffoldFile` | `(cwd: string, file: ScaffoldFile, conflict: ConflictStrategy): Promise<void>` | Tạo thư mục cha nếu cần, bỏ qua nếu file đã tồn tại và `conflict === 'skip'` |

---

### template-renderer.ts

**Trách nhiệm:** Render Handlebars template từ thư mục `templates/`. Tự động resolve đường dẫn đúng cho cả môi trường `dist/` lẫn `src/` (vitest).

Handlebars helpers đã đăng ký:
- `includes(arr, val)` — kiểm tra array có chứa value
- `ifEqual(a, b)` — block helper so sánh hai string

| Export | Signature | Mô tả |
|--------|-----------|-------|
| `renderTemplate` | `(name: string, context: Record<string, unknown>): Promise<string>` | Đọc template file theo tên (ví dụ: `'harness.json.hbs'`), render với context; ném lỗi nếu template không tồn tại |

---

## Module: Utils (`packages/harness-kit/src/utils/`)

### bundle-utils.ts

**Trách nhiệm:** Helper nhỏ để truy cập role data từ bundle manifest một cách type-safe.

| Export | Signature | Mô tả |
|--------|-----------|-------|
| `getRoleData` | `(bundle: BundleManifest, role: string): RoleData \| undefined` | Trả về role data object từ `bundle.roles` theo role string; cast an toàn vì registry đảm bảo tính hợp lệ |

---

## Module: Wizard (`packages/harness-kit/src/wizard/`)

**Trách nhiệm:** Interactive CLI wizard dựa trên `@clack/prompts`. Thu thập thông tin project, detect tech stack, chọn bundles, và apply vào project.

### Exports chính

**`index.ts`**

| Export | Signature | Mô tả |
|--------|-----------|-------|
| `wizardMachine` | XState machine | State machine định nghĩa luồng wizard (internal — không gọi trực tiếp) |
| `runWizard` | `(): Promise<void>` | Entry point: chạy toàn bộ wizard từ đầu đến cuối |

**`types.ts`**

| Export | Loại | Mô tả |
|--------|------|-------|
| `TechOption` | `interface` | `{ id, label, hint, category, tags[] }` |
| `DetectedIssue` | `interface` | `{ label, found, installCmd? }` — kết quả kiểm tra một tool |
| `WizardContext` | `interface` | Toàn bộ trạng thái wizard: project info, selected tech, bundle selections theo từng category |
| `WizardEvent` | `type` | Union của các event: `ENTER`, `NEXT`, `BACK`, `CONFIRM`, `SKIP_DETECT`, `DONE`, `ERROR` |

**Sub-modules**

| File | Export chính | Mô tả |
|------|-------------|-------|
| `detect-tech.ts` | `detectTechStack(cwd): string[]` | Phát hiện tech stack từ filesystem (package.json, config files) |
| `detector.ts` | `detectTooling(cwd, selectedTech): Promise<DetectedIssue[]>` | Kiểm tra các tools cần thiết đã được cài chưa |
| `filter.ts` | `filterOptions(query, options): TechOption[]` | Lọc tech options theo search query |
| `tech-options.ts` | `TECH_OPTIONS: TechOption[]` | Danh sách tất cả tech options cho wizard |
| `layout.ts` | `renderTooSmall`, `guardMinHeight`, `applySymbolFix`, v.v. | Tiện ích terminal UI (min height guard, logo render) |

**Steps** (`wizard/steps/`)

| File | Export | Mô tả |
|------|--------|-------|
| `project-info.ts` | `stepProjectInfo(): Promise<Partial<WizardContext>>` | Hỏi tên project, mục đích, người dùng, constraints |
| `tech-stack-select.ts` | `selectTechStack(options): Promise<string[]>` | Interactive multi-select tech stack. Dùng **alternate screen buffer** (`\x1b[?1049h`) thay vì inline clack để tránh 3 vấn đề: (1) scroll position sai lúc khởi động, (2) SIGWINCH resize lệch frame, (3) status bar bị đẩy lên khi items fill màn hình. Space-toggle fix: register keypress listener trước `prompt.prompt()` để set `isNavigating=true`. |
| `detect-tooling.ts` | `stepDetectTooling(ctx): Promise<Partial<WizardContext>>` | Chạy detection và hiển thị kết quả |
| `harness-config.ts` | `stepHarnessConfig(ctx): Promise<Partial<WizardContext>>` | Chọn bundles theo từng category |
| `preview-apply.ts` | `collectSelectedBundles(ctx): Array<{name, role}>` + `stepPreviewApply(ctx): Promise<void>` | Preview danh sách bundles sẽ cài, rồi apply |

**Không nên gọi:** Các step functions trực tiếp từ ngoài wizard — chúng là internal steps của `runWizard()`.

---

## Module: Commands (`packages/harness-kit/src/commands/`)

**Trách nhiệm:** Định nghĩa các CLI sub-commands (Commander.js). Mỗi file có một `register*Command` function nhận `program: Command`.

### init.ts

| Export | Signature | Mô tả |
|--------|-----------|-------|
| `registerInitCommand` | `(program: Command): void` | Đăng ký lệnh `harness-kit init` — khởi chạy wizard |

### add.ts

| Export | Loại | Mô tả |
|--------|------|-------|
| `AddResult` | `interface` | `{ bundleName, role, mcpUpdated, warnings, envVars }` |
| `executeAdd` | `(cwd: string, bundleName: string, opts: { role?: string }): Promise<AddResult>` | Logic core của lệnh add — testable, không có side effects của Commander hay prompts; ném lỗi với prefix code (`NOT_INITIALIZED:`, `UNKNOWN_BUNDLE:`, `INVALID_ROLE:`) |
| `registerAddCommand` | `(program: Command): void` | Đăng ký lệnh `harness-kit add <bundle>` — gọi `executeAdd`, xử lý confirm khi re-install |

### list.ts

| Export | Signature | Mô tả |
|--------|-----------|-------|
| `groupBundlesByDefaultRole` | `(bundles: BundleManifest[]): Map<string, BundleManifest[]>` | Nhóm bundles theo `defaultRole` |
| `filterByInstalled` | `(bundles: BundleManifest[], installed: Set<string>): BundleManifest[]` | Lọc chỉ bundles đã cài |
| `registerListCommand` | `(program: Command): void` | Đăng ký lệnh `harness-kit list [--category] [--installed]`. `--category` filter theo `b.defaultRole === category` — **không** dùng `getBundlesByCategory`, nên bundle có role nhưng `defaultRole` khác sẽ không hiện. |

### status.ts

| Export | Loại | Mô tả |
|--------|------|-------|
| `BundleAudit` | `interface` | `{ name, category, hasMcp, drift }` — trạng thái một bundle |
| `FileAudit` | `interface` | `{ path, exists }` — kiểm tra core file có tồn tại không |
| `EnvAudit` | `interface` | `{ key, set, bundleName, required }` — trạng thái một env var |
| `AuditResult` | `interface` | `{ bundles: BundleAudit[]; files: FileAudit[]; envVars: EnvAudit[] }` |
| `auditHarness` | `(cwd: string): Promise<AuditResult>` | Kiểm tra toàn bộ trạng thái harness: bundles, core files, env vars |
| `registerStatusCommand` | `(program: Command): void` | Đăng ký lệnh `harness-kit status` |

---

## Entry Point (`packages/harness-kit/src/index.ts`)

| Export | Signature | Mô tả |
|--------|-----------|-------|
| `createCli` | `(): Command` | Tạo Commander program với tất cả sub-commands đã đăng ký; entry point cho binary `harness-kit` |

---

## Sơ đồ phụ thuộc giữa các module

```
CLI binary
  └── index.ts (createCli)
        ├── commands/init.ts     → wizard/index.ts (runWizard)
        ├── commands/add.ts      → config/harness-reader.ts
        │                        → registry/index.ts
        │                        → engine/artifact-installer.ts
        ├── commands/list.ts     → registry/index.ts
        │                        → config/harness-reader.ts
        └── commands/status.ts  → config/harness-reader.ts
                                 → config/mcp-reader.ts
                                 → registry/index.ts

engine/artifact-installer.ts    → config/mcp-reader.ts
                                 → utils/bundle-utils.ts

wizard/steps/preview-apply.ts   → engine/artifact-installer.ts
                                 → config/harness-reader.ts
                                 → engine/template-renderer.ts

@harness-kit/core               ← (không import bất kỳ package nội bộ nào)
```
