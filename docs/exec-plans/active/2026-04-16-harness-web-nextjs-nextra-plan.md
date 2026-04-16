# Harness Web (Next.js + Nextra + shadcn) - Execution Plan

**Trạng thái:** Active  
**Ngày tạo:** 2026-04-16  
**Owner:** harness-kit  
**Phạm vi:** Website landing + docs portal, mỗi bundle một trang từ README trong registry.

## Goal
Triển khai web app `apps/harness-web` dùng Next.js + Nextra + shadcn, render docs per-bundle từ README hiện có, có landing, docs index, bundle detail page, và pipeline đồng bộ nội dung.

## Background
Mục tiêu giai đoạn 1 là có website chính thức cho dự án (landing + docs), không chỉ demo CLI. Dự án đã có README cho từng bundle ở `packages/harness-kit/src/registry/bundles/**/README.md`, nên cần tận dụng làm source-of-truth để tránh duplicate docs.  
Nền hiển thị chọn Nextra (theo yêu cầu) và UI layer lấy shadcn làm gốc để đồng bộ trải nghiệm với docs style hiện đại, tối ưu khả năng mở rộng component.

## Tasks

- [ ] Task 1 - Scaffold web app monorepo tại `apps/harness-web`
  - Done when: app khởi tạo thành công với Next.js App Router + TypeScript + Nextra; chạy được route mặc định.
  - Files: `pnpm-workspace.yaml`, `package.json` (root scripts), `apps/harness-web/package.json`, `apps/harness-web/app/*`, `apps/harness-web/next.config.*`

- [ ] Task 2 - Thiết lập base UI theo shadcn
  - Done when: có cấu hình shadcn/tailwind/theme, dựng được layout docs shell (`header`, `sidebar`, `content`) và style ổn định.
  - Files: `apps/harness-web/components/*`, `apps/harness-web/lib/utils.ts`, `apps/harness-web/app/globals.css`, `apps/harness-web/components.json`

- [ ] Task 3 - Xây content sync pipeline từ bundle README -> web content
  - Done when: script sync tạo/refresh file nội dung bundle tại `apps/harness-web/content/bundles/<category>/<bundle>.mdx`, có map slug + metadata cơ bản.
  - Files: `apps/harness-web/scripts/sync-bundle-docs.ts`, `apps/harness-web/content/bundles/**`, `apps/harness-web/lib/bundles-index.ts`

- [ ] Task 4 - Xây routing landing + docs + bundle detail
  - Done when: hoạt động đủ route chính:
    - `/` landing
    - `/docs` docs home
    - `/docs/bundles/[category]/[slug]` bundle page
    và render đúng nội dung từ content sync.
  - Files: `apps/harness-web/app/page.tsx`, `apps/harness-web/app/docs/page.tsx`, `apps/harness-web/app/docs/bundles/[category]/[slug]/page.tsx`

- [ ] Task 5 - Chuẩn hóa package strategy theo bộ dependency frontend bạn thường dùng
  - Done when: package chia thành 3 tầng rõ ràng và chỉ cài khi cần:
    - **Core bắt buộc ngay:** `next`, `react`, `react-dom`, `zod`, `clsx`, `class-variance-authority`, `tailwind-merge`, `lucide-react`, `next-themes`, `sonner`, `date-fns`
    - **Docs/catalog/search:** `cmdk`, `@tanstack/react-query`, `@tanstack/react-table`, `recharts`
    - **Feature-gated (không cài mặc định giai đoạn 1):** `next-auth`, `posthog-js`, `posthog-node`, `@sentry/nextjs`, `@aws-sdk/client-s3`, `@monaco-editor/react`, `monaco-editor`, nhóm `@jupyterlab/*`, `@datalayer/*`
  - Files: `apps/harness-web/package.json`, `docs/design-docs/harness-web-architecture.md`

- [ ] Task 6 - Viết docs maintain pipeline
  - Done when: contributor đọc docs có thể tự thêm bundle docs mà không cần hỏi lại:
    - cập nhật README bundle
    - chạy sync script
    - kiểm tra route bundle
  - Files: `docs/design-docs/harness-web-architecture.md`, `docs/references/harness-web-content-pipeline.md`

- [ ] Task 7 - Verification + quality gates
  - Done when:
    - `pnpm --filter harness-web dev` chạy local
    - `pnpm --filter harness-web build` pass
    - `pnpm --filter harness-web lint` pass
    - số trang bundle tạo ra khớp số bundle có README
  - Files: `apps/harness-web/package.json`, `apps/harness-web/scripts/check-content-integrity.ts`

## Decisions log
- 2026-04-16: Chốt app path là `apps/harness-web` thay vì `apps/docs` để tránh tên quá generic trong monorepo.
- 2026-04-16: Chốt docs engine là Nextra; shadcn làm UI foundation.
- 2026-04-16: Chốt chiến lược “mỗi bundle một trang” từ README hiện có trong registry.

## Blockers
None.

## Out of scope
- Chưa làm auth cho website docs ở phase này (không gate bởi `next-auth`).
- Chưa tích hợp analytics/telemetry production (`posthog`, `sentry`) ở phase 1.

