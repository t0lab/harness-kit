import React, { useEffect, useState } from 'react'
import { WizardShell } from '@/wizard/components/ui/WizardShell.js'
import { SelectList } from '@/wizard/components/ui/SelectList.js'
import { runInk } from '@/wizard/lib/run-ink.js'
import { detectTechStack } from '@/wizard/lib/detect-tech.js'
import type { BudgetState } from '@/wizard/store/budget-state.js'
import type { TechOption } from '@/wizard/types.js'
import type { SummaryItem } from '@/wizard/components/ui/Summary.js'
import type { SelectListItem } from '@/wizard/components/ui/SelectList.js'

interface Props {
  options: TechOption[]
  budget: BudgetState
  onDone: (values: string[]) => void
  onCancel: () => void
}

function TechStackScreen({ options, budget, onDone, onCancel }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(budget.selectedTech))
  const [detectMsg, setDetectMsg] = useState<string | null>(null)

  useEffect(() => {
    budget.setSelectedTech([...selected])
  }, [selected])

  const items: SelectListItem[] = options.map((o) => ({
    id: o.id,
    label: o.label,
    hint: o.hint,
    category: o.category,
  }))

  const handleToggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDetect = () => {
    const detected = detectTechStack(process.cwd())
    let added = 0
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of detected) {
        if (!next.has(id)) { next.add(id); added++ }
      }
      return next
    })
    setDetectMsg(added > 0 ? `✓ ${added} detected` : 'nothing detected')
    setTimeout(() => setDetectMsg(null), 2000)
  }

  const summaryItems: SummaryItem[] = [
    { label: 'Project info', status: 'done' },
    { label: 'Tech stack', status: 'active', value: `${selected.size} selected` },
    { label: 'Detect tooling', status: 'pending' },
    { label: 'Harness config', status: 'pending' },
    { label: 'Preview', status: 'pending' },
  ]

  return (
    <WizardShell
      stepCurrent={2}
      stepTotal={5}
      stepTitle="Tech stack"
      summaryItems={summaryItems}
      budget={budget}
    >
      <SelectList
        items={items}
        selected={selected}
        onToggle={handleToggle}
        multi={true}
        title="Select your tech stack"
        onDone={() => onDone([...selected])}
        onCancel={onCancel}
        statusMsg={detectMsg}
        onCtrlD={handleDetect}
      />
    </WizardShell>
  )
}

export async function selectTechStack(
  options: TechOption[],
  budget: BudgetState,
): Promise<string[]> {
  const result = await runInk<string[]>((resolve: (v: string[]) => void, reject: (e: Error) => void) =>
    <TechStackScreen
      options={options}
      budget={budget}
      onDone={resolve}
      onCancel={() => reject(new Error('Cancelled'))}
    />
  )
  budget.setSelectedTech(result)
  return result
}
