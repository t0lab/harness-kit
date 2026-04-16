import React, { useMemo, useState } from 'react'
import { WizardShell } from '@/components/ui/WizardShell.js'
import { SelectList } from '@/components/ui/SelectList.js'
import { runInk } from '@/lib/run-ink.js'
import { DEFAULT_IDE_SELECTION, SKILLS_IDE_OPTIONS } from '@/lib/skills-agents.js'
import type { BudgetState } from '@/store/budget-state.js'
import type { WizardContext } from '@/wizard/types.js'
import type { SummaryItem } from '@/components/ui/Summary.js'

interface Props {
  ctx: WizardContext
  budget: BudgetState
  onDone: (data: Partial<WizardContext>) => void
  onCancel: () => void
}

function SelectIdeScreen({ ctx, budget, onDone, onCancel }: Props) {
  const initialSelection = ctx.ide.length > 0 ? ctx.ide : DEFAULT_IDE_SELECTION
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelection))
  const selectedValue = useMemo(() => [...selected], [selected])

  const handleToggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const summaryItems: SummaryItem[] = [
    { label: 'Project info', status: 'done' },
    { label: 'Tech stack', status: 'done' },
    { label: 'Detect tooling', status: 'done' },
    { label: 'Harness config', status: 'done' },
    { label: 'Select IDE', status: 'active', value: `${selected.size} selected` },
    { label: 'Preview', status: 'pending' },
  ]

  return (
    <WizardShell
      stepCurrent={5}
      stepTotal={6}
      stepTitle="Select IDE"
      summaryItems={summaryItems}
      budget={budget}
    >
      <SelectList
        items={SKILLS_IDE_OPTIONS}
        selected={selected}
        onToggle={handleToggle}
        multi={true}
        title="Install skills to which IDE agents?"
        onDone={() => onDone({ ide: selectedValue })}
        onCancel={onCancel}
      />
    </WizardShell>
  )
}

export async function stepSelectIde(
  ctx: WizardContext,
  budget: BudgetState,
): Promise<Partial<WizardContext>> {
  return runInk<Partial<WizardContext>>((resolve: (v: Partial<WizardContext>) => void, reject: (e: Error) => void) =>
    <SelectIdeScreen
      ctx={ctx}
      budget={budget}
      onDone={resolve}
      onCancel={() => reject(new Error('Cancelled'))}
    />
  )
}
