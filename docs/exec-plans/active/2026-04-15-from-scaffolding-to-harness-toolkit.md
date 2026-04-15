# From Scaffolding Kit to Harness Engineering Toolkit

**Trạng thái:** Active
**Ngày tạo:** 2026-04-15
**Nguồn:** [docs/evaluations/2026-04-14-harness-engineering.md](../../evaluations/2026-04-14-harness-engineering.md)
**Mục tiêu:** Lấp feedback-loop layer + isolation layer để harness-kit vượt "setup tool" thành "harness as a product", đồng thời tôn trọng các điểm mạnh đã có (copy-own, layer discipline, registry-as-data, docs-as-code).

> Không estimate thời gian. Block A là gate bắt buộc xong trước B/C/D. Block nào không kịp roll sang plan kế tiếp.

---

## 1. Nguyên tắc giữ nguyên (không được phá)

Eval doc mục 1 ghi nhận 3 điểm mạnh phải bảo toàn khi mở rộng:

- **Copy-own distribution** — mọi bundle mới vẫn phải copy artifact vào repo user, không runtime dep. Kiểm chứng: bundle mới không thêm dependency vào `package.json` user.
- **Layer discipline** — `core → registry → config → engine → wizard → commands`. Lint guard bằng import-path rule.
- **Registry là data, không code** — thêm bundle không sửa wizard/engine. Chỉ thêm entry trong `packages/harness-kit/src/registry/`.
- **Dogfood liên tục** — mỗi bundle mới phải được install lại vào chính repo này để test feedback loop thật.

---

## 2. Bản đồ 8 trụ → Gap → Bundle

| Trụ | Hiện trạng | Gap (eval §2) | Block |
|---|---|---|---|
| Context | Mạnh (memory × 4, docs-as-code) | #8 auto-memory router chưa bundle hóa | D2 |
| Tools | Mạnh (browser × 2, search × 3, scrape × 2) | #11 thiếu LSP/DB/log/CI MCP | D4 |
| Feedback loops | **Thiếu** | #1 eval, #10 failure-recovery | B2, B4 |
| Memory | Ổn | #8 router pattern | D2 |
| Guardrails | **Thiếu** | #3 hooks, #16 security posture | B1, B5 |
| Eval/telemetry | **Thiếu** | #1 eval, #2 telemetry, #6 budget | A2, B2, C2 |
| Orchestration | **Thiếu** | #4 subagents, #9 model routing | C1, D3 |
| Reproducibility | **Thiếu** | #5 sandbox, #7 drift, #14 contextCost | A1, B3, D1 |

---

## 3. Block A — Foundation (gate)

Phải xong trước mọi thứ. Nguyên tắc: **đo realtime từ file trên đĩa**, không hardcode trong manifest — vì copy-own model cho phép user edit artifact bất kỳ lúc nào, số liệu publish-time sẽ stale.

- [x] **A1. Realtime cost engine** *(gap #14 — redesigned)* — **Done 2026-04-15**
  - ✓ `packages/core/src/token-count.ts` — `countTokens(text)` dùng `tiktoken` `cl100k_base`, fallback `chars/4`; trả `{ tokens, method }`.
  - ✓ `packages/harness-kit/src/engine/context-cost.ts` — `scanArtifacts()` scan toàn bộ `.claude/skills/**`, `.claude/rules/**`, `.claude/agents/**`, `.claude/hooks/**`, `.agents/skills/**` (follow symlinks), `CLAUDE.md`, `AGENTS.md`, `.mcp.json`. Phân loại `source` via `resolveManagedPaths()` cross-check với `harness.json`.
  - ✓ Bug fix: `walk()` không follow symlinks → symlinked skill directories (`.claude/skills/*` → `.agents/skills/*`) bị skip. Fixed via `stat()` per-entry để resolve targets.
  - ✓ Per-file output: `{ path, tokens (eager + on-demand), method, source: 'harness-kit' | 'user' }`.
  - ✓ Unit tests + integration tests pass (188/188).
  - ✓ Wizard cost estimation pre-install hoạt động chính xác.

- [x] **A2. `harness-kit budget` command** *(gap #6)* — **Done 2026-04-15**
  - ✓ Gọi `scanArtifacts()` + `computeContextCost()` on target project.
  - ✓ Output breakdown: **Harness-kit managed** (group per bundle, sum eager + on-demand) + **User-authored** (file outside bundles).
  - ✓ Tổng tokens + % of context window (default 200k, overridable via `--context-window` / env / `harness.json`).
  - ✓ Warn nếu eager > 40% window (belief #2).
  - ✓ Flag `--json` cho scripting.
  - ✓ CLI smoke pass; self-harness budget output correct: 6,373 eager + 102,322 on-demand (includes all symlinked skills).

## 4. Block B — P0 guardrails & measurement

- [ ] **B1. `workflow/hooks-guardrails` bundle** *(gap #3 — primitive mạnh nhất)*
  - Hooks ship:
    - `auto-format` — PostToolUse on Edit|Write, chạy formatter theo tech stack detected
    - `secret-scan` — PreToolUse on Write|Edit|Bash, block nếu regex match (AWS/GCP/GH token, private key)
    - `test-on-stop` — Stop hook, chạy `pnpm test` nếu có changed file trong session
    - `conflict-marker-guard` — PreToolUse on Bash `git commit`
  - Mỗi hook là một `.sh` drop vào `.githooks/pre-commit.d/` hoặc `.claude/hooks/`, plus `settings.json` patch
  - Done: adversarial test — prompt `echo "AKIA..." > f.txt` via Write → hook block; prompt có conflict marker → git commit bị chặn.

- [ ] **B2. `workflow/eval-harness` bundle** *(gap #1 — lỗ hổng lớn nhất)*
  - Golden-task runner: YAML schema `{ task, input, expected_artifacts, expected_tool_calls? }`
  - Baseline recording (`eval record`) → snapshot vào `evals/baselines/`
  - Regression (`eval run`) → diff vs baseline, exit 1 nếu drift
  - A/B mode: 2 harness variant cùng task, compare token usage + success rate
  - Done: 1 sample task (`"init new project"`) chạy xanh trên self-harness; regression flag dương khi sửa 1 skill.

- [ ] **B3. `harness-kit doctor` command** *(gap #7 — copy-own bắt buộc phải có)*
  - Scan `.claude/skills/**`, `.agents/skills/**`, `.claude/rules/**`, `.claude/agents/**`, hooks
  - Compare hash với registry bundle version → per-artifact status `up-to-date | drift | unknown | missing`
  - Flags: `--fix` (re-copy overwrite), `--diff` (show unified diff)
  - Done: unit test `detectDrift()`; CLI smoke — sửa 1 line trong copied skill, doctor report drift; `--diff` show line đó.

- [ ] **B4. Failure-recovery rule + skill** *(gap #10)*
  - Rule `.claude/rules/failure-recovery.md` — "khi test/build fail 3× liên tiếp cùng lỗi → stop, escalate user, không tiếp tục patch"
  - Skill companion có detection logic (đọc `.claude/logs/` hoặc conversation heuristic)
  - Gom vào `workflow/failure-recovery` bundle
  - Done: rule file có trong self-harness; dogfood prompt giả lập fail × 3 → agent dừng đúng.

- [ ] **B5. Security posture hardening** *(gap #16)*
  - Mở rộng `workflow/security-review` hiện có: thêm permission matrix cho Bash tool (allowlist/denylist sample), MCP trust model doc, secret-scan hook (trùng B1 — reuse)
  - Rule ngắn `.claude/rules/mcp-trust.md` — "MCP server mới = untrusted cho đến khi review"
  - Done: self-harness có permission matrix trong `.claude/settings.json`; doctor không báo drift.

## 5. Block C — P1 orchestration & observability

- [ ] **C1. `workflow/subagents` bundle family** *(gap #4)*
  - Curated subagents: `code-reviewer`, `test-runner`, `migration-safety-check`, `explorer`, `security-reviewer` (nếu khác bản hiện có)
  - Mỗi subagent là 1 file `.claude/agents/*.md` với frontmatter `name/description/tools`
  - Orchestration skill `parallel-agents` extend: khi nào fan-out, self-contained brief template, output contract, forbidden patterns (shared-file edit)
  - Done: install vào self-harness; smoke test fan-out 2 subagent trong 1 message.

- [ ] **C2. `workflow/telemetry-otel` bundle** *(gap #2)*
  - Claude Code OTEL config: token/turn, tool-call rate, cache-hit rate, stall detection (turn > N giây without tool call)
  - Exporter: local file (`evals/telemetry/`) + optional OTLP endpoint từ env
  - Dashboard template (Grafana JSON) optional
  - Done: self-harness chạy 1 session → file telemetry có ≥5 event với token count.

## 6. Block D — P2 stretch

- [ ] **D1. `workflow/sandbox-devcontainer` bundle** *(gap #5)*
  - `devcontainer.json` baseline (Node 22, pnpm, git)
  - Git worktree helper script — `harness-kit worktree <branch>` spawns isolated dir
  - Firejail profile sample cho Linux
  - Done: devcontainer build xanh; worktree command create + clean up đúng.

- [ ] **D2. `workflow/auto-memory` bundle** *(gap #8)*
  - Chiết xuất pattern từ `~/.claude/CLAUDE.md`: `user/feedback` local, `project/reference` committed
  - Router skill quyết định memory type + write path
  - Templates cho 4 memory file types
  - Done: install bundle vào dummy project → memory dir + router skill present; save 1 memory mỗi loại → đúng path.

- [ ] **D3. Model-routing rule bundle** *(gap #9)*
  - Rule + skill: khi dùng Opus (complex planning), Sonnet (default), Haiku (tool-heavy loops), fast mode, plan mode
  - Heuristic matrix trong skill
  - Done: rule file present; skill trigger trên test prompt.

- [ ] **D4. Tooling MCP bundles** *(gap #11)*
  - Candidates: `mcp-lsp` (language server), `mcp-db-schema` (postgres introspect), `mcp-log-tail`, `mcp-ci-status` (GitHub Actions), `mcp-package-safety` (npm audit wrap)
  - Pick top 2 theo giá trị cao nhất; còn lại backlog.
  - Done: 2 bundle install xanh, MCP server start, có 1 smoke call qua Claude Code.

- [ ] **D5. Preset-of-presets** *(gap #13)*
  - Meta-preset wizard option: `minimalist` / `full-power` / `research` / `enterprise`
  - Mỗi preset = list các bundle + default config
  - Done: wizard chạy `--preset minimalist` → harness.json đúng list; budget command show tổng.

- [ ] **D6. Post-init smoke test** *(gap #15)*
  - `harness-kit init` kết thúc bằng smoke: invoke 1 skill qua Claude Code CLI (hoặc dry-run parse)
  - Nếu fail → báo user rõ artifact nào vấn đề
  - Done: fresh init trong sandbox → smoke pass; sabotage 1 skill file → smoke báo đúng file.

---

## 7. Out of scope (để dành version sau)

- **Gap #12 cross-IDE abstraction** (Cursor/Cline/Codex) — version sau; sẽ tách RFC riêng tại `docs/design-docs/cross-ide-abstraction.md` khi cần
- Grafana dashboard chi tiết cho C2 — ship JSON skeleton, iteration sau
- MCP server tự viết — dùng server có sẵn trước

---

## 8. Exit criteria

Plan hoàn tất khi:
- [ ] Block A xong 3/3 (foundation ship được)
- [ ] Block B xong ≥3/5 (hooks + eval + doctor là minimum viable feedback-loop layer)
- [ ] Self-harness re-init với bundle mới không regression (registry test + `doctor` xanh)
- [ ] `.claude/memory/project/project-state.md` update: bundle count mới, commands list mới, manifest schema note
- [ ] Eval doc đã chuyển từ `docs/tmp/` sang `docs/evaluations/2026-04-14-harness-engineering.md` (link trong plan + project-state.md update theo)

Block nào không xong → roll sang plan kế tiếp (tạo file mới trong `docs/exec-plans/active/`, tham chiếu plan này là tiền thân).

---

## 9. Dogfood checklist sau mỗi block / task

1. `pnpm build` từ root — xanh
2. `pnpm test` — xanh
3. `node packages/harness-kit/dist/cli.js status` trong self-harness — no drift
4. `node packages/harness-kit/dist/cli.js budget` (sau A2) — tổng dưới 40%
5. Commit theo `git-conventional` (không `Co-Authored-By`)
