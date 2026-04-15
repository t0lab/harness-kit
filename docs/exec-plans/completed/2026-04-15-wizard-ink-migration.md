# Exec Plan: Wizard Ink Migration

**Status:** Completed — 2026-04-15
**ADR:** `docs/design-docs/tui-architecture.md`
**Reference:** `docs/references/ink-patterns.md`

## Outcome (2026-04-15)

Tất cả 7 Block đã ship. Wizard hiện 100% Ink + xstate; `@clack/core` đã loại khỏi deps; `@clack/prompts` chỉ còn ở `commands/add.ts` (ngoài alt-screen). File layout cuối được folder hoá theo chuẩn React: `wizard/components/{ui,steps}`, `wizard/hooks`, `wizard/store`, `wizard/lib`. Empty `src/cli/` đã xoá. Fix UX cuối: `key={question.key}` reset cursor giữa các category, line-clamp-2 cho summary value, sanitize `\n` trong text input, flatten React fragment trong preview để tránh Yoga overlap.


## Goal

Thay toàn bộ render model của wizard từ `@clack/core` + ANSI absolute-positioned footer sang Ink component tree. Fix render leak giữa inline log (`@clack/prompts`) và alt-screen canvas. Giữ `main` green sau mỗi Block.

## Invariants

- `BudgetState` **không** import React — giữ framework-agnostic.
- Mỗi Block phải build + test pass trước khi sang Block kế.
- Không `@clack/prompts` inline prompt bên trong wizard alt-screen.

## Blocks

### Block 1 — Deps + TUI scaffold

- [ ] Thêm deps: `ink`, `@inkjs/ui`, `ink-text-input`, `ink-select-input`, `react`, `@types/react` vào `packages/harness-kit/package.json`
- [ ] Cập nhật `tsup.config` + `tsconfig` cho JSX (`"jsx": "react-jsx"`)
- [ ] Scaffold `packages/harness-kit/src/wizard/tui/`:
  - `WizardShell.tsx` — split-pane layout (header / summary+active / footer)
  - `Footer.tsx` — budget footer memoized + debounced
  - `Summary.tsx` — left panel breadcrumb
  - `use-budget-snapshot.ts` — `useSyncExternalStore` bridge
  - `run-ink.ts` — alt-screen lifecycle wrapper
- [ ] `BudgetState` thêm `subscribe(listener)` + `notify()` (không import React)
- [ ] Test: `pnpm --filter @harness-kit/cli build` xanh

Done condition: build pass, wizard cũ vẫn chạy (chưa thay).

### Block 2 — Migrate `project-info`

- [ ] Viết `steps/project-info.tsx` dùng Ink + `ink-text-input`, 4 field tuần tự hoặc một màn hình 4 input.
- [ ] Xoá `text-prompt-screen.ts` nếu không còn caller.
- [ ] `budget.projectText` update qua onChange, footer tự refresh.
- [ ] Smoke test: `pnpm build && node dist/index.js init` đi qua step 1 OK.

### Block 3 — Migrate `harness-config`

- [ ] Viết `steps/harness-config.tsx` — 6 multi-select + 1 select category, dùng `ink-select-input` hoặc compose.
- [ ] Footer cập nhật realtime khi toggle.
- [ ] Smoke test: step 2 hoàn tất, selection propagate vào `WizardContext`.

### Block 4 — Rewrite `detect-tooling`

- [ ] Xoá toàn bộ `@clack/prompts` inline. Render detect results trong Ink component (danh sách + confirm).
- [ ] Reuse `detector.ts` / `detect-tech.ts` logic, chỉ thay view layer.

### Block 5 — Migrate `tech-stack-select` (rủi ro cao nhất)

- [ ] Compose `ink-text-input` + filtered list pattern (xem ink-patterns.md autocomplete section).
- [ ] Multi-select state với space toggle, arrow navigate, enter confirm.
- [ ] Scroll windowing qua `ScrollList` component.
- [ ] Footer realtime.

### Block 6 — Migrate `preview-apply`

- [ ] Scrollable file list + confirm/back buttons bằng Ink.
- [ ] Remove `bundle-select-screen.ts` nếu không còn caller.

### Block 7 — Cleanup

- [ ] Remove `@clack/core` từ `dependencies` (giữ `@clack/prompts` nếu còn dùng cho spinner/intro ngoài wizard).
- [ ] Xoá `layout.ts` ANSI helpers nếu không caller.
- [ ] Update `CLAUDE.md`: thêm rule "wizard = Ink only".
- [ ] Update `docs/design-docs/tui-architecture.md` Status → Implemented.

## Risks

- Flicker trên terminal chậm (VS Code integrated). Mitigation: debounce 50ms + `memo` đã document.
- `ink-text-input` multi-field screen — chưa test; fallback sequential text prompts nếu không ổn.
- JSX config conflict với tsup — có thể cần `esbuild` loader flag.

## Rollback

Mỗi Block commit riêng. Nếu Block N lỗi, revert Block N, giữ Block 1..N-1.
