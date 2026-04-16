import React, { useEffect, useState } from 'react'
import { Box, Text, useInput, useStdout } from 'ink'
import { Spinner } from '@inkjs/ui'
import { WizardShell } from '@/components/ui/WizardShell.js'
import { runInk } from '@/lib/run-ink.js'
import { detectTooling } from '@/lib/detector.js'
import type { WizardContext, DetectedIssue } from '@/wizard/types.js'
import type { BudgetState } from '@/store/budget-state.js'
import type { SummaryItem } from '@/components/ui/Summary.js'

interface Props {
  ctx: WizardContext
  budget: BudgetState
  onDone: (data: Partial<WizardContext>) => void
  onCancel: () => void
}

type Phase = 'scanning' | 'pick-installs' | 'done'

function DetectToolingScreen({ ctx, budget, onDone, onCancel }: Props) {
  const [phase, setPhase] = useState<Phase>('scanning')
  const [issues, setIssues] = useState<DetectedIssue[]>([])
  const [cursor, setCursor] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [scrollRow, setScrollRow] = useState(0)
  const { stdout } = useStdout()

  useEffect(() => {
    let cancelled = false
    detectTooling(process.cwd(), ctx.selectedTech).then((result) => {
      if (cancelled) return
      setIssues(result)
      const installable = result.filter((i) => !i.found && i.installCmd)
      if (installable.length === 0) {
        onDone({ detectedIssues: result, toolsToInstall: [] })
      } else {
        setPhase('pick-installs')
      }
    })
    return () => { cancelled = true }
  }, [])

  const installable = issues.filter((i) => !i.found && i.installCmd)

  // Budget: shell chrome(4) + tech line(1) + margin(1) + issues(n) + margin(1) + header(1) + hint(1) + margin(1)
  const rows = stdout.rows ?? 24
  const fixedOverhead = 10 + issues.length
  const listBudget = Math.max(2, rows - fixedOverhead)

  // Each item is 1 row; cursor item expands to 2 rows (shows installCmd)
  // Build a rows-per-item map and compute visible slice
  const itemHeights = installable.map((_, idx) => (idx === cursor && installable[idx]?.installCmd ? 2 : 1))
  const totalRows = itemHeights.reduce((s, h) => s + h, 0)

  // Scroll cursor into view
  useEffect(() => {
    const cursorTop = itemHeights.slice(0, cursor).reduce((s, h) => s + h, 0)
    const cursorBottom = cursorTop + (itemHeights[cursor] ?? 1)
    if (cursorTop < scrollRow) {
      setScrollRow(cursorTop)
    } else if (cursorBottom > scrollRow + listBudget) {
      setScrollRow(cursorBottom - listBudget)
    }
  }, [cursor, listBudget])

  // Build visible items from scrollRow within listBudget rows
  let rowPos = 0
  const visibleItems: Array<{ item: DetectedIssue; idx: number }> = []
  for (let i = 0; i < installable.length; i++) {
    const h = itemHeights[i] ?? 1
    if (rowPos + h > scrollRow && rowPos < scrollRow + listBudget) {
      visibleItems.push({ item: installable[i]!, idx: i })
    }
    rowPos += h
    if (rowPos >= scrollRow + listBudget) break
  }

  const aboveRows = scrollRow
  const belowRows = Math.max(0, totalRows - scrollRow - listBudget)

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === 'c')) { onCancel(); return }
    if (phase !== 'pick-installs') return
    if (key.upArrow) { setCursor((c) => Math.max(0, c - 1)); return }
    if (key.downArrow) { setCursor((c) => Math.min(installable.length - 1, c + 1)); return }
    if (input === ' ') {
      const current = installable[cursor]
      if (!current) return
      setSelected((prev) => {
        const next = new Set(prev)
        if (next.has(current.label)) next.delete(current.label)
        else next.add(current.label)
        return next
      })
      return
    }
    if (key.return) {
      const toolsToInstall = installable.filter((i) => selected.has(i.label))
      onDone({ detectedIssues: issues, toolsToInstall })
    }
  })

  const techValue = ctx.selectedTech.join(', ')
  const summaryItems: SummaryItem[] = [
    { label: 'Project info', status: 'done' },
    { label: 'Tech stack', status: 'done', ...(techValue ? { value: techValue } : {}) },
    { label: 'Detect tooling', status: 'active' },
    { label: 'Harness config', status: 'pending' },
    { label: 'Select IDE', status: 'pending' },
    { label: 'Preview', status: 'pending' },
  ]

  return (
    <WizardShell
      stepCurrent={3}
      stepTotal={6}
      stepTitle="Detect tooling"
      summaryItems={summaryItems}
      budget={budget}
    >
      <Box flexDirection="column">
        <Text>Tech: <Text color="cyan">{ctx.selectedTech.join(', ')}</Text></Text>
        <Box marginTop={1} flexDirection="column">
          {phase === 'scanning' ? (
            <Spinner label="Scanning project…" />
          ) : (() => {
            const found = issues.filter((i) => i.found)
            const missing = issues.filter((i) => !i.found)
            return (
              <>
                {found.length > 0 && (
                  <Text><Text color="green">✓</Text> <Text dimColor>{found.map((i) => i.label).join(' · ')}</Text></Text>
                )}
                {missing.length > 0 && (
                  <Text><Text color="yellow">⚠</Text> missing: <Text color="yellow">{missing.map((i) => i.label).join(' · ')}</Text></Text>
                )}
              </>
            )
          })()}
        </Box>

        {phase === 'pick-installs' ? (
          <Box marginTop={1} flexDirection="column">
            <Text dimColor>Install? [space] toggle · [enter] continue</Text>
            <Box marginTop={1} flexDirection="column">
              {aboveRows > 0 ? <Text dimColor>  ↑ {aboveRows} more</Text> : null}
              {visibleItems.map(({ item, idx }) => {
                const isCursor = idx === cursor
                const isSel = selected.has(item.label)
                return (
                  <Box key={item.label} flexDirection="column">
                    <Text {...(isCursor ? { color: 'cyan' } : {})}>
                      {isCursor ? '❯ ' : '  '}
                      {isSel ? '●' : '○'} {item.label}
                    </Text>
                    {isCursor && item.installCmd ? (
                      <Text dimColor>    {item.installCmd}</Text>
                    ) : null}
                  </Box>
                )
              })}
              {belowRows > 0 ? <Text dimColor>  ↓ {belowRows} more</Text> : null}
            </Box>
          </Box>
        ) : null}
      </Box>
    </WizardShell>
  )
}

export async function stepDetectTooling(
  ctx: WizardContext,
  budget: BudgetState,
): Promise<Partial<WizardContext>> {
  return runInk<Partial<WizardContext>>((resolve: (v: Partial<WizardContext>) => void, reject: (e: Error) => void) =>
    <DetectToolingScreen
      ctx={ctx}
      budget={budget}
      onDone={resolve}
      onCancel={() => reject(new Error('Cancelled'))}
    />
  )
}
