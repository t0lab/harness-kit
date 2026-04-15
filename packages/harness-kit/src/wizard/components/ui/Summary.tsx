import React, { memo } from 'react'
import { Box, Text, useStdout } from 'ink'

export type StepStatus = 'done' | 'active' | 'pending'

export interface SummaryItem {
  label: string
  status: StepStatus
  value?: string
}

// line-clamp-N: wrap text to `width`, keep first `maxLines`, ellipsize overflow.
function clampLines(text: string, width: number, maxLines: number): string {
  const one = text.replace(/\s+/g, ' ').trim()
  if (width <= 2 || one.length <= width) return one
  const words = one.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w
    if (next.length <= width) { cur = next; continue }
    if (cur) lines.push(cur)
    // word longer than width → hard-break
    let rest = w
    while (rest.length > width) { lines.push(rest.slice(0, width)); rest = rest.slice(width) }
    cur = rest
    if (lines.length >= maxLines) break
  }
  if (cur && lines.length < maxLines) lines.push(cur)
  if (lines.length > maxLines || cur !== lines[lines.length - 1] && lines.length === maxLines) {
    const kept = lines.slice(0, maxLines)
    const last = kept[maxLines - 1] ?? ''
    kept[maxLines - 1] = last.length >= width ? last.slice(0, width - 1) + '…' : last + '…'
    return kept.join('\n')
  }
  return lines.join('\n')
}

export const Summary = memo(function Summary({ items }: { items: SummaryItem[] }) {
  const { stdout } = useStdout()
  const cols = stdout.columns ?? 80
  // Summary pane width mirrors WizardShell logic, minus border+padding (~4).
  const paneWidth = Math.min(40, Math.max(24, Math.floor(cols * 0.3)))
  const valueWidth = Math.max(10, paneWidth - 6)

  return (
    <Box flexDirection="column">
      <Text bold>Steps</Text>
      <Box marginTop={1} flexDirection="column">
        {items.map((it) => (
          <Text
            key={it.label}
            {...(it.status === 'active' ? { color: 'cyan' } : {})}
            dimColor={it.status === 'pending'}
          >
            {it.status === 'done' ? '✓ ' : it.status === 'active' ? '▸ ' : '○ '}
            {it.label}
            {it.value ? <Text dimColor> — {clampLines(it.value, valueWidth, 2)}</Text> : null}
          </Text>
        ))}
      </Box>
    </Box>
  )
})
