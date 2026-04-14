# Listr2 — tài liệu tham khảo harness-kit

## Pattern chuẩn

Tạo danh sách task, mỗi task throw Error khi thất bại:

```ts
import { Listr } from 'listr2'

await new Listr([
  {
    title: 'Writing files...',
    task: async () => {
      for (const file of files) {
        await writeScaffoldFile(cwd, file, conflictMap.get(file.relativePath) ?? 'overwrite')
      }
    },
  },
]).run()
```

Nhiều task tuần tự:

```ts
await new Listr([
  {
    title: 'Validating config',
    task: async () => {
      const valid = await validateHarnessConfig(cwd)
      if (!valid) throw new Error('harness.json is invalid')
    },
  },
  {
    title: 'Installing artifacts',
    task: async () => {
      await installBundle(cwd, bundle, role)
    },
  },
]).run()
```

## Không làm

- **`concurrent: true` khi các task ghi cùng file** — race condition; mặc định tuần tự là an toàn, chỉ bật concurrent khi task hoàn toàn độc lập.
- **`console.log` bên trong task** — phá vỡ renderer của Listr; ném Error hoặc cập nhật `task.title` thay thế.
- **Lồng Listr quá 2 cấp** — khó debug và UI rối; nếu cần, tách thành hàm helper riêng trả về task list.
- **Bắt lỗi trong task rồi im lặng** — luôn re-throw hoặc để lỗi lan ra; Listr cần biết task thất bại để hiển thị đúng.

## Quy ước của project

- Import: `import { Listr } from 'listr2'` — không import default
- Dùng Listr cho bước "apply" ghi file (`stepPreviewApply`), không dùng cho prompt hay spinner
- `p.spinner()` của clack cho tác vụ đơn (scan, render); Listr cho pipeline nhiều bước có tên
- Task title là cụm danh từ ngắn: `'Writing files...'`, không phải câu hỏi hay mệnh đề phức
- File liên quan: `src/wizard/steps/preview-apply.ts`
