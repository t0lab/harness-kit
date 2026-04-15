# Commander — tài liệu tham khảo harness-kit

## Pattern chuẩn

Mỗi lệnh nằm trong file riêng, export một hàm `register*Command(program)`:

```ts
// packages/harness-kit/src/commands/add.ts
export function registerAddCommand(program: Command): void {
  program
    .command('add <bundle>')
    .description('Add a bundle to the current harness')
    .option('--role <role>', 'override default role')
    .action(async (bundleName: string, opts: { role?: string }) => {
      const result = await runAdd(process.cwd(), bundleName, opts)
      printAddResult(result)
    })
}
```

`index.ts` chỉ làm nhiệm vụ lắp ghép — không chứa logic:

```ts
// packages/harness-kit/src/index.ts
export function createCli(): Command {
  const program = new Command()
  program.name('harness-kit').description('...').version(HARNESS_KIT_VERSION)

  registerInitCommand(program)
  registerListCommand(program)
  registerAddCommand(program)
  registerStatusCommand(program)

  return program
}
```

Logic thực tế tách ra hàm riêng có thể test độc lập (`executeAdd`, `printAddResult`).

## Không làm

- **Logic trong `index.ts`** — `.action()` handler dài hơn 5 dòng là dấu hiệu cần tách ra file lệnh.
- **Import registry trực tiếp từ `index.ts`** — mọi truy cập registry đi qua file lệnh hoặc hàm helper riêng.
- **Gọi `program.parse()` nhiều lần** — chỉ gọi một lần ở entry point (`createCli().parseAsync()`).
- **Inline `process.exit()` trong handler** — trả về `never` type hay throw Error rồi để wrapper xử lý.

## Quy ước của project

- Tên hàm: `register<Name>Command(program: Command): void`
- Business logic tách thành `execute<Name>()` — testable, không phụ thuộc Commander
- Output lỗi dùng `console.error()` + `process.exit(1)` trong thin wrapper (`runAdd`)
- Output thành công dùng `console.log()` hoặc chalk
- Nếu cần interactive prompt ngoài wizard (e.g., confirm re-install), dùng `@clack/prompts`
- File lệnh nằm tại `src/commands/<name>.ts`
