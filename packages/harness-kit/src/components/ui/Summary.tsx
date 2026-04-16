import React, { memo } from 'react'
import { Box, Text } from 'ink'

export type StepStatus = 'done' | 'active' | 'pending'

export interface SummaryItem {
  label: string
  status: StepStatus
  value?: string
}

export const Summary = memo(function Summary({ items }: { items: SummaryItem[] }) {
  return (
    <Box flexDirection="column">
      <Text bold>Steps</Text>
      <Box marginTop={1} flexDirection="column">
        {items.map((it) => (
          <Text
            key={it.label}
            {...(it.status === 'active' ? { color: 'cyan' } : {})}
            dimColor={it.status === 'pending'}
            wrap="wrap"
          >
            {it.status === 'done' ? '✓ ' : it.status === 'active' ? '▸ ' : '○ '}
            {it.label}
          </Text>
        ))}
      </Box>
    </Box>
  )
})
