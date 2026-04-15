import { useSyncExternalStore, useRef } from 'react'
import type { BudgetState } from '@/store/budget-state.js'

export interface BudgetSnapshot {
  eager: number
  onDemand: number
  contextWindow: number
  source: string
  pct: number
}

export function useBudgetSnapshot(budget: BudgetState): BudgetSnapshot {
  const cache = useRef<{ key: string; value: BudgetSnapshot } | null>(null)
  return useSyncExternalStore(
    budget.subscribe,
    () => {
      const t = budget.computeTotals()
      const key = `${t.eager}|${t.onDemand}|${t.contextWindow}|${t.source}|${t.pct}`
      if (cache.current && cache.current.key === key) return cache.current.value
      cache.current = { key, value: t }
      return t
    },
  )
}
