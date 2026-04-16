import React, { type ReactNode, useEffect, useState } from 'react'
import { Box, Text, useStdout } from 'ink'
import { Summary, type SummaryItem } from '@/components/ui/Summary.js'
import { Footer } from '@/components/ui/Footer.js'
import type { BudgetState } from '@/store/budget-state.js'

export interface WizardShellProps {
  stepCurrent: number
  stepTotal: number
  stepTitle: string
  summaryItems: SummaryItem[]
  budget: BudgetState
  children: ReactNode
  showSummary?: boolean
}

export function WizardShell({ stepCurrent, stepTotal, stepTitle, summaryItems, budget, children, showSummary = true }: WizardShellProps) {
  const { stdout } = useStdout()
  // Force re-render on terminal resize
  const [, setTick] = useState(0)
  useEffect(() => {
    const onResize = () => setTick((t) => t + 1)
    stdout.on('resize', onResize)
    return () => { stdout.off('resize', onResize) }
  }, [stdout])

  const cols = stdout.columns ?? 80
  const rows = stdout.rows ? stdout.rows - 1 : 24
  const shouldShowSummary = showSummary && cols >= 80
  const summaryWidth = Math.min(40, Math.max(24, Math.floor(cols * 0.3)))

  if (rows < 15 || cols < 60) {
    return (
      <Box width={cols} height={rows} alignItems="center" justifyContent="center" flexDirection="column">
        <Box
          borderStyle="round"
          borderColor="yellow"
          paddingX={3}
          paddingY={1}
          flexDirection="column"
          alignItems="center"
        >
          <Text color="yellow" bold>⚠ Terminal too small</Text>
          <Text> </Text>
          <Text>Please resize to at least <Text bold color="white">60 × 16</Text></Text>
          <Text dimColor>Current: {cols} × {rows + 1}</Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" width={cols} height={rows}>
      <Box paddingX={1}>
        <Text dimColor>harness-kit init · </Text>
        <Text bold>
          step {stepCurrent}/{stepTotal}
        </Text>
        <Text dimColor> — {stepTitle}</Text>
      </Box>

      <Box flexGrow={1}>
        {shouldShowSummary ? (
          <Box
            width={summaryWidth}
            borderStyle="single"
            borderColor="gray"
            flexDirection="column"
            paddingX={1}
          >
            <Summary items={summaryItems} />
          </Box>
        ) : null}
        <Box flexGrow={1} borderStyle="single" borderColor="cyan" flexDirection="column" paddingX={1}>
          {children}
        </Box>
      </Box>

      <Footer budget={budget} />
    </Box>
  )
}
