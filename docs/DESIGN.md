# Product Design

## What harness-kit là gì
CLI scaffolds môi trường AI agent harness cho project. Distribution model: artifacts
được copy vào project, user owns them, không có runtime dependency.

## Target user
Developer vibecoding nhiều projects đồng thời, muốn setup harness cho
AI agent nhanh và đúng ngay từ đầu. Không muốn config thủ công từng thứ.

## Trajectory

- **Phase 1 (hiện tại):** Developer tool — `npx harness-kit init`, solid DX,
  artifact quality, full wizard flow
- **Phase 2:** Web docs/showcase site (browse bundles, copy install commands)
- **Phase 3:** Open source, community bundles

## Non-goals (không bao giờ build)

- Runtime dependency on harness-kit
- Auto-maintain artifacts sau khi copy (user owns them)
- Lock-in vào một AI provider hoặc IDE cụ thể
- Central server hoặc SaaS layer

## Key Decisions

- **Bundle registry là TypeScript** (không phải JSON manifests) — type-safe,
  dễ query, IDE support tốt
- **commander thay vì yargs** — simpler API, fewer deps, dễ agent model
- **@clack/prompts thay vì Inquirer** — purpose-built wizard UI, no TTY conflicts
- **xstate v5 cho wizard** — explicit state machine dễ extend, không spaghetti
