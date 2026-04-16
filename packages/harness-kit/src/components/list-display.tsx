import React, { useState } from 'react'
import { Box, Text, useInput, useApp } from 'ink'
import type { BundleManifest } from '@harness-kit/core'

export interface ListDisplayProps {
  groups: Map<string, BundleManifest[]>
  installedNames: Set<string>
}

export function ListDisplay({ groups, installedNames }: ListDisplayProps): React.ReactElement {
  const { exit } = useApp()
  const sortedCategories = [...groups.keys()].sort()
  const [selectedIdx, setSelectedIdx] = useState(0)

  useInput((input, key) => {
    if (input === 'q' || key.escape) exit()
    if (key.upArrow || input === 'k') setSelectedIdx((prev) => Math.max(0, prev - 1))
    if (key.downArrow || input === 'j') setSelectedIdx((prev) => Math.min(sortedCategories.length - 1, prev + 1))
  })

  const selectedCategory = sortedCategories[selectedIdx] ?? ''
  const selectedMembers = (groups.get(selectedCategory) ?? []).slice().sort((a, b) => a.name.localeCompare(b.name))
  const totalBundles = [...groups.values()].reduce((sum, arr) => sum + arr.length, 0)
  const installedCount = [...groups.values()].flat().filter((b) => installedNames.has(b.name)).length
  const categoryInstalledCount = selectedMembers.filter((b) => installedNames.has(b.name)).length

  return (
    <Box flexDirection="column" gap={1} paddingY={1}>
      {/* Two-panel layout */}
      <Box gap={1} alignItems="flex-start">
        {/* Left: Category list */}
        <Box
          borderStyle="round"
          borderColor="cyan"
          flexDirection="column"
          paddingX={1}
          gap={1}
          width={24}
        >
          <Text bold color="cyan">Categories</Text>

          <Box flexDirection="column" gap={0}>
            {sortedCategories.map((cat, i) => {
              const isSelected = i === selectedIdx
              const members = groups.get(cat) ?? []
              const catInstalled = members.filter((b) => installedNames.has(b.name)).length
              return (
                <Box key={cat} gap={1}>
                  <Text color={isSelected ? 'cyan' : 'gray'}>{isSelected ? '▶' : ' '}</Text>
                  <Box flexGrow={1}>
                    <Text color={isSelected ? 'white' : 'gray'} bold={isSelected}>
                      {cat}
                    </Text>
                  </Box>
                  <Text dimColor>{catInstalled}/{members.length}</Text>
                </Box>
              )
            })}
          </Box>
        </Box>

        {/* Right: Bundle detail */}
        <Box
          borderStyle="round"
          borderColor={categoryInstalledCount > 0 ? 'cyan' : 'gray'}
          flexDirection="column"
          paddingX={1}
          gap={1}
          flexGrow={1}
        >
          <Box gap={1}>
            <Text bold>{selectedCategory}</Text>
            <Text dimColor>{categoryInstalledCount}/{selectedMembers.length} installed</Text>
          </Box>

          <Box flexDirection="column" gap={0}>
            {selectedMembers.map((b) => {
              const isInstalled = installedNames.has(b.name)
              return (
                <Box key={b.name} gap={1}>
                  <Box width={2}>
                    <Text color={isInstalled ? 'green' : 'gray'}>{isInstalled ? '✓' : '·'}</Text>
                  </Box>
                  <Box width={26}>
                    <Text color={isInstalled ? 'white' : 'gray'}>{b.name}</Text>
                  </Box>
                  <Box flexGrow={1}>
                    <Text color={isInstalled ? 'white' : 'gray'}>{b.description}</Text>
                    {b.experimental && <Text color="yellow"> [exp]</Text>}
                  </Box>
                </Box>
              )
            })}
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box borderStyle="round" borderColor="gray" paddingX={1} gap={3}>
        <Text color="green">✓ {installedCount} installed</Text>
        <Text dimColor>· {totalBundles - installedCount} available</Text>
        <Text dimColor>{totalBundles} total</Text>
        <Text dimColor>  [↑↓ / jk] navigate   [q] quit</Text>
      </Box>
    </Box>
  )
}
