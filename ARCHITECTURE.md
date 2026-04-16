# Kiến Trúc harness-kit

Tài liệu này là bản đồ các tầng (layer map) và quy tắc phụ thuộc. Khi bạn cần quyết định "đoạn code này thuộc tầng nào?", hãy đọc tài liệu này trước tiên.

---

## Bản Đồ Tầng

```
┌─────────────────────────────────────────────┐
│              packages/core                  │
│         (types, constants dùng chung)       │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│              registry/                      │
│     (catalog toàn bộ bundle manifests)      │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│               config/                       │
│    (đọc/ghi harness.json và .mcp.json)      │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│               engine/                       │
│   (artifact-installer, template-renderer,   │
│    scaffolder)                              │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│               components/                   │
│      (TUI components cho wizard & commands) │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│               wizard/                       │
│      (điều phối luồng wizard bằng xstate)   │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│              commands/                      │
│    (điểm vào của từng lệnh CLI cụ thể)      │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│                  cli/                       │
│      (khai báo lệnh với commander)          │
└─────────────────────────────────────────────┘

           ┌──────────────┐
           │    utils/    │  ← helper dùng chung, không có tầng riêng
           └──────────────┘
```

Luồng phụ thuộc chỉ đi **một chiều: xuống**. Tầng dưới không bao giờ import tầng trên.

---

## Bảng Quy Tắc Phụ Thuộc

| Tầng | Đường dẫn | Được phép import |
|------|-----------|-----------------|
| `core` | `packages/core/src/` | Node built-ins, thư viện bên ngoài |
| `registry` | `src/registry/` | `@harness-kit/core`, `utils/` |
| `config` | `src/config/` | `@harness-kit/core`, `utils/`, Node fs |
| `engine` | `src/engine/` | `@harness-kit/core`, `registry/`, `config/`, `utils/` |
| `components` | `src/components/` | `@harness-kit/core`, `registry/`, `utils/`, `lib/`, `hooks/`, `store/` |
| `wizard` | `src/wizard/` | `@harness-kit/core`, `registry/`, `utils/`, `components/`, `lib/`, `hooks/`, `store/`, xstate |
| `commands` | `src/commands/` | Tất cả các tầng trên, `config/`, `engine/`, `components/` |
| `utils` | `src/utils/` | `@harness-kit/core` (không import tầng nào khác) |
| `cli` | `src/cli/` | `commands/`, commander |

---

## Checklist Phân Loại Code Mới

Khi thêm logic mới, hãy tự hỏi những câu hỏi sau theo thứ tự:

- [ ] **Là type hoặc constant dùng chung giữa nhiều package?** → `packages/core/src/`
- [ ] **Là manifest mô tả một bundle tích hợp?** → `src/registry/bundles/<tên>/manifest.ts`
- [ ] **Là logic đọc hoặc ghi file cấu hình** (`harness.json`, `.mcp.json`)**?** → `src/config/`
- [ ] **Là logic ghi file vào project của người dùng** (artifact, scaffold, template)**?** → `src/engine/`
- [ ] **Là helper nhỏ tái sử dụng không phụ thuộc side-effect?** → `src/utils/`
- [ ] **Là bước tương tác UI hoặc hiển thị kết quả lệnh?** → `src/components/`
- [ ] **Là logic điều phối toàn bộ một lệnh CLI** (`init`, `add`, `list`, `status`, `budget`)**?** → `src/commands/`
- [ ] **Là khai báo lệnh cho commander?** → `src/cli/`

---

## Những Gì Kiến Trúc Này Ngăn Chặn

- `wizard/` **không ghi file trực tiếp** — chỉ trả về lựa chọn; việc ghi là trách nhiệm của `engine/`
- `commands/` **không query `registry/` trực tiếp để lọc bundle** — logic lọc thuộc về `wizard/` hoặc `engine/`
- `registry/` **không import `config/` hay `engine/`** — registry chỉ là dữ liệu tĩnh
- `config/` **không biết gì về bundle hay registry** — chỉ đọc/ghi JSON thuần
- `engine/` **không hiển thị UI** — tất cả prompt thuộc về `wizard/`
- `utils/` **không import tầng nghiệp vụ nào** (`wizard/`, `engine/`, `commands/`) — tránh circular dependency
- `core` **không import bất kỳ thứ gì từ `packages/harness-kit`** — luồng dependency chỉ đi một chiều

---

## Trách Nhiệm Từng Module

### `packages/core`

Chứa các kiểu TypeScript và hằng số dùng chung giữa tất cả các package trong monorepo. Là nguồn sự thật duy nhất cho `HarnessConfig`, `BundleManifest`, `BundleCategory`, và các interface khác mà cả `registry` lẫn `engine` đều tham chiếu. Không có logic runtime — chỉ có type definitions.

### `src/registry/`

Catalog toàn bộ các bundle tích hợp của harness-kit dưới dạng TypeScript thuần (không phải JSON). Hàm `getAllBundles()` trả về mảng tất cả `BundleManifest`, `getBundlesByCategory(category)` lọc theo danh mục, `getBundle(name)` tìm bundle theo tên, và `getRecommendedByCategory(category)` trả về các bundle được đánh dấu recommended. Mỗi bundle nằm trong thư mục con `bundles/<tên>/manifest.ts`. Registry là dữ liệu **read-only** — không có side effect.

### `src/config/`

Chịu trách nhiệm đọc và ghi hai file cấu hình trung tâm của một project. Module `harness-reader.ts` cung cấp `harnessExists(cwd)`, `readHarnessConfig(cwd)`, và `writeHarnessConfig(cwd, config)` — tất cả đều validate schema qua Zod trước khi trả về. Module `mcp-reader.ts` cung cấp `readMcpJson(cwd)`, `writeMcpJson(cwd, data)`, và `readMcpJsonKeys(cwd)` để quản lý file `.mcp.json`. Tầng này **không** biết gì về bundle hay registry.

### `src/engine/`

Tầng thực thi — nơi các lựa chọn trở thành thay đổi trên đĩa. `artifact-installer.ts` cung cấp `installBundle(cwd, bundle, role)`: đọc manifest, dispatch từng loại artifact (mcp, skill, tool, rule, agent, hook, git-hook, plugin) đến handler tương ứng, và trả về `InstallResult`. `template-renderer.ts` cung cấp `renderTemplate(name, context)`: đọc file `.hbs` từ `templates/` và biên dịch qua Handlebars. `scaffolder.ts` cung cấp `writeScaffoldFile(cwd, file, conflict)`: ghi một file vào project đích với chiến lược `overwrite` hoặc `skip`.

> Lưu ý: `detector.ts` (kiểm tra tooling như ESLint, Prettier, tsconfig) sống trong `src/lib/`, không phải `src/engine/` — vì nó chỉ chạy trong luồng interactive và phụ thuộc `selectedTech` từ wizard context.

### `src/components/`

Tầng hiển thị UI cho toàn bộ CLI. Bao gồm các Ink component tái sử dụng được:
- `steps/`: Các màn hình tương tác của wizard.
- `ui/`: Các component layout chung (Shell, Footer, SelectList).
- `*-display.tsx`: Các component hiển thị kết quả cho từng command (Budget, List, Status, Add, Activate).

### `src/lib/`, `src/hooks/`, `src/store/`

Chứa logic nghiệp vụ dùng chung giữa wizard và các command. Được tách ra khỏi `wizard/` để có thể tái sử dụng:
- `lib/`: Các hàm utility nghiệp vụ (run-ink, detector, filter, tech-options, layout).
- `hooks/`: Các React hook dùng chung cho UI.
- `store/`: Quản lý state dùng chung (BudgetState).

### `src/wizard/`

Tầng điều phối tương tác người dùng cho lệnh `init`. Quản lý luồng multi-step bằng XState machine (`wizardMachine`) với các trạng thái: `projectInfo → techStackSelect → detectTooling → harnessConfig → selectIde → preview → apply → done`. Hàm `runWizard()` là điểm vào chính: khởi động actor và truyền kết quả cho `engine/`. Wizard sử dụng các component từ `src/components/steps/`. Các logic helper như `detector.ts` và `layout.ts` hiện đã được chuyển sang `src/lib/`.

### `src/commands/`

Điểm vào của từng lệnh CLI cụ thể, kết nối tất cả các tầng. `init.ts` gọi `runWizard()` rồi dùng `engine/` để áp dụng kết quả. `add.ts` nhận tên bundle từ argument, tra cứu qua `registry/`, cài đặt qua `engine/`, cập nhật config qua `config/`. `list.ts` gọi `getAllBundles()` và hiển thị kết quả. `status.ts` đọc `harness.json` qua `config/` và báo cáo trạng thái hiện tại. Không có logic nghiệp vụ tại tầng này — chỉ điều phối.

### `src/utils/`

Các helper thuần túy không thuộc tầng nào cụ thể. `bundle-utils.ts` cung cấp `getRoleData(bundle, role)`: ép kiểu an toàn để truy cập `bundle.roles[role as BundleCategory]`, tập trung logic ép kiểu tại một nơi duy nhất thay vì rải rác khắp codebase. Utils chỉ được import `@harness-kit/core` và không import bất kỳ tầng nào khác.

### `src/cli/`

Khai báo cấu trúc lệnh cho commander và kết nối với `commands/`. Không chứa logic nghiệp vụ. `src/index.ts` là entry point của toàn bộ CLI.
