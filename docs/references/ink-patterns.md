# Ink Patterns — harness-kit wizard

Tài liệu kỹ thuật cho việc dùng [Ink 6](https://github.com/vadimdemedes/ink) trong wizard. Đi kèm ADR `docs/design-docs/tui-architecture.md`.

---

## Invariants

1. **Một render model duy nhất**: chỉ Ink reconciler ghi ra stdout khi wizard active. Cấm `process.stdout.write(…)` ANSI trực tiếp, cấm `@clack/prompts` inline prompts.
2. **Budget logic framework-agnostic**: `BudgetState` là plain class, không import React. Component Ink đọc qua hook wrapper.
3. **Debounce realtime updates**: footer / preview pane recompute ≥ 50ms. Không tính token mỗi keystroke.
4. **Scrollview tự implement**: Ink không có native scroll container.

---

## Split-pane template

```tsx
import { Box, Text, useStdout } from 'ink'

export function WizardShell({ step, summary, children, footer }: Props) {
  const { stdout } = useStdout()
  const cols = stdout.columns ?? 80
  const rows = stdout.rows ?? 24
  const showSummary = cols >= 80

  return (
    <Box flexDirection="column" width={cols} height={rows}>
      <Box paddingX={1}>
        <Text dimColor>harness-kit init · step {step.current}/{step.total}</Text>
      </Box>

      <Box flexGrow={1}>
        {showSummary && (
          <Box
            width={Math.min(40, Math.max(24, Math.floor(cols * 0.3)))}
            borderStyle="single"
            borderColor="gray"
            flexDirection="column"
            paddingX={1}
          >
            {summary}
          </Box>
        )}
        <Box flexGrow={1} borderStyle="single" borderColor="cyan" paddingX={1}>
          {children}
        </Box>
      </Box>

      <Box paddingX={1}>{footer}</Box>
    </Box>
  )
}
```

- Width `cols` tường minh để Yoga không tự suy ra sai khi terminal narrow.
- Single-pane fallback khi `cols < 80` — summary ẩn, right pane chiếm full.
- Border `"single"` + màu phân biệt active vs passive panel.

---

## Debounced realtime footer

Vấn đề: budget footer re-render trên mỗi keystroke → full-tree diff → flicker trên terminal chậm.

```tsx
import { useEffect, useState, memo } from 'react'
import { Text } from 'ink'

function useDebounced<T>(value: T, ms = 50): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return v
}

export const BudgetFooter = memo(function BudgetFooter({
  budget,
}: { budget: BudgetState }) {
  const snapshot = useBudgetSnapshot(budget)  // subscribe, returns {eager, onDemand, pct}
  const debounced = useDebounced(snapshot, 50)
  return (
    <Text>
      Budget {debounced.eager} eager + {debounced.onDemand} on-demand{' '}
      <Text color={colorFor(debounced.pct)}>{debounced.pct}%</Text> of{' '}
      {debounced.contextWindow}
    </Text>
  )
})
```

- `memo` kết hợp primitive props → React skip re-render khi snapshot chưa đổi.
- 50ms đủ imperceptible cho user, đủ để batch nhiều keystroke liên tiếp.
- Với text input (~10 keystroke/sec) → ≤ 1 re-render / debounce window.

---

## BudgetState → React bridge

Giữ `BudgetState` plain. Expose `subscribe(listener)` để component React hook vào.

```ts
// budget-state.ts (framework-agnostic)
export class BudgetState {
  private listeners = new Set<() => void>()
  subscribe(fn: () => void) { this.listeners.add(fn); return () => this.listeners.delete(fn) }
  private notify() { this.listeners.forEach(fn => fn()) }
  // ...mutations gọi this.notify() sau khi update
}
```

```tsx
// hooks/use-budget-snapshot.ts
import { useSyncExternalStore } from 'react'

export function useBudgetSnapshot(budget: BudgetState) {
  return useSyncExternalStore(
    budget.subscribe.bind(budget),
    () => budget.computeTotals(),  // must be stable between notify calls
  )
}
```

- `useSyncExternalStore` là React API chính thống cho external store.
- `computeTotals()` phải memoize nội bộ hoặc return reference ổn định nếu không đổi, nếu không sẽ re-render thừa.

---

## Scrollable list (windowing)

Ink không có scroll container. Tự slice:

```tsx
function ScrollList<T>({ items, height, cursor, renderItem }: Props<T>) {
  const [scroll, setScroll] = useState(0)

  useEffect(() => {
    if (cursor < scroll) setScroll(cursor)
    else if (cursor >= scroll + height) setScroll(cursor - height + 1)
  }, [cursor, height, scroll])

  const visible = items.slice(scroll, scroll + height)
  const remaining = items.length - scroll - height

  return (
    <Box flexDirection="column">
      {scroll > 0 && <Text dimColor>↑ {scroll} more</Text>}
      {visible.map((it, i) => renderItem(it, scroll + i === cursor))}
      {remaining > 0 && <Text dimColor>↓ {remaining} more</Text>}
    </Box>
  )
}
```

- `height` truyền từ parent (= `rows - header - footer - borders`).
- Clamp `scroll` vào `useEffect` để tránh setState trong render.

---

## Focus chain

```tsx
import { useFocus, useFocusManager } from 'ink'

function SearchableMultiSelect() {
  const { isFocused } = useFocus({ autoFocus: true })
  // render input + list; chỉ nhận key khi isFocused
}
```

- V1: focus luôn ở right panel, không cần `useFocusManager.focusNext()`.
- V2 (nếu summary panel interactive): dùng `focusNext()` bound vào Tab key.

---

## Resize handling

Ink tự lắng `process.stdout.on('resize')` và relayout qua Yoga. **Không cần tự handle SIGWINCH**. Chỉ cần đọc `stdout.columns / stdout.rows` qua `useStdout` trong render — Ink sẽ re-render khi resize.

Ngoại lệ: nếu layout cần tính toán discrete breakpoint (ví dụ ẩn summary khi `cols < 80`), đọc `useStdout` trong component top-level là đủ.

---

## Alt-screen lifecycle

Ink `render(<App />, { exitOnCtrlC: true })` không tự enter alt-screen. Để dùng alt-screen:

```tsx
import { render } from 'ink'

process.stdout.write('\x1b[?1049h')
const app = render(<WizardShell …/>, { exitOnCtrlC: false })
const cleanup = () => process.stdout.write('\x1b[?1049l')
process.once('exit', cleanup)
try {
  await app.waitUntilExit()
} finally {
  cleanup()
  process.removeListener('exit', cleanup)
}
```

- `exitOnCtrlC: false` để tự handle cancel (cleanup alt-screen trước khi exit).
- Cancel flow: component gọi `app.unmount()` + exit non-zero.

---

## Autocomplete + search

Options theo thứ tự ưu tiên:

1. **Compose `ink-text-input` + filtered `ink-select-input`** (~80 LoC). Kiểm soát được filter logic, highlight, multi-select state. Khuyên dùng cho tech-stack-select.
2. **`ink-search-select`** — sẵn có, nhưng multi-select / custom hint rendering hạn chế.

Skeleton cho option 1:

```tsx
function AutocompleteMultiSelect({ options, selected, onToggle }: Props) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const filtered = useMemo(
    () => options.filter(o => matches(o, query)),
    [options, query],
  )
  useInput((input, key) => {
    if (key.upArrow) setCursor(c => Math.max(0, c - 1))
    else if (key.downArrow) setCursor(c => Math.min(filtered.length - 1, c + 1))
    else if (input === ' ') onToggle(filtered[cursor].value)
    else if (key.return) /* confirm */
  })
  return (
    <Box flexDirection="column">
      <Box><Text>Search: </Text><TextInput value={query} onChange={setQuery} /></Box>
      <ScrollList items={filtered} cursor={cursor} height={10} renderItem={…} />
    </Box>
  )
}
```

---

## Cấm kỵ

| Hành vi | Lý do |
|---|---|
| `process.stdout.write('\x1b[…]')` trong step code | Xung đột Ink reconciler → artifact render |
| `@clack/prompts` inline (`p.multiselect`, `p.text`…) trong wizard | Ghi log lines bình thường vào alt-screen → leak |
| `console.log` trong component | Tương tự — dùng Ink `<Text>` hoặc Ink's logger |
| Re-render footer mỗi keystroke không debounce | Flicker + CPU burn |
| State mutation trong render (`setState` không `useEffect`) | React infinite loop warning |
| Import React vào `BudgetState` | Vi phạm framework-agnostic invariant |

---

## Known Ink gotchas

- **Flicker trên terminal chậm** (VS Code integrated, tmux nested) khi full-tree re-render lớn. Mitigation: `memo`, `<Static>` cho log append-only, debounce.
- **`<Static>` chỉ thêm không bớt** — dùng cho build log / install progress, không cho dynamic list.
- **Yoga width percent** yêu cầu parent có width xác định. Root component luôn set `width={stdout.columns}`.
- **Windows Terminal** + alt-screen: một số phiên bản không support `\x1b[?1049h`. Test trên Windows trước khi ship.
- **`useInput` không fire** nếu stdin không TTY (CI / piped). Guard bằng `process.stdin.isTTY`.

---

## References

- [Ink docs](https://github.com/vadimdemedes/ink#readme)
- [ink-ui official kit](https://github.com/vadimdemedes/ink-ui)
- [Ink TUI Expandable Layouts with Fixed Footer](https://combray.prose.sh/2025-11-28-ink-tui-expandable-layout)
- [TUI Development: Ink + React](https://combray.prose.sh/2025-12-01-tui-development)
- [React useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)
