import React from 'react'
import { Box, Text } from 'ink'
import type { AddResult } from '@/commands/add.js'

export interface AddDisplayProps {
  result: AddResult
}

export function AddDisplay({ result }: AddDisplayProps): React.ReactElement {
  return (
    <Box flexDirection="column" gap={1} paddingY={1}>
      {/* Success panel */}
      <Box borderStyle="round" borderColor="green" flexDirection="column" paddingX={1} gap={1}>
        <Box gap={1}>
          <Text color="green">✓</Text>
          <Text bold>Added {result.bundleName}</Text>
          <Text color="cyan">({result.role})</Text>
        </Box>

        {result.mcpUpdated && (
          <Box gap={1}>
            <Text dimColor>↳</Text>
            <Text dimColor>.mcp.json updated</Text>
          </Box>
        )}
      </Box>

      {/* Env vars panel */}
      {result.envVars.length > 0 && (
        <Box borderStyle="round" borderColor="yellow" flexDirection="column" paddingX={1} gap={1}>
          <Text bold>Environment variables</Text>

          <Box flexDirection="column" gap={0}>
            {result.envVars.map((e) => (
              <Box key={e.key} gap={1}>
                <Box width={28}>
                  <Text>{e.key}</Text>
                </Box>
                <Box width={6}>
                  {e.required
                    ? <Text color="red">[req]</Text>
                    : <Text color="gray">[opt]</Text>
                  }
                </Box>
                <Box flexGrow={1}>
                  <Text color={e.required ? 'white' : 'gray'}>{e.description}</Text>
                </Box>
              </Box>
            ))}
          </Box>

          <Text dimColor>Set before running Claude Code</Text>
        </Box>
      )}

      {/* Warnings panel */}
      {result.warnings.length > 0 && (
        <Box borderStyle="round" borderColor="yellow" flexDirection="column" paddingX={1} gap={1}>
          <Text bold color="yellow">⚠ Warnings</Text>

          <Box flexDirection="column" gap={0}>
            {result.warnings.map((w, i) => (
              <Box key={i} gap={1}>
                <Text color="yellow">•</Text>
                <Text>{w}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}
