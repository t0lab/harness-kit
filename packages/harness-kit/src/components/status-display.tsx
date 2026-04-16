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
  const isHealthy = driftCount === 0 && missingFiles === 0 && unsetVars === 0

  return (
    <Box flexDirection="column" gap={1} paddingY={1}>
      {/* Header panel */}
      <Box
        borderStyle="round"
        borderColor={isHealthy ? 'green' : 'red'}
        paddingX={1}
        gap={2}
      >
        <Text bold color={isHealthy ? 'green' : 'red'}>
          {isHealthy ? '✓' : '⚠'} Status
        </Text>
        <Text dimColor>{cwd}</Text>
      </Box>

      {/* Bundles panel */}
      <Box
        borderStyle="round"
        borderColor={driftCount > 0 ? 'red' : 'cyan'}
        flexDirection="column"
        paddingX={1}
        gap={1}
      >
        <Box gap={1}>
          <Text bold>Bundles</Text>
          <Text dimColor>({auditResult.bundles.length})</Text>
        </Box>

        <Box flexDirection="column" gap={0}>
          {auditResult.bundles.map((b) => (
            <Box key={b.name} gap={1}>
              <Box width={2}>
                <Text color={b.drift ? 'red' : 'green'}>{b.drift ? '✗' : '✓'}</Text>
              </Box>
              <Box width={24}>
                <Text color={b.drift ? 'red' : 'white'}>{b.name}</Text>
              </Box>
              <Box width={20}>
                <Text dimColor>{b.category}</Text>
              </Box>
              {b.hasMcp && (
                <Box width={6}>
                  <Text color="cyan">[mcp]</Text>
                </Box>
              )}
              {b.drift && <Text color="red">drift</Text>}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Files panel */}
      <Box
        borderStyle="round"
        borderColor={missingFiles > 0 ? 'red' : 'cyan'}
        flexDirection="column"
        paddingX={1}
        gap={1}
      >
        <Box gap={1}>
          <Text bold>Files</Text>
          <Text dimColor>({auditResult.files.length})</Text>
        </Box>

        <Box flexDirection="column" gap={0}>
          {auditResult.files.map((f) => (
            <Box key={f.path} gap={1}>
              <Box width={2}>
                <Text color={f.exists ? 'green' : 'red'}>{f.exists ? '✓' : '✗'}</Text>
              </Box>
              <Box width={28}>
                <Text color={f.exists ? 'white' : 'red'}>{f.path}</Text>
              </Box>
              {!f.exists && <Text color="red">missing</Text>}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Env vars panel */}
      {auditResult.envVars.length > 0 && (
        <Box
          borderStyle="round"
          borderColor={unsetVars > 0 ? 'yellow' : 'cyan'}
          flexDirection="column"
          paddingX={1}
          gap={1}
        >
          <Box gap={1}>
            <Text bold>Environment variables</Text>
            <Text dimColor>({auditResult.envVars.length})</Text>
          </Box>

          <Box flexDirection="column" gap={0}>
            {auditResult.envVars.map((e) => (
              <Box key={`${e.bundleName}-${e.key}`} gap={1}>
                <Box width={2}>
                  <Text color={e.set ? 'green' : 'red'}>{e.set ? '✓' : '✗'}</Text>
                </Box>
                <Box width={32}>
                  <Text color={e.set ? 'white' : 'red'}>{e.key}</Text>
                </Box>
                {!e.set && (
                  <>
                    <Text color="red">not set</Text>
                    <Text dimColor>({e.bundleName})</Text>
                  </>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Summary panel */}
      <Box borderStyle="round" borderColor={isHealthy ? 'green' : 'red'} paddingX={1}>
        {isHealthy ? (
          <Text bold color="green">✓ All healthy</Text>
        ) : (
          <Box gap={3}>
            {driftCount > 0 && <Text color="red">✗ {driftCount} drift</Text>}
            {missingFiles > 0 && <Text color="red">✗ {missingFiles} file{missingFiles !== 1 ? 's' : ''} missing</Text>}
            {unsetVars > 0 && <Text color="yellow">⚠ {unsetVars} env var{unsetVars !== 1 ? 's' : ''} unset</Text>}
          </Box>
        )}
      </Box>
    </Box>
  )
}
