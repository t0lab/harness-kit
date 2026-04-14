# Exec Plans — docs/exec-plans/

Diátaxis type: **How-to**. Exec plans are task-completion artifacts — they track active work and known debt. They don't explain why decisions were made (that's design-docs).

---

## Structure

```
docs/exec-plans/
├── active/
│   └── YYYY-MM-DD-<kebab-name>.md    ← plan currently in flight
├── completed/
│   └── YYYY-MM-DD-<kebab-name>.md    ← archived when done
└── tech-debt-tracker.md              ← single evergreen table, never archived
```

---

## Active exec plan

### When to create

Start a plan when a feature requires ≥ 3 distinct implementation steps. Single-step work (one function, one bug fix) doesn't need a plan — it just needs a commit.

### File naming

`YYYY-MM-DD-<kebab-case-description>.md` — today's date, a name that reflects the goal.

Good: `2026-04-20-remove-command.md`, `2026-05-01-web-preview.md`
Bad: `feature.md`, `plan.md`, `2026-04-20.md`

### Template

```markdown
# <Feature name>

**Trạng thái:** Đang thực hiện
**Ngày tạo:** YYYY-MM-DD

## Mục tiêu
One short paragraph: what this feature does and why it's needed now.

## Đã hoàn thành
- [x] Completed task

## Còn lại
- [ ] Pending task

## Ghi chú
Technical decisions made, trade-offs, warnings for whoever picks this up next.
```

### Lifecycle

1. Create in `active/` at feature start
2. Check off tasks as work completes
3. When all tasks done: move to `completed/`, change `Trạng thái: Hoàn thành`
4. Never delete — completed plans are historical record of what shipped

---

## Tech debt tracker

Add a row to the existing table in `tech-debt-tracker.md`. Do not create a separate file.

### Row format

```
| Short description | `path/to/file.ts` (line N) | Cao / Trung bình / Thấp | What's wrong, why it hasn't been fixed, what would trigger a fix |
```

### Severity

| Level | Meaning |
|-------|---------|
| **Cao** | Causes bugs or blocks future work — fix soon |
| **Trung bình** | Degrades maintainability, no immediate bug |
| **Thấp** | Style/cleanup, safe to defer months |

### Known failure mode

Debt entries with stale line numbers mislead agents more than no entry at all. Always verify line numbers with `Grep` before writing. When code changes, update or remove debt entries that reference moved lines.
