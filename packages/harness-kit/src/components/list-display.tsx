import React from 'react'
import { Box, Text } from 'ink'
import type { BundleManifest } from '@harness-kit/core'

export interface ListDisplayProps {
  groups: Map<string, BundleManifest[]>
  installedNames: Set<string>
}

export function ListDisplay({ groups, installedNames }: ListDisplayProps): React.ReactElement {
  const sortedCategories = [...groups.keys()].sort()

  return (
    <Box flexDirection="column" gap={1} paddingY={1}>
      {sortedCategories.map((category) => {
        const members = groups.get(category) ?? []
        return (
          <Box key={category} flexDirection="column" gap={0}>
            <Text bold color="cyan">
              {category} ({members.length})
            </Text>
            <Box flexDirection="column" gap={0} paddingLeft={2}>
              {[...members]
                .sort((a, c) => a.name.localeCompare(c.name))
                .map((b) => {
                  const isInstalled = installedNames.has(b.name)
                  return (
                    <Box key={b.name}>
                      <Box width={24}>
                        <Text color={isInstalled ? 'white' : 'gray'}>{b.name}</Text>
                      </Box>
                      <Box width={4} justifyContent="center">
                        <Text color={isInstalled ? 'green' : 'gray'}>
                          {isInstalled ? '✓' : ' '}
                        </Text>
                      </Box>
                      <Box flexGrow={1}>
                        <Text color={isInstalled ? 'white' : 'gray'}>
                          {b.description}
                          {b.experimental && <Text color="yellow"> [experimental]</Text>}
                        </Text>
                      </Box>
                    </Box>
                  )
                })}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}
