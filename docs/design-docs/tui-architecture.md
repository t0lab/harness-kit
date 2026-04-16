# ADR: TUI Architecture — Ink + Split-Pane Layout

**Status:** Implemented — 2026-04-15 (xem `docs/exec-plans/completed/2026-04-15-wizard-ink-migration.md`)
**Supersedes:** legacy prompt primitives + manual ANSI positioning trong wizard

---

## Context

**Phiên bản trước** của wizard dùng prompt primitives (`MultiSelectPrompt`, `SelectPrompt`, `TextPrompt`, `AutocompletePrompt`) với custom `render()` + alt-screen buffer + absolute-positioned ANSI footer. Approach đó gặp các giới hạn sau khi yêu cầu mở rộng:

1. **Split-pane layout**: left panel (~30% width) hiển thị breadcrumb / summary các step đã hoàn thành; right panel là widget active. Prompt primitives cũ không có layout engine — muốn split-pane phải tự viết ANSI positioning engine.
2. **Realtime budget footer**: token count cập nhật mỗi keystroke (text input) và mỗi toggle (multi-select). Phiên bản trước làm được nhưng phải tự save/restore cursor; mỗi step tự implement, dễ lệch.
3. **Mixed widgets trong cùng session**: text input, multi-select với search, scrollable list, preview pane — mỗi loại là một `render()` riêng, không share layout.
4. **Resize (SIGWINCH)**: phải tự detect `rows/cols` diff và prepend `\x1b[2J\x1b[H`.
5. **Focus chain** (tương lai): prompt primitives cũ không có.

**Triệu chứng cụ thể ở phiên bản trước**: `stepDetectTooling` dùng inline prompt log (`○ Tech stack: nextjs`, `● tsconfig.json`…) leak ra alt-screen canvas, đè lên footer absolute-positioned. Bug này là hệ quả của việc mix hai render model — không fix được triệt để nếu không thống nhất một framework.

## Decision

**Adopt [Ink 6](https://github.com/vadimdemedes/ink)** làm TUI framework duy nhất cho wizard. Tất cả step render qua Ink component tree.

### Lý do

| Tiêu chí | Ink | Prompt primitives (giữ) | OpenTUI | blessed |
|---|---|---|---|---|
| Layout engine | Yoga (flexbox) | Không | Zig + flex | Widget tree |
| Split-pane | Native (`<Box flexDirection="row">`) | DIY ANSI | Native | Native |
| Focus chain | `useFocusManager` | Không | Có | Có |
| Autocomplete search | `ink-search-select` / compose ~80 LoC | `AutocompletePrompt` (hiện có) | Thiếu | Không |
| Re-render cost | Full-tree diff, debounce được | Cheap per-prompt | Zig native — rẻ nhất | Damage buffer |
| Maintenance 2026 | Active (Anthropic, Cloudflare, Shopify dùng) | Active | **Bun-first, Node chưa xong, "not production-ready"** | Stale, nhiều fork không có maintainer chính |
| TS support | First-party `.d.ts` | Tốt | Tốt | Yếu |
| Bundle size (tsup min) | ~250 KB | ~30 KB | ~250 KB + Zig `.node` | ~400 KB |

**Ink là lựa chọn hiện tại duy nhất cân bằng layout power + maturity + Node-native + TS.** OpenTUI xuất sắc về perf nhưng chưa production-ready cho Node — revisit ~6 tháng.

### Alternatives đã cân nhắc

- **Giữ prompt primitives cũ** — fail trên yêu cầu split-pane + focus chain; phải viết layout engine riêng = reinventing Yoga.
- **OpenTUI** — Zig core cho perf tốt hơn Ink rõ rệt, nhưng Bun-first, Node support in-progress, tài liệu label "not production-ready". Rewrite hai lần (legacy prompts → OpenTUI) tệ hơn một lần (legacy prompts → Ink).
- **blessed / neo-blessed** — không có canonical maintainer (nhiều fork), Windows terminal spotty, API imperative cũ.
- **terminal-kit** — imperative, release cadence chậm, không hợp declarative state→UI.
- **Pastel** (Next.js-style router cho Ink) — giải routing, không giải layout. harness-kit đã có commander.

## Consequences

### Better

- Split-pane là `<Box flexDirection="row">` — không phải tự tính absolute cursor.
- SIGWINCH tự động: Ink listen `process.stdout.on('resize')`, Yoga relayout.
- Budget footer = một component `<Budget />` re-render khi state đổi; không cần ANSI save/restore cursor.
- Focus chain có sẵn nếu wizard grow multi-widget.
- Ecosystem: `ink-ui`, `ink-text-input`, `ink-select-input`, `ink-search-select`, `ink-spinner` — không phải tự viết từng primitive.
- Hết bug "inline prompt leak ra alt-screen": chỉ còn một render model.

### Worse

- **Rewrite toàn bộ wizard steps** từ prompt primitive sang Ink component. Scope: `project-info.ts`, `tech-stack-select.ts`, `harness-config.ts`, `detect-tooling.ts`, `preview-apply.ts`, `bundle-select-screen.ts`, `text-prompt-screen.ts`.
- **Bundle tăng ~220 KB**. Chấp nhận được với CLI tool (không phải library).
- **Autocomplete downgrade nhẹ**: `ink-search-select` kém polished hơn `AutocompletePrompt` cũ. Hoặc compose `ink-text-input` + filtered list (~80 LoC).
- **Flicker risk trên keystroke-rate re-render** (Claude Code đã gặp, phải rewrite renderer). **Mitigation bắt buộc**: debounce budget footer 50ms, `React.memo` cho footer và left summary pane, stable keys. Với config wizard (không phải chat UI) đây là non-issue.
- **React mental model**: team phải quen hooks + component tree. Tradeoff nhỏ, TS first-class.

### Must now be true

- Mọi step trong wizard **phải** render qua Ink component tree; cấm `process.stdout.write` ANSI trực tiếp từ step code.
- Inline prompts **không được dùng** bên trong wizard alt-screen (gây render conflict).
- `BudgetState` phải giữ framework-agnostic (plain class, không bind React) để có thể migrate lại nếu OpenTUI chín.
- Budget footer phải debounce ≥ 50ms và memoize; không re-render trên mỗi keystroke.
- Scrollview tự implement qua slice array theo `scrollOffset` (Ink không có native scrollview).

## Layout contract

```
┌──────────────────────────────────────────────────────┐
│  Header: harness-kit init · step 3/6                 │  row 1
├───────────────┬──────────────────────────────────────┤
│               │                                      │
│  Summary      │  Active prompt                       │
│  ✓ Name       │  (text input / multi-select /        │
│  ✓ Purpose    │   autocomplete / preview…)           │
│  ▸ Tech stack │                                      │
│  ○ Harness    │                                      │
│               │                                      │
├───────────────┴──────────────────────────────────────┤
│  Budget 2,187 eager + 111 on-demand · 1.09% of 200k  │  footer
└──────────────────────────────────────────────────────┘
```

- Left panel: `width="30%"`, min 24 cols, max 40 cols. Disable panel nếu `cols < 80` (fallback single-pane).
- Right panel: `flexGrow={1}`.
- Focus luôn ở right panel (v1). Left panel read-only.
- Footer: fixed row ở đáy, debounce 50ms, memoized.

## Migration status

**Completed** — 2026-04-15 (xem `docs/exec-plans/completed/2026-04-15-wizard-ink-migration.md`)

Tất cả step đã rewrite sang Ink component tree. Legacy prompt dependencies đã remove khỏi wizard deps. `CLAUDE.md` rule "Wizard = Ink only" đã bắt buộc.

## References

- [Ink GitHub](https://github.com/vadimdemedes/ink)
- [Claude Code issue #31194 — render lag](https://github.com/anthropics/claude-code/issues/31194) — Anthropic đã rewrite Ink renderer vì flicker.
- [DeepWiki: Claude Code Ink Renderer](https://deepwiki.com/alesha-pro/claude-code/7.1-ink-renderer-and-custom-tui-engine)
- [The Signature Flicker — Peter Steinberger](https://steipete.me/posts/2025/signature-flicker) — Amp's alt-screen fix.
- [Ink TUI Expandable Layouts with Fixed Footer](https://combray.prose.sh/2025-11-28-ink-tui-expandable-layout) — pattern tham khảo.
- [OpenTUI](https://opentui.com/) — theo dõi cho v2.
