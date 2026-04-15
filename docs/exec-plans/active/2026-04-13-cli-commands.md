# CLI Commands — Kế hoạch thực thi

**Trạng thái:** Hoàn thành (core commands + full test suite 2026-04-15)
**Mục tiêu:** Hoàn thiện và stabilize các commands `list`, `add`, `status`
**Ngày tạo:** 2026-04-13  
**Cập nhật gần nhất:** 2026-04-15 — phần core done; nice-to-have roll sang plan tới

---

## Đã hoàn thành

- [x] `list` command — `src/commands/list.ts`
  - Filter theo `--category` (validate với `BundleCategory`)
  - Filter `--installed` (đọc `harness.json`)
  - Group theo `defaultRole`, sort theo alphabet
  - Hiển thị marker `✓` cho bundle đã cài
  - Unit tests trong `tests/commands/list.test.ts` (`groupBundlesByDefaultRole`, `filterByInstalled`)

- [x] `add` command — `src/commands/add.ts`
  - Core logic tách ra `executeAdd()` (testable, không phụ thuộc Commander)
  - Validate: `NOT_INITIALIZED`, `UNKNOWN_BUNDLE`, `INVALID_ROLE`
  - Gọi `installBundle()` từ artifact installer
  - Cập nhật `harness.json` (không duplicate)
  - Hiển thị env vars cần thiết sau khi cài
  - Xác nhận re-install nếu bundle đã tồn tại (dùng `@clack/prompts`)
  - Unit tests trong `tests/commands/add.test.ts` (7 test cases)

- [x] `status` command — `src/commands/status.ts`
  - Core logic tách ra `auditHarness()` (testable)
  - Kiểm tra drift: MCP bundle trong `harness.json` nhưng thiếu trong `.mcp.json`
  - Kiểm tra core files: `CLAUDE.md`, `AGENTS.md`, `harness.json`, `.mcp.json`, `.claude/settings.json`
  - Kiểm tra env vars: báo cáo biến chưa được set
  - `process.exit(1)` khi có vấn đề (phù hợp cho CI)
  - Unit tests trong `tests/commands/status.test.ts` (8 test cases)

---

## Còn lại

- [ ] `registerListCommand` chưa có integration test — chỉ unit test các helper function; action callback chưa được test
- [ ] `status` chưa có `--json` output flag — cần thiết cho scripting/CI consumption
- [ ] `add` command: `runAdd()` dùng `process.exit(1)` trong catch — không thể unit test path lỗi qua CLI handler, chỉ test được qua `executeAdd()` trực tiếp
- [ ] `list --installed` đọc `harness.json` hai lần khi `opts.installed` là true và harness tồn tại (dòng 51–59 trong `list.ts`)
- [ ] Không có `remove` / `uninstall` command — người dùng phải sửa `harness.json` thủ công
- [ ] `status` chỉ kiểm tra `bundle.defaultRole` khi thu thập env vars (`status.ts` dòng 91) — nếu user cài bundle với `--role` khác, env vars của role đó không được audit

---

## Ghi chú

- Tất cả commands đã được đăng ký trong `src/index.ts`
- Tests dùng `tmpdir` để tạo project fixtures tạm thời — không mock filesystem
- `executeAdd` và `auditHarness` là exported pure functions (ngoại trừ I/O) — pattern này cần duy trì cho các command mới
