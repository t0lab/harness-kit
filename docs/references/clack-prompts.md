# @clack/prompts — tài liệu tham khảo harness-kit

## Pattern chuẩn

Import toàn bộ namespace, kiểm tra `isCancel` sau mỗi prompt tương tác:

```ts
import * as p from '@clack/prompts'

// Spinner cho tác vụ async
const spinner = p.spinner()
spinner.start('Scanning your project...')
const issues = await detectTooling(process.cwd(), ctx.selectedTech)
spinner.stop('Scan complete')

// Log kết quả — dùng p.log thay console.log
for (const issue of issues) {
  if (issue.found) p.log.success(issue.label)
  else p.log.warn(`${issue.label} not configured`)
}

// Multiselect với kiểm tra isCancel bắt buộc
const toInstall = await p.multiselect({
  message: 'Install missing tools?',
  options: installable.map((i) => ({ label: i.label, value: i.label })),
  required: false,
})
if (p.isCancel(toInstall)) { p.cancel('Cancelled'); process.exit(0) }

// Confirm với isCancel
const confirm = await p.confirm({ message: 'Apply?', initialValue: true })
if (p.isCancel(confirm) || !confirm) { p.cancel('Cancelled'); process.exit(0) }
```

Kết thúc wizard dùng `p.outro()`:

```ts
p.outro(`harness-kit initialized.\nRun: ${chalk.blue('harness-kit status')}`)
```

## Không làm

- **Bỏ qua `isCancel` check** — người dùng nhấn Ctrl+C trả về Symbol, truy cập property sẽ crash.
- **Dùng `console.log` trong vùng clack** — làm vỡ layout terminal; dùng `p.log.info()`, `p.log.success()`, `p.log.warn()`, `p.note()`.
- **Dùng Inquirer hoặc prompts song song với clack** — xung đột terminal state, chỉ dùng một thư viện prompt trong toàn wizard.
- **Gọi `p.intro()` / `p.outro()` nhiều lần** — chỉ gọi một lần ở đầu và cuối luồng wizard.

## Quy ước của project

- Mọi prompt tương tác nằm trong `src/wizard/steps/*.ts`
- Lệnh CLI (`src/commands/`) không dùng clack trừ khi cần confirm đơn giản (xem `add.ts`)
- `p.spinner()` bọc mọi tác vụ I/O hoặc exec tốn hơn ~200ms
- Thứ tự log: `p.log.step` → spinner → `p.log.success/warn` theo từng mục
- Huỷ luồng: `p.cancel('Cancelled'); process.exit(0)` — không throw, không return
