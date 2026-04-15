import React from 'react'
import { Box, Text } from 'ink'
import type { BudgetReport } from '@/commands/budget.js'

interface BudgetDisplayProps {
  report: BudgetReport
}

function ProgressBar({ current, max, width = 20 }: { current: number; max: number; width?: number }): React.ReactElement {
  const percent = (current / max) * 100
  const filled = Math.round((percent / 100) * width)
  const empty = width - filled
  const bar = '█'.repeat(filled) + '░'.repeat(empty)
  return <Text>{bar}</Text>
}

export function BudgetDisplay({ report }: BudgetDisplayProps): React.ReactElement {
  const pct = report.totals.percentOfWindow
  const isWarning = pct > 20
  const isError = report.totals.degraded

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box flexDirection="row" gap={1}>
        {/* Header Card */}
        <Box flexGrow={1} flexBasis={0} flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
          <Text bold>Context Budget Summary</Text>
          <Box flexDirection="column" gap={1}>
            <Box>
              <Box width={15}>
                <Text>Eager:</Text>
              </Box>
              <Text color="cyan" bold>
                {report.totals.eager.toLocaleString()}
              </Text>
              <Text> tokens</Text>
            </Box>
            <Box>
              <Box width={15}>
                <Text>On-demand:</Text>
              </Box>
              <Text color="gray">{report.totals.onDemand.toLocaleString()}</Text>
              <Text> tokens</Text>
            </Box>
            <Box>
              <Box width={15}>
                <Text>Total:</Text>
              </Box>
              <Text bold>{report.totals.total.toLocaleString()}</Text>
              <Text> tokens</Text>
            </Box>
          </Box>
        </Box>

        {/* Window Utilization */}
        <Box flexGrow={1} flexBasis={0} flexDirection="column" borderStyle="round" borderColor={isError ? 'red' : 'yellow'} paddingX={2} paddingY={1}>
          <Text bold>Context Window</Text>
          <Box flexDirection="column" gap={1}>
            <Box>
              <Box width={15}>
                <Text>Utilization:</Text>
              </Box>
              <Text color={isError ? 'red' : isWarning ? 'yellow' : 'green'} bold>
                {pct}%
              </Text>
              <Text> of {report.totals.contextWindow.toLocaleString()}</Text>
            </Box>
            <Box>
              <ProgressBar current={report.totals.eager} max={report.totals.contextWindow} width={20} />
            </Box>
            {isError && (
              <Box>
                <Text color="red">⚠ Exceeds {report.warnThresholdPercent}% threshold</Text>
              </Box>
            )}
            {report.totals.contextWindowSource === 'default' && (
              <Box>
                <Text color="yellow" dimColor>
                  ℹ Override with --context-window or harness.json
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Bundles Table */}
      {report.byBundle.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={2} paddingY={1}>
            <Text bold>Harness-kit Managed</Text>
            
            <Box marginTop={1} paddingBottom={1}>
              <Box flexGrow={1}>
                <Text dimColor>Bundle ({report.byBundle.length})</Text>
              </Box>
              <Box width={12} justifyContent="flex-end">
                <Text dimColor>Eager</Text>
              </Box>
              <Box width={14} justifyContent="flex-end">
                <Text dimColor>On-Demand</Text>
              </Box>
              <Box width={8} justifyContent="flex-end">
                <Text dimColor>Files</Text>
              </Box>
            </Box>
            
            <Box flexDirection="column" gap={0}>
              {report.byBundle.map((b) => (
                <Box key={b.name}>
                  <Box flexGrow={1}>
                    <Text>{b.name}</Text>
                  </Box>
                  <Box width={12} justifyContent="flex-end">
                    <Text color="cyan">{b.eagerTokens.toLocaleString()}</Text>
                  </Box>
                  <Box width={14} justifyContent="flex-end">
                    <Text color="gray">+{b.onDemandTokens.toLocaleString()}</Text>
                  </Box>
                  <Box width={8} justifyContent="flex-end">
                    <Text>{b.files.length}</Text>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {/* User Files Table */}
      {report.userAuthored.files.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={2} paddingY={1}>
            <Box flexDirection="row" justifyContent="space-between">
              <Text bold>User-authored Files</Text>
              <Box>
                <Text color="cyan">{report.userAuthored.eagerTokens.toLocaleString()} eager</Text>
                <Text dimColor> / </Text>
                <Text color="gray">{report.userAuthored.onDemandTokens.toLocaleString()} on-demand</Text>
              </Box>
            </Box>

            <Box marginTop={1} paddingBottom={1}>
              <Box flexGrow={1}>
                <Text dimColor>File ({report.userAuthored.files.length})</Text>
              </Box>
              <Box width={12} justifyContent="flex-end">
                <Text dimColor>Eager</Text>
              </Box>
            </Box>
            
            <Box flexDirection="column" gap={0}>
              {report.userAuthored.files
                .filter((f) => f.eagerTokens > 0)
                .slice(0, 8)
                .map((f) => (
                  <Box key={f.relPath}>
                    <Box flexGrow={1}>
                      <Text dimColor>{f.relPath}</Text>
                    </Box>
                    <Box width={12} justifyContent="flex-end">
                      <Text color="cyan">{f.eagerTokens.toLocaleString()}</Text>
                    </Box>
                  </Box>
                ))}
            </Box>
            {report.userAuthored.files.length > 8 && (
              <Box paddingTop={1}>
                <Text dimColor>… and {report.userAuthored.files.length - 8} more files</Text>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  )
}
