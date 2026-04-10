# Examples

Các project mẫu để test `harness-kit` trực tiếp trong quá trình phát triển.

## Cách dùng

Từ root của repo, build harness-kit trước:

```bash
pnpm build
```

Sau đó vào thư mục example muốn test:

```bash
cd examples/basic-node
node ../../packages/harness-kit/dist/index.js init
# hoặc sau khi link global:
# harness-kit init
```

## Examples

| Folder | Mô tả |
|--------|-------|
| `basic-node` | Node.js project đơn giản, không có TypeScript |
| `typescript-project` | TypeScript project với tsconfig sẵn |

## Link global để test như user thật

```bash
# Từ root repo
pnpm --filter @harness-kit/cli build
cd packages/harness-kit && npm link
# Giờ có thể chạy harness-kit từ bất kỳ đâu
harness-kit --version
```
