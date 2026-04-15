import React, { useMemo, useState } from 'react'
import { WizardShell } from '@/components/ui/WizardShell.js'
import { SelectList } from '@/components/ui/SelectList.js'
import { runInk } from '@/lib/run-ink.js'
import { getBundlesByCategory } from '@/registry/index.js'
import type { BudgetState } from '@/store/budget-state.js'
import type { WizardContext } from '@/wizard/types.js'
import type { SummaryItem } from '@/components/ui/Summary.js'
import type { SelectListItem } from '@/components/ui/SelectList.js'

type Category = Parameters<typeof getBundlesByCategory>[0]

interface Question {
  key: 'gitWorkflow' | 'memory' | 'workflowPresets' | 'browserTools' | 'webSearch' | 'webScrape'
  category: Category
  title: string
  multi: boolean
}

const QUESTIONS: Question[] = [
  { key: 'gitWorkflow', category: 'git-workflow', title: 'Git workflow', multi: true },
  { key: 'memory', category: 'memory', title: 'Long-term memory', multi: false },
  { key: 'workflowPresets', category: 'workflow-preset', title: 'Workflow presets', multi: true },
  { key: 'browserTools', category: 'browser', title: 'Browser automation', multi: true },
  { key: 'webSearch', category: 'search', title: 'Web search', multi: true },
  { key: 'webScrape', category: 'scrape', title: 'Web scrape', multi: true },
]

function bundleItems(category: Category): SelectListItem[] {
  return getBundlesByCategory(category)
    .sort((a, b) => {
      const aRec = a.roles[category]?.recommended ? 1 : 0
      const bRec = b.roles[category]?.recommended ? 1 : 0
      if (bRec !== aRec) return bRec - aRec
      return a.name.localeCompare(b.name)
    })
    .map((b) => ({
      id: b.name,
      label: b.name,
      hint: b.description,
      recommended: b.roles[category]?.recommended === true,
    }))
}

interface AnswerState {
  gitWorkflow: string[]
  memory: string
  workflowPresets: string[]
  browserTools: string[]
  webSearch: string[]
  webScrape: string[]
}

function initialAnswers(ctx: WizardContext): AnswerState {
  return {
    gitWorkflow: ctx.gitWorkflow,
    memory: ctx.memory,
    workflowPresets: ctx.workflowPresets,
    browserTools: ctx.browserTools,
    webSearch: ctx.webSearch,
    webScrape: ctx.webScrape,
  }
}

interface Props {
  ctx: WizardContext
  budget: BudgetState
  onDone: (data: AnswerState) => void
  onCancel: () => void
}

function HarnessConfigScreen({ ctx, budget, onDone, onCancel }: Props) {
  const [qIdx, setQIdx] = useState(0)
  const [answers, setAnswers] = useState<AnswerState>(initialAnswers(ctx))

  const question = QUESTIONS[qIdx]!
  const items = useMemo(() => bundleItems(question.category), [question.category])

  // Current selected set for this question
  const selectedSet = useMemo(() => {
    if (question.multi) {
      return new Set(answers[question.key] as string[])
    }
    const val = answers[question.key] as string
    return val ? new Set([val]) : new Set<string>()
  }, [answers, question.key, question.multi])

  const syncBudget = (next: AnswerState) => {
    const all = new Set<string>()
    for (const v of next.gitWorkflow) all.add(v)
    if (next.memory) all.add(next.memory)
    for (const v of next.workflowPresets) all.add(v)
    for (const v of next.browserTools) all.add(v)
    for (const v of next.webSearch) all.add(v)
    for (const v of next.webScrape) all.add(v)
    budget.setSelectedBundles([...all])
  }

  const handleToggle = (id: string) => {
    let updated: AnswerState
    if (question.multi) {
      const prev = answers[question.key] as string[]
      const next = prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
      updated = { ...answers, [question.key]: next }
    } else {
      // Single-select: toggle on/off, or switch
      const current = answers[question.key] as string
      updated = { ...answers, [question.key]: current === id ? '' : id }
    }
    setAnswers(updated)
    syncBudget(updated)
  }

  const handleDone = () => {
    if (qIdx + 1 < QUESTIONS.length) {
      setQIdx(qIdx + 1)
    } else {
      onDone(answers)
    }
  }

  const summaryItems: SummaryItem[] = QUESTIONS.map((q, i) => {
    const v = answers[q.key]
    const preview = Array.isArray(v) ? v.join(', ') : v
    return {
      label: q.title,
      status: i < qIdx ? 'done' : i === qIdx ? 'active' : 'pending',
      ...(i < qIdx && preview ? { value: preview } : {}),
    } as SummaryItem
  })

  return (
    <WizardShell
      stepCurrent={3}
      stepTotal={5}
      stepTitle={question.title}
      summaryItems={summaryItems}
      budget={budget}
    >
      <SelectList
        key={question.key}
        items={items}
        selected={selectedSet}
        onToggle={handleToggle}
        multi={question.multi}
        title={question.title}
        onDone={handleDone}
        onCancel={onCancel}
      />
    </WizardShell>
  )
}

export async function stepHarnessConfig(
  ctx: WizardContext,
  budget: BudgetState,
): Promise<Partial<WizardContext>> {
  budget.setSelectedTech(ctx.selectedTech)
  return runInk<Partial<WizardContext>>((resolve: (v: Partial<WizardContext>) => void, reject: (e: Error) => void) =>
    <HarnessConfigScreen
      ctx={ctx}
      budget={budget}
      onDone={resolve}
      onCancel={() => reject(new Error('Cancelled'))}
    />
  )
}
