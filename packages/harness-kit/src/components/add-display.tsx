import React from 'react'
import { Box, Text } from 'ink'
import type { AddResult } from '@/commands/add.js'

export interface AddDisplayProps {
  result: AddResult
}

export function AddDisplay({ result }: AddDisplayProps): React.ReactElement {
  return (
    <Box flexDirection="column" paddingY={1}>
      <Box>
        <Text color="green">✓ </Text>
        <Text>Added {result.bundleName}</Text>
        <Text dimColor> ({result.role})</Text>
      </Box>

      {result.mcpUpdated && (
        <Box paddingLeft={2}>
          <Text dimColor>↳ .mcp.json updated</Text>
        </Box>
      )}

      {result.envVars.length > 0 && (
        <Box flexDirection="column" marginTop={1} paddingLeft={2}>
          <Text dimColor>Env vars needed:</Text>
          <Box flexDirection="column" gap={0} paddingY={1} paddingLeft={2}>
            {result.envVars.map((e) => (
              <Box key={e.key}>
                <Box width={24}>
                  <Text>{e.key}</Text>
                </Box>
                <Box width={3} justifyContent="center">
                  <Text dimColor>—</Text>
                </Box>
                <Box flexGrow={1}>
                  <Text>{e.description}</Text>
                </Box>
                <Box width={12} justifyContent="flex-end">
                  <Text color={e.required ? 'red' : 'gray'}>
                    {e.required ? '[required]' : '[optional]'}
                  </Text>
                </Box>
              </Box>
            ))}
          </Box>
          <Text dimColor>Set in your shell or .env before running Claude.</Text>
        </Box>
      )}

      {result.warnings.length > 0 && (
        <Box flexDirection="column" marginTop={1} paddingLeft={2}>
          {result.warnings.map((w, i) => (
            <Box key={i}>
              <Text color="yellow">⚠ </Text>
              <Text>{w}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
