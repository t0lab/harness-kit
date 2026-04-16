import type { SelectListItem } from '@/components/ui/SelectList.js'

/**
 * Agent slugs follow vercel-labs/skills README "Supported Agents".
 */
export const SKILLS_IDE_OPTIONS: SelectListItem[] = [
  { id: 'claude-code', label: 'Claude Code', hint: '--agent claude-code', category: 'Popular', recommended: true },
  { id: 'cursor', label: 'Cursor', hint: '--agent cursor', category: 'Popular', recommended: true },
  { id: 'codex', label: 'Codex', hint: '--agent codex', category: 'Popular', recommended: true },
  { id: 'antigravity', label: 'Antigravity', hint: '--agent antigravity', category: 'Popular', recommended: true },
  { id: 'github-copilot', label: 'GitHub Copilot', hint: '--agent github-copilot', category: 'Popular' },
  { id: 'openclaw', label: 'OpenClaw', hint: '--agent openclaw', category: 'Other agents' },
  { id: 'cline', label: 'Cline', hint: '--agent cline', category: 'Other agents' },
  { id: 'continue', label: 'Continue', hint: '--agent continue', category: 'Other agents' },
  { id: 'deepagents', label: 'Deep Agents', hint: '--agent deepagents', category: 'Other agents' },
  { id: 'kiro-cli', label: 'Kiro CLI', hint: '--agent kiro-cli', category: 'Other agents' },
  
]

export const DEFAULT_IDE_SELECTION = SKILLS_IDE_OPTIONS
  .filter((option) => option.recommended)
  .map((option) => option.id)

export function normalizeSkillsAgents(agents: string[]): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []
  for (const value of agents) {
    const trimmed = value.trim()
    if (!/^[a-z0-9][a-z0-9-]*$/.test(trimmed)) continue
    if (seen.has(trimmed)) continue
    seen.add(trimmed)
    normalized.push(trimmed)
  }
  return normalized
}
