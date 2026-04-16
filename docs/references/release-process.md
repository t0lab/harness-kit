# Release Process — harness-kit

## Mục tiêu

Tài liệu này mô tả quy trình release package trong monorepo `harness-kit`, đặc biệt cho:

- `@harness-kit/core`
- `@harness-kit/cli`

Quy trình này tồn tại để tránh 2 lỗi đã gặp thực tế:

- publish CLI bằng `npm publish` khiến dependency `workspace:*` không được rewrite
- bump version package nhưng CLI vẫn hiển thị version cũ vì `harness-kit --version` lấy từ `HARNESS_KIT_VERSION` trong `packages/core/src/index.ts`

## Quy tắc bắt buộc

- **Dùng `pnpm publish`, không dùng `npm publish`** cho workspace package
- **Giữ dependency nội bộ là `workspace:*`** trong source package.json
- **Publish `@harness-kit/core` trước `@harness-kit/cli`**
- **Bump `HARNESS_KIT_VERSION` cùng lúc với CLI release**

## Vì sao phải dùng pnpm publish

`pnpm publish` sẽ rewrite dependency kiểu `workspace:*` thành version thật trong tarball publish.

Ví dụ trong source:

```json
"dependencies": {
  "@harness-kit/core": "workspace:*"
}
```

Khi publish bằng `pnpm`, dependency này được chuyển thành version npm thật.

Nếu publish bằng `npm publish`, chuỗi `workspace:*` đi thẳng lên registry và người dùng sẽ gặp lỗi kiểu:

```text
npm error Unsupported URL Type "workspace:": workspace:*
```

## File cần bump khi release

### Core

- `packages/core/package.json`

### CLI

- `packages/harness-kit/package.json`
- `packages/core/src/index.ts`

`packages/core/src/index.ts` hiện export:

```ts
export const HARNESS_KIT_VERSION = '...'
```

CLI dùng constant này để hiển thị `--version`, nên nếu không bump chỗ này thì version runtime sẽ lệch version package publish.

## Quy trình release chuẩn

### 1. Kiểm tra working tree

```bash
git status --short
```

Không release khi còn thay đổi chưa hiểu rõ. Nếu có thay đổi local trong `examples/`, xác nhận chúng không ảnh hưởng package publish.

### 2. Bump version

Ví dụ release:

- `@harness-kit/core` → `0.1.4`
- `@harness-kit/cli` → `0.2.0-beta.9`
- `HARNESS_KIT_VERSION` → `0.2.0-beta.9`

### 3. Build lại packages

```bash
pnpm --filter @harness-kit/core build
pnpm --filter @harness-kit/cli build
```

### 4. Publish core trước

```bash
cd packages/core
pnpm publish --tag latest --access public --no-git-checks
```

### 5. Publish CLI sau

```bash
cd packages/harness-kit
pnpm publish --tag beta --access public --no-git-checks
```

Nếu đang cắt stable release cho CLI thì đổi `--tag beta` thành tag phù hợp.

### 6. Verify trên npm

```bash
npm view @harness-kit/core version
npm view @harness-kit/cli dist-tags --json
```

Ví dụ output mong đợi:

```json
{
  "latest": "0.1.1",
  "beta": "0.2.0-beta.9"
}
```

### 7. Smoke test bằng npx

Chạy ở một thư mục ngoài repo hoặc project test trống:

```bash
npx @harness-kit/cli@beta init
```

Mục tiêu của bước này là bắt lỗi publish-time:

- `workspace:*` không được rewrite
- `bin` sai format
- thiếu file trong `files`
- entrypoint chạy lỗi khi cài từ npm thay vì chạy local

Đặc biệt với `@harness-kit/cli`, các asset runtime được copy lúc `init` cũng phải có mặt trong tarball publish:

- `templates/`
- `rules/`
- `skills/`
- `hooks/`
- `git-hooks/`
- `agents/`

## Quy ước tag

- `@harness-kit/core`
  - thường publish `latest`
- `@harness-kit/cli`
  - pre-release publish `beta`
  - chỉ promote sang `latest` khi đã smoke test ổn

## Các lỗi thường gặp

### 1. `workspace:*` bị leak lên npm

Nguyên nhân:

- publish bằng `npm publish`

Cách xử lý:

- giữ nguyên `workspace:*` trong source
- publish lại bằng `pnpm publish`
- phát hành một version mới thay vì cố sửa bản đã publish

### 2. CLI hiện sai version

Nguyên nhân:

- bump `packages/harness-kit/package.json`
- nhưng quên bump `packages/core/src/index.ts`

Cách xử lý:

- luôn cập nhật `HARNESS_KIT_VERSION` cùng version CLI

### 3. npm cảnh báo trường `bin`

Không dùng:

```json
"bin": {
  "harness-kit": "./dist/index.js"
}
```

Dùng:

```json
"bin": {
  "harness-kit": "dist/index.js"
}
```

### 4. Publish core xong nhưng CLI vẫn kéo type/runtime cũ

Nguyên nhân:

- chưa build lại package sau khi bump

Cách xử lý:

- rebuild `core` trước khi publish
- rebuild `cli` sau khi bump version liên quan

### 5. `init` chạy được nhưng asset copy bị `ENOENT`

Nguyên nhân:

- package `@harness-kit/cli` publish thiếu asset runtime trong trường `files`
- thường thấy ở `hooks/`, `git-hooks/`, `agents/`

Cách xử lý:

- thêm thư mục bị thiếu vào `packages/harness-kit/package.json#files`
- publish một version mới
- chạy lại smoke test `npx @harness-kit/cli@beta init`

## Không làm

- **Không hard-code version nội bộ thay cho `workspace:*` chỉ để publish**
- **Không dùng `npm publish` cho workspace package**
- **Không publish CLI trước core**
- **Không bỏ qua bước smoke test `npx`**

## Checklist ngắn

- [ ] Working tree đã được kiểm tra
- [ ] Bump `packages/core/package.json`
- [ ] Bump `packages/harness-kit/package.json`
- [ ] Bump `packages/core/src/index.ts`
- [ ] `pnpm --filter @harness-kit/core build`
- [ ] `pnpm --filter @harness-kit/cli build`
- [ ] kiểm tra `packages/harness-kit/package.json#files` có đủ asset runtime
- [ ] `pnpm publish` cho core
- [ ] `pnpm publish` cho CLI
- [ ] `npm view` kiểm tra version/dist-tags
- [ ] `npx @harness-kit/cli@beta init` smoke test
