import React from 'react'
import { Box, Text } from 'ink'
import type { ActivationStep } from '@/commands/activate.js'

export interface ActivateDisplayProps {
  cwd: string
  steps: ActivationStep[]
}

export function ActivateDisplay({ cwd, steps }: ActivateDisplayProps): React.ReactElement {
  return (
    <Box flexDirection="column" gap={1} paddingY={1}>
      <Text bold>
        harness-kit activate — <Text dimColor>{cwd}</Text>
      </Text>
      
      <Box flexDirection="column" gap={0} paddingLeft={2}>
        {steps.map((step, i) => {
          const icon = step.status === 'ok' ? '✓' : step.status === 'skipped' ? '–' : '✗'
          const iconColor = step.status === 'ok' ? 'green' : step.status === 'skipped' ? 'gray' : 'red'
          return (
            <Box key={i}>
              <Box width={3}>
                <Text color={iconColor}>{icon}</Text>
              </Box>
              <Box width={14}>
                <Text>{step.name}</Text>
              </Box>
              <Box flexGrow={1}>
                <Text color={step.status === 'skipped' ? 'gray' : 'white'}>{step.detail}</Text>
              </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
