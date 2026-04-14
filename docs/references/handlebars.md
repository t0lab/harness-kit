# Handlebars — tài liệu tham khảo harness-kit

## Pattern chuẩn

Đọc file `.hbs`, compile và render với context — mỗi lần render đọc mới từ disk (template nhỏ, không cần cache):

```ts
import Handlebars from 'handlebars'
import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = __dir.includes('/dist')
  ? join(__dir, '../templates')
  : join(__dir, '../../templates')

export async function renderTemplate(name: string, context: Record<string, unknown>): Promise<string> {
  const templatePath = join(TEMPLATES_DIR, name)
  const source = await readFile(templatePath, 'utf-8')
  const template = Handlebars.compile(source)
  return template(context)
}
```

Đăng ký helper tại module level (chạy một lần khi import):

```ts
Handlebars.registerHelper('includes', (arr: string[], val: string) =>
  Array.isArray(arr) && arr.includes(val)
)

Handlebars.registerHelper('ifEqual', function (
  this: unknown, a: string, b: string, options: Handlebars.HelperOptions
) {
  return a === b ? options.fn(this) : options.inverse(this)
})
```

Gọi từ step:

```ts
{ relativePath: 'CLAUDE.md', content: await renderTemplate('CLAUDE.md.hbs', templateCtx) }
```

## Không làm

- **Logic nghiệp vụ trong template** — template chỉ format dữ liệu; tính toán, lọc mảng thuộc về TypeScript trước khi truyền vào context.
- **Triple-stash `{{{...}}}` không có lý do** — chỉ dùng khi output cố tình là HTML/raw; double-stash mặc định là an toàn.
- **Compile lại template mỗi lần render trong hot path** — `Handlebars.compile()` tốn CPU; nếu render nhiều lần cùng template, cache hàm compile. (Project hiện tại render một lần per init — chấp nhận được.)
- **Đặt template ngoài thư mục `templates/`** — build script copy `templates/` vào dist; file `.hbs` ngoài thư mục đó sẽ không có trong bản phân phối.

## Quy ước của project

- Tất cả template tại `packages/harness-kit/templates/*.hbs`
- Tên file khớp với file đích: `CLAUDE.md.hbs` → `CLAUDE.md`, `harness.json.hbs` → `harness.json`
- `TEMPLATES_DIR` tự phát hiện môi trường dist vs src qua `__dir.includes('/dist')`
- Helper đăng ký trong `src/engine/template-renderer.ts` — không đăng ký helper trong test hoặc bước wizard
- Context truyền vào là `Record<string, unknown>`; tạo `templateCtx` riêng trong step, không truyền thẳng `WizardContext`
