import React, { useState } from 'react'
import { Box, Text, useInput, useApp } from 'ink'

export interface ConfirmPromptProps {
  message: string
  hint?: string | undefined
  border?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Embeddable confirm UI — handles its own input. Safe to use inside wizard WizardShell. */
export function ConfirmPrompt({ message, hint, border = true, onConfirm, onCancel }: ConfirmPromptProps): React.ReactElement {
  const [yes, setYes] = useState(false)

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === 'c')) { onCancel(); return }
    if (key.leftArrow || input === 'y') { setYes(true); return }
    if (key.rightArrow || input === 'n') { setYes(false); return }
    if (key.return) {
      if (yes) onConfirm()
      else onCancel()
    }
  })

  const boxProps = border
    ? { borderStyle: 'round' as const, borderColor: 'yellow', paddingX: 2, paddingY: 1 }
    : { paddingX: 0, paddingY: 0 }

  return (
    <Box {...boxProps} flexDirection="column" gap={1}>
      <Box gap={1}>
        <Text color="yellow">⚠</Text>
        <Text bold>{message}</Text>
      </Box>

      {hint && (
        <Box paddingLeft={2}>
          <Text dimColor>{hint}</Text>
        </Box>
      )}

      <Box gap={3} paddingLeft={2}>
        <Text color={yes ? 'green' : 'gray'} bold={yes}>
          {yes ? '▶ Yes' : '  Yes'}
        </Text>
        <Text color={!yes ? 'red' : 'gray'} bold={!yes}>
          {!yes ? '▶ No' : '  No'}
        </Text>
      </Box>

      <Box paddingLeft={2}>
        <Text dimColor>[←/→ · y/n] select   [Enter] confirm   [Esc] cancel</Text>
      </Box>
    </Box>
  )
}

/** Standalone confirm — wraps ConfirmPrompt with useApp exit for top-level render. */
export function ConfirmPromptApp({ message, hint, onConfirm, onCancel }: ConfirmPromptProps): React.ReactElement {
  const { exit } = useApp()

  return (
    <Box paddingY={1}>
      <ConfirmPrompt
        message={message}
        hint={hint}
        onConfirm={() => { exit(); onConfirm() }}
        onCancel={() => { exit(); onCancel() }}
      />
    </Box>
  )
}
