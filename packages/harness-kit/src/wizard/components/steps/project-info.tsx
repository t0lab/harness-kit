import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'
import { WizardShell } from '@/wizard/components/ui/WizardShell.js'
import { runInk } from '@/wizard/lib/run-ink.js'
import type { BudgetState } from '@/wizard/store/budget-state.js'
import type { WizardContext } from '@/wizard/types.js'
import type { SummaryItem } from '@/wizard/components/ui/Summary.js'

interface Field {
  key: 'projectName' | 'projectPurpose' | 'projectUsers' | 'projectConstraints'
  label: string
  placeholder: string
  required: boolean
}

const FIELDS: Field[] = [
  { key: 'projectName', label: 'Project name', placeholder: 'my-app', required: true },
  { key: 'projectPurpose', label: 'What does this project do?', placeholder: 'E-commerce for independent brands', required: true },
  { key: 'projectUsers', label: 'Who are the users / stakeholders? (optional)', placeholder: 'Brand owners and their customers', required: false },
  { key: 'projectConstraints', label: 'Key technical goals or constraints? (optional)', placeholder: 'Mobile-first. PCI-DSS checkout.', required: false },
]

interface Props {
  budget: BudgetState
  onDone: (data: Partial<WizardContext>) => void
  onCancel: () => void
}

function ProjectInfoScreen({ budget, onDone, onCancel }: Props) {
  const [idx, setIdx] = useState(0)
  const [values, setValues] = useState<Record<string, string>>({
    projectName: budget.projectText.projectName,
    projectPurpose: budget.projectText.projectPurpose,
    projectUsers: budget.projectText.projectUsers,
    projectConstraints: budget.projectText.projectConstraints,
  })
  const [error, setError] = useState<string | null>(null)

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === 'c')) onCancel()
  })

  const field = FIELDS[idx]!
  const value = values[field.key] ?? ''

  const handleChange = (raw: string) => {
    // Collapse pasted newlines/tabs so the prompt stays on one line
    const v = raw.replace(/[\r\n\t]+/g, ' ')
    setValues((prev) => ({ ...prev, [field.key]: v }))
    budget.setProjectText({ [field.key]: v } as Partial<typeof budget.projectText>)
    if (error) setError(null)
  }

  const handleSubmit = () => {
    if (field.required && value.trim().length === 0) {
      setError('Required')
      return
    }
    if (idx + 1 < FIELDS.length) {
      setIdx(idx + 1)
      setError(null)
      return
    }
    onDone({
      projectName: values.projectName ?? '',
      projectPurpose: values.projectPurpose ?? '',
      projectUsers: values.projectUsers ?? '',
      projectConstraints: values.projectConstraints ?? '',
    })
  }

  const summaryItems: SummaryItem[] = FIELDS.map((f, i) => ({
    label: f.label.replace(/\s*\(optional\)$/, '').replace(/\?$/, ''),
    status: i < idx ? 'done' : i === idx ? 'active' : 'pending',
    ...(i < idx && values[f.key] ? { value: values[f.key] } : {})
  }))

  return (
    <WizardShell
      stepCurrent={1}
      stepTotal={5}
      stepTitle="Project info"
      summaryItems={summaryItems}
      budget={budget}
    >
      <Box flexDirection="column">
        <Text bold>{field.label}</Text>
        <Box marginTop={1}>
          <Text color="cyan">❯ </Text>
          <TextInput
            value={value}
            placeholder={field.placeholder}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
        </Box>
        {error ? (
          <Box marginTop={1}>
            <Text color="red">{error}</Text>
          </Box>
        ) : null}
        <Box marginTop={1}>
          <Text dimColor>Enter to continue · Esc to cancel</Text>
        </Box>
      </Box>
    </WizardShell>
  )
}

export async function stepProjectInfo(budget: BudgetState): Promise<Partial<WizardContext>> {
  return runInk<Partial<WizardContext>>((resolve: (v: Partial<WizardContext>) => void, reject: (e: Error) => void) =>
    <ProjectInfoScreen
      budget={budget}
      onDone={resolve}
      onCancel={() => reject(new Error('Cancelled'))}
    />
  )
}
