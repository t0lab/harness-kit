# typescript-project

TypeScript project với `tsconfig.json` sẵn — dùng để test smart detection của `harness-kit init`.

Smart detection sẽ nhận ra TypeScript và bỏ qua việc recommend cài thêm tsconfig.

## Test

```bash
# từ root repo
pnpm build
node ../../packages/harness-kit/dist/index.js init
```
