import React from 'react'
import { Box, Text } from 'ink'
import type { BudgetReport } from './budget.js'

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
      {/* Header Card */}
      <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
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
      <Box marginTop={1} flexDirection="column" borderStyle="round" borderColor={isError ? 'red' : 'yellow'} paddingX={2} paddingY={1}>
        <Box>
          <Box width={15}>
            <Text>Window:</Text>
          </Box>
          <Text color={isError ? 'red' : isWarning ? 'yellow' : 'green'} bold>
            {pct}%
          </Text>
          <Text> of {report.totals.contextWindow.toLocaleString()} tokens</Text>
        </Box>
        <Box>
          <ProgressBar current={report.totals.eager} max={report.totals.contextWindow} width={40} />
        </Box>
        {isError && (
          <Box>
            <Text color="red">⚠ Exceeds {report.warnThresholdPercent}% threshold</Text>
          </Box>
        )}
        {report.totals.contextWindowSource === 'default' && (
          <Box>
            <Text color="yellow" dimColor>
              ℹ Window is estimated; override via --context-window, env, or harness.json
            </Text>
          </Box>
        )}
      </Box>

      {/* Bundles Table */}
      {report.byBundle.length > 0 && (
        <Box flexDirection="column">
          <Text bold>Harness-kit Managed ({report.byBundle.length} bundles)</Text>
          <Box flexDirection="column" gap={0} paddingX={1}>
            <Box>
              <Box width={28}>
                <Text>Bundle</Text>
              </Box>
              <Box width={9}>
                <Text>Eager</Text>
              </Box>
              <Box width={12}>
                <Text>On-demand</Text>
              </Box>
              <Text>Files</Text>
            </Box>
            <Text dimColor>{`${'─'.repeat(50)}`}</Text>
            {report.byBundle.map((b) => (
              <Box key={b.name}>
                <Box width={28}>
                  <Text>{b.name}</Text>
                </Box>
                <Box width={9}>
                  <Text color="cyan">{String(b.eagerTokens).padStart(6)}</Text>
                </Box>
                <Box width={12}>
                  <Text color="gray">+{String(b.onDemandTokens).padStart(8)}</Text>
                </Box>
                <Text>{b.files.length}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* User Files */}
      {report.userAuthored.files.length > 0 && (
        <Box flexDirection="column">
          <Text bold>User-authored ({report.userAuthored.files.length} files)</Text>
          <Box>
            <Text color="cyan">{report.userAuthored.eagerTokens}</Text>
            <Text> eager + </Text>
            <Text color="gray">{report.userAuthored.onDemandTokens}</Text>
            <Text> on-demand</Text>
          </Box>
          <Box flexDirection="column" gap={0}>
            {report.userAuthored.files
              .filter((f) => f.eagerTokens > 0)
              .slice(0, 8)
              .map((f) => (
                <Box key={f.relPath}>
                  <Box width={50}>
                    <Text dimColor>{f.relPath}</Text>
                  </Box>
                  <Text>{f.eagerTokens}</Text>
                </Box>
              ))}
          </Box>
          {report.userAuthored.files.length > 8 && (
            <Box>
              <Text dimColor>… and {report.userAuthored.files.length - 8} more</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}
