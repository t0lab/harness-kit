import React from 'react'
import { Box, Text } from 'ink'
import type { ActivationStep } from '@/commands/activate.js'

export interface ActivateDisplayProps {
  cwd: string
  steps: ActivationStep[]
}

export function ActivateDisplay({ cwd, steps }: ActivateDisplayProps): React.ReactElement {
  const okCount = steps.filter((s) => s.status === 'ok').length
  const skippedCount = steps.filter((s) => s.status === 'skipped').length
  const failedCount = steps.filter((s) => s.status === 'failed').length
  const allOk = failedCount === 0

  return (
    <Box flexDirection="column" gap={1} paddingY={1}>
      {/* Steps panel */}
      <Box
        borderStyle="round"
        borderColor="cyan"
        flexDirection="column"
        paddingX={1}
        gap={1}
      >
        {/* Panel title */}
        <Box gap={1}>
          <Text bold color="cyan">Activation</Text>
          <Text dimColor>{cwd}</Text>
        </Box>

        {/* Steps */}
        <Box flexDirection="column" gap={0}>
          {steps.map((step, i) => {
            const icon = step.status === 'ok' ? '✓' : step.status === 'skipped' ? '–' : '✗'
            const iconColor = step.status === 'ok' ? 'green' : step.status === 'skipped' ? 'gray' : 'red'
            const detailColor = step.status === 'failed' ? 'red' : step.status === 'skipped' ? 'gray' : 'white'

            return (
              <Box key={i} gap={1}>
                <Box width={2}>
                  <Text color={iconColor}>{icon}</Text>
                </Box>
                <Box width={18}>
                  <Text>{step.name}</Text>
                </Box>
                <Box flexGrow={1}>
                  <Text color={detailColor}>{step.detail}</Text>
                </Box>
              </Box>
            )
          })}
        </Box>
      </Box>

      {/* Summary panel */}
      <Box borderStyle="round" borderColor={allOk ? 'green' : 'red'} paddingX={1}>
        <Box gap={3}>
          {okCount > 0 && <Text color="green">✓ {okCount} succeeded</Text>}
          {skippedCount > 0 && <Text color="gray">– {skippedCount} skipped</Text>}
          {failedCount > 0 && <Text color="red">✗ {failedCount} failed</Text>}
        </Box>
      </Box>
    </Box>
  )
}
