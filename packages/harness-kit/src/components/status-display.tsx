import React from 'react'
import { Box, Text } from 'ink'
import type { AuditResult } from '@/commands/status.js'

export interface StatusDisplayProps {
  cwd: string
  auditResult: AuditResult
}

export function StatusDisplay({ cwd, auditResult }: StatusDisplayProps): React.ReactElement {
  const driftCount = auditResult.bundles.filter((b) => b.drift).length
  const missingFiles = auditResult.files.filter((f) => !f.exists).length
  const unsetVars = auditResult.envVars.filter((e) => !e.set).length

  return (
    <Box flexDirection="column" gap={1} paddingY={1}>
      <Text bold>
        harness-kit — <Text dimColor>{cwd}</Text>
      </Text>

      {/* Installed bundles */}
      <Box flexDirection="column">
        <Text bold>── Installed bundles ({auditResult.bundles.length}) ──────────────────────────</Text>
        <Box flexDirection="column" gap={0}>
          {auditResult.bundles.map((b) => {
            const icon = b.drift ? '✗' : '✓'
            const iconColor = b.drift ? 'red' : 'green'
            return (
              <Box key={b.name} paddingLeft={2}>
                <Box width={3}>
                  <Text color={iconColor}>{icon}</Text>
                </Box>
                <Box width={22}>
                  <Text>{b.name}</Text>
                </Box>
                <Box width={22}>
                  <Text>{b.category}</Text>
                </Box>
                <Box width={8}>
                  <Text>{b.hasMcp ? 'mcp' : ''}</Text>
                </Box>
                {b.drift && (
                  <Box flexGrow={1}>
                    <Text color="red">— missing from .mcp.json [drift]</Text>
                  </Box>
                )}
              </Box>
            )
          })}
        </Box>
      </Box>

      {/* Config files */}
      <Box flexDirection="column">
        <Text bold>── Config files ───────────────────────────────────</Text>
        <Box flexDirection="column" gap={0}>
          {auditResult.files.map((f) => {
            const icon = f.exists ? '✓' : '✗'
            const iconColor = f.exists ? 'green' : 'red'
            return (
              <Box key={f.path} paddingLeft={2}>
                <Box width={3}>
                  <Text color={iconColor}>{icon}</Text>
                </Box>
                <Box width={24}>
                  <Text>{f.path}</Text>
                </Box>
                {!f.exists && (
                  <Box flexGrow={1}>
                    <Text color="red">— missing</Text>
                  </Box>
                )}
              </Box>
            )
          })}
        </Box>
      </Box>

      {/* Env Vars */}
      {auditResult.envVars.length > 0 && (
        <Box flexDirection="column">
          <Text bold>── Env vars ───────────────────────────────────────</Text>
          <Box flexDirection="column" gap={0}>
            {auditResult.envVars.map((e) => {
              const icon = e.set ? '✓' : '✗'
              const iconColor = e.set ? 'green' : 'red'
              return (
                <Box key={`${e.bundleName}-${e.key}`} paddingLeft={2}>
                  <Box width={3}>
                    <Text color={iconColor}>{icon}</Text>
                  </Box>
                  <Box width={30}>
                    <Text>{e.key}</Text>
                  </Box>
                  {!e.set && (
                    <Box flexGrow={1}>
                      <Text color="red">— not set</Text>
                      <Text dimColor> ({e.bundleName})</Text>
                    </Box>
                  )}
                </Box>
              )
            })}
          </Box>
        </Box>
      )}

      {/* Summary */}
      <Box flexDirection="column" marginTop={1}>
        <Text bold>── Summary ────────────────────────────────────────</Text>
        <Box paddingLeft={2}>
          {driftCount === 0 && missingFiles === 0 && unsetVars === 0 ? (
            <Box width={100}><Text color="green">✓ All good</Text></Box>
          ) : (
            <Box gap={2}>
              {driftCount > 0 && <Text color="red">{driftCount} drift</Text>}
              {unsetVars > 0 && <Text color="yellow">{unsetVars} env var{unsetVars > 1 ? 's' : ''} unset</Text>}
              {missingFiles > 0 && <Text color="red">{missingFiles} file{missingFiles > 1 ? 's' : ''} missing</Text>}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
