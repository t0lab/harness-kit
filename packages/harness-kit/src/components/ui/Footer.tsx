import React, { memo, useEffect, useState } from 'react'
import { Box, Text } from 'ink'
import type { BudgetState } from '@/store/budget-state.js'
import { useBudgetSnapshot, type BudgetSnapshot } from '@/hooks/use-budget-snapshot.js'
import { WARN_THRESHOLD_PERCENT } from '@/lib/budget-config.js'

function useDebounced<T>(value: T, ms = 50): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return v
}

function pctColor(pct: number): 'red' | 'yellow' | 'green' {
  if (pct > WARN_THRESHOLD_PERCENT) return 'red'
  if (pct > 20) return 'yellow'
  return 'green'
}

export const Footer = memo(function Footer({ budget }: { budget: BudgetState }) {
  const snapshot: BudgetSnapshot = useBudgetSnapshot(budget)
  const debounced = useDebounced(snapshot, 50)
  const windowLabel =
    debounced.source === 'default'
      ? `${debounced.contextWindow.toLocaleString()} (estimate)`
      : debounced.contextWindow.toLocaleString()
  return (
    <Box paddingX={1}>
      <Text bold> Budget </Text>
      <Text color="cyan">{debounced.eager.toLocaleString()} eager</Text>
      <Text dimColor> + {debounced.onDemand.toLocaleString()} on-demand </Text>
      <Text color={pctColor(debounced.pct)}>{debounced.pct}%</Text>
      <Text dimColor> of {windowLabel}</Text>
    </Box>
  )
})
