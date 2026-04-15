# Đánh Giá harness-kit Từ Góc Độ Harness Engineering

> Snapshot đánh giá harness-kit — 2026-04-14.
> Kế hoạch thực thi roadmap: [docs/exec-plans/active/2026-04-15-from-scaffolding-to-harness-toolkit.md](../exec-plans/active/2026-04-15-from-scaffolding-to-harness-toolkit.md)

---

## 1. Điểm mạnh (so với khung harness engineering)

### Kiến trúc đúng triết lý "design the environment"

- **Copy-own distribution (shadcn model)** — user sở hữu artifact, không runtime dep. Đây là điểm đúng nhất. Harness engineering nhấn mạnh "environment is code" → artifact phải readable, editable, versioned trong repo user.
- **Layer discipline** (`core → registry → config → engine → wizard → commands`) ngăn chặn cross-concern leak — rất hiếm gặp ở dev-tool CLI, thường bị trộn logic.
- **Registry là data, không code** → thêm bundle không động vào wizard. Đây là mechanical enforcement đúng với belief #5 ("Enforce mechanically, not documentally").

### Coverage các trục harness chính

- Memory (4), browser (2), search (3), scrape (2), git workflow, quality gates, TDD, spec-driven, docs-as-code. Đủ rộng cho một starter kit.
- Self-dogfoods — repo này dùng chính artifacts của nó, tạo feedback loop thật.

### Docs-as-code nghiêm túc

`ARCHITECTURE.md`, `design-docs/core-beliefs.md`, `references/<lib>.md`, exec-plans active/completed. Đây là "repository as system of record" được thực thi, không chỉ nói.

---

## 2. Nhược điểm & lỗ hổng harness engineering

Harness engineering có 8 trụ: **context · tools · feedback loops · memory · guardrails · eval/telemetry · orchestration · reproducibility**.

Harness-kit mạnh ở 3 trụ đầu (context, tools, memory), yếu/thiếu ở 5 trụ sau.

### Thiếu trầm trọng (P0)

1. **Không có eval/benchmark harness**
   Không có cách đo "cấu hình này có làm agent tốt hơn không". Không có bundle nào cho golden tasks, regression tracking, A/B cấu hình. Đây là lỗ hổng lớn nhất: đang đoán mò thay vì đo.

2. **Không có telemetry/observability**
   Token usage per turn, tool call rate, cache hit rate, where agent stalled. Claude Code có OTEL support — thiếu bundle productionize nó.

3. **Không có hooks bundle**
   Claude Code hooks (PreToolUse, PostToolUse, Stop, UserPromptSubmit) là primitive harness mạnh nhất để enforce guardrails mechanically. Memory/preferences không thay thế được. Nên có `hooks/auto-format`, `hooks/secret-scan`, `hooks/test-on-stop`, v.v.

4. **Không có subagent/orchestration bundle**
   Không ship curated subagents (code-reviewer, test-runner, migration-safety-check, exploration agent). Mỗi project phải tự viết.

5. **Không có reproducibility/sandbox bundle**
   Docker devcontainer, git worktree workflow, firejail. Agent chạy `rm -rf` hay `pnpm install` trên host là rủi ro.

### Thiếu vừa — quan trọng (P1)

6. **"Just enough" chỉ là lời nói, không đo**
   Belief #2 tuyên bố ~40% ngưỡng degraded, nhưng không có `harness-kit budget` tính token cost từng bundle, tổng stack, % context window. Preview step nên show: *"Bạn đã chọn 8 bundle ≈ 38k tokens ≈ 19% của 200k"*.

7. **Không có drift detection**
   Artifact copy rồi không update. `harness-kit doctor` hoặc `diff` để báo "skill `tdd` của bạn cũ hơn registry 3 version" là thiết yếu cho copy-own model.

8. **Memory bundles có 4 nhưng không có router/auto-memory pattern**
   Pattern "user/feedback/project/reference" trong `~/.claude/CLAUDE.md` là pattern rất mạnh, chưa được bundle hóa.

9. **Không có model-routing strategy bundle**
   Khi nào Opus/Sonnet/Haiku, khi nào fast mode, khi nào plan mode. Rule + skill để agent tự quyết định tier.

10. **Không có failure-recovery pattern**
    "Khi test fail lần 3 liên tiếp, dừng lại báo user" — agent dễ burn tokens vô tận trong loop sửa lỗi.

### Thiếu nhẹ — nice-to-have (P2–P3)

11. **Thiếu tooling bundles:** LSP/language-server MCP, database schema inspection MCP, log-tail MCP, CI/deploy status MCP, package-install-safety.
12. **Chỉ Claude Code** — README nói "extensible" nhưng không có abstraction cho Cursor/Cline/Codex CLI.
13. **Không có preset-of-presets** ("minimalist" / "full-power" / "research" / "enterprise") — giảm cognitive load wizard.
14. **Bundle manifest thiếu `contextCost`** — mỗi bundle nên declare rough token cost để engine tính tổng.
15. **Không có smoke-test sau init** — user không biết harness có work cho đến khi lần đầu gọi agent.
16. **Security posture thin** — `security-review` là review code, nhưng thiếu secret-scan hook, MCP trust model, permission matrix cho Bash tool.

---

## 3. Roadmap ưu tiên

| Ưu tiên | Bundle/Feature | Tại sao |
|---|---|---|
| P0 | `hooks/` bundle family | Primitive guardrail mạnh nhất, Claude Code-native |
| P0 | `harness-kit budget` command + `contextCost` trong manifest | Chứng minh "just enough" bằng số |
| P0 | `eval-harness` bundle | Không đo → không biết harness nào tốt |
| P1 | `subagents/` bundle family + orchestration skill | Parallelize + context isolation |
| P1 | `telemetry-otel` bundle | Observability production-grade |
| P1 | `harness-kit doctor` (drift detection) | Copy-own bắt buộc phải có |
| P2 | `sandbox/devcontainer` bundle | Reproducibility |
| P2 | `auto-memory` bundle (router pattern) | Pattern đã chứng minh hiệu quả |
| P2 | Model-routing rule bundle | Cost + latency lever lớn |
| P3 | Cross-IDE abstraction (Cursor/Codex) | Mở rộng thị trường |

---

## 4. Tóm lại

Harness-kit đang là **"scaffolding kit xuất sắc cho layer context + tools"** nhưng chưa phải **"full harness engineering toolkit"**.

Thiếu feedback-loop layer (eval/telemetry/hooks) và isolation layer (sandbox/subagent).

Thêm 3–4 bundle P0 sẽ đưa nó từ **"setup tool"** thành **"harness as a product"**.
