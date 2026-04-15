import React, { useEffect, useState } from 'react'
import { Box, Text, useInput } from 'ink'
import Spinner from 'ink-spinner'
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
    { label: 'Preview', status: 'pending' },
  ]

  return (
    <WizardShell
      stepCurrent={2}
      stepTotal={5}
      stepTitle="Detect tooling"
      summaryItems={summaryItems}
      budget={budget}
    >
      <Box flexDirection="column">
        <Text>Tech: <Text color="cyan">{ctx.selectedTech.join(', ')}</Text></Text>
        <Box marginTop={1} flexDirection="column">
          {phase === 'scanning' ? (
            <Text><Text color="cyan"><Spinner type="dots" /></Text> Scanning project…</Text>
          ) : (
            <>
              {issues.map((i) => (
                <Text key={i.label} color={i.found ? 'green' : 'yellow'}>
                  {i.found ? '✓' : '⚠'} {i.label}{i.found ? '' : ' not configured'}
                </Text>
              ))}
            </>
          )}
        </Box>

        {phase === 'pick-installs' ? (
          <Box marginTop={1} flexDirection="column">
            <Text bold>Install missing tools?</Text>
            <Text dimColor>Space to toggle · Enter to continue</Text>
            <Box marginTop={1} flexDirection="column">
              {installable.map((i, idx) => {
                const isCursor = idx === cursor
                const isSel = selected.has(i.label)
                return (
                  <Box key={i.label} flexDirection="column">
                    <Text {...(isCursor ? { color: 'cyan' } : {})}>
                      {isCursor ? '❯ ' : '  '}
                      {isSel ? '●' : '○'} {i.label}
                    </Text>
                    {isCursor && i.installCmd ? (
                      <Text dimColor>    {i.installCmd}</Text>
                    ) : null}
                  </Box>
                )
              })}
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
