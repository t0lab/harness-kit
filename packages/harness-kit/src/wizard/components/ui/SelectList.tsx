import React, { useEffect, useMemo, useState } from 'react'
import { Box, Text, useInput, useStdout } from 'ink'

// ── Types ───────────────────────────────────────────────────────────────
export interface SelectListItem {
  id: string
  label: string
  hint: string
  category?: string
  recommended?: boolean
}

export interface SelectListProps {
  items: SelectListItem[]
  selected: Set<string>
  onToggle: (id: string) => void
  multi: boolean
  title: string
  onDone: () => void
  onCancel: () => void
  statusMsg?: string | null
  onCtrlD?: () => void
}

// ── Flat row model ──────────────────────────────────────────────────────
type FlatRow =
  | { kind: 'label'; category: string; key: string }
  | { kind: 'item'; item: SelectListItem; itemIdx: number; key: string }

function matches(item: SelectListItem, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  if (item.label.toLowerCase().includes(q)) return true
  if (item.hint.toLowerCase().includes(q)) return true
  return false
}

// ── Component ───────────────────────────────────────────────────────────
export function SelectList({
  items, selected, onToggle, multi, title, onDone, onCancel,
  statusMsg, onCtrlD,
}: SelectListProps) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const [scrollRow, setScrollRow] = useState(0)
  const { stdout } = useStdout()
  const rows = stdout.rows ?? 24

  // ── Layout budget ─────────────────────────────────────────────────────
  //  WizardShell height = stdout.rows - 1
  //  Shell chrome: header(1) + border-top(1) + border-bottom(1) + footer(1) + shell -1 = 5
  //  Fixed content: title(1) + hints(1) + margin+search(2) + margin(1) = 5
  //  totalBudget = rows - 10  (constant — split between arrows + content)
  const totalBudget = Math.max(4, rows - 10)

  // ── Filtered items ────────────────────────────────────────────────────
  const filtered = useMemo(
    () => items.filter((o) => matches(o, query)),
    [items, query],
  )

  // ── Flat rows: labels + items in one array ────────────────────────────
  const flatRows = useMemo(() => {
    const out: FlatRow[] = []
    let prevCat = ''
    filtered.forEach((item, idx) => {
      const cat = item.category ?? ''
      if (cat && cat !== prevCat) {
        out.push({ kind: 'label', category: cat, key: `cat-${cat}` })
      }
      prevCat = cat
      out.push({ kind: 'item', item, itemIdx: idx, key: `item-${item.id}` })
    })
    return out
  }, [filtered])

  // ── Cursor → row index mapping ────────────────────────────────────────
  const cursorRowIdx = useMemo(() => {
    const idx = flatRows.findIndex((r) => r.kind === 'item' && r.itemIdx === cursor)
    return idx >= 0 ? idx : 0
  }, [flatRows, cursor])

  // ── Clamp cursor when filter shrinks ──────────────────────────────────
  useEffect(() => {
    setCursor((c) => Math.min(c, Math.max(0, filtered.length - 1)))
  }, [filtered.length])

  // ── Scroll cursor into view ───────────────────────────────────────────
  useEffect(() => {
    const labelAbove = cursorRowIdx > 0 && flatRows[cursorRowIdx - 1]?.kind === 'label'
    const topTarget = labelAbove ? cursorRowIdx - 1 : cursorRowIdx
    const estContent = totalBudget - 2
    if (topTarget < scrollRow) {
      setScrollRow(topTarget)
    } else if (cursorRowIdx >= scrollRow + estContent) {
      setScrollRow(cursorRowIdx - estContent + 1)
    }
  }, [cursorRowIdx, scrollRow, totalBudget, flatRows])

  // ── Input handling (modeless) ─────────────────────────────────────────
  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === 'c')) { onCancel(); return }
    if (key.ctrl && (input === 'd' || input === '\x04') && onCtrlD) { onCtrlD(); return }
    if (key.upArrow) { setCursor((c) => Math.max(0, c - 1)); return }
    if (key.downArrow) { setCursor((c) => Math.min(filtered.length - 1, c + 1)); return }
    if (key.return) { onDone(); return }
    if (input === ' ') {
      const current = filtered[cursor]
      if (current) onToggle(current.id)
      return
    }
    if (key.backspace || key.delete) { setQuery((q) => q.slice(0, -1)); return }
    if (key.tab) { setQuery(''); return }
    // Printable ASCII only → ignores IME-composed chars
    if (!key.ctrl && !key.meta && input && input.length === 1 && /^[\x20-\x7e]$/.test(input)) {
      setQuery((q) => q + input)
      return
    }
  })

  // ── Visible slice (dynamic indicator allocation) ──────────────────────
  const hasAbove = scrollRow > 0
  const topSlot = hasAbove ? 1 : 0
  const tentativeSlots = totalBudget - topSlot - 1
  const tentativeEnd = scrollRow + tentativeSlots
  const hasBelow = tentativeEnd < flatRows.length
  const contentSlots = hasBelow ? tentativeSlots : totalBudget - topSlot
  const visibleRows = flatRows.slice(scrollRow, scrollRow + contentSlots)
  const aboveCount = scrollRow
  const belowCount = Math.max(0, flatRows.length - scrollRow - contentSlots)

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <Box flexDirection="column">
      <Text bold>{title}</Text>
      <Text dimColor wrap="truncate">
        {'[↑↓] nav  [space] toggle  [type] search  [^D] detect  [enter] confirm'}
      </Text>
      <Box marginTop={1} justifyContent="space-between">
        <Box>
          <Text color="cyan">Search: </Text>
          <Text>{query}<Text color="cyan">█</Text></Text>
        </Box>
        {statusMsg ? <Text color="green">{statusMsg}</Text> : null}
      </Box>
      <Box marginTop={1} flexDirection="column">
        {hasAbove ? <Box><Text dimColor>  ↑ {aboveCount} more</Text></Box> : null}

        {filtered.length === 0
          ? <Box><Text dimColor>  No matches</Text></Box>
          : visibleRows.map((row) => {
              if (row.kind === 'label') {
                return (
                  <Box key={row.key}>
                    <Text dimColor>  ── {row.category}</Text>
                  </Box>
                )
              }
              const isCursor = row.itemIdx === cursor
              const isSel = selected.has(row.item.id)
              const marker = multi
                ? isSel ? '●' : '○'
                : isSel ? '◉' : '○'
              return (
                <Box key={row.key}>
                  <Text wrap="truncate" {...(isCursor ? { color: 'cyan' } : {})}>
                    {isCursor ? '❯ ' : '  '}
                    {isSel ? <Text color="green">{marker}</Text> : <Text dimColor>{marker}</Text>}
                    {'  '}
                    {row.item.label.padEnd(20)}
                    {row.item.recommended ? <Text color="green">★ </Text> : null}
                    <Text dimColor>{row.item.hint}</Text>
                  </Text>
                </Box>
              )
            })}

        {hasBelow ? <Box><Text dimColor>  ↓ {belowCount} more</Text></Box> : null}
      </Box>
    </Box>
  )
}
