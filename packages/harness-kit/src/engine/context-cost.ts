import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { countTokens } from '@harness-kit/core'

export type FileKind =
  | 'claude-md'
  | 'agents-md'
  | 'rule'
  | 'skill'
  | 'agent'
  | 'command'
  | 'hook'
  | 'mcp-config'
  | 'settings'
  | 'other'

export interface ArtifactFile {
  absPath: string
  relPath: string
  kind: FileKind
}

export interface CostFile extends ArtifactFile {
  eagerTokens: number
  onDemandTokens: number
  method: 'tiktoken' | 'heuristic'
  source: 'harness-kit' | 'user'
}

export interface ContextCostReport {
  files: CostFile[]
  totalEager: number
  totalOnDemand: number
  totalTokens: number
  byBucket: {
    harnessKit: { eager: number; onDemand: number }
    user: { eager: number; onDemand: number }
  }
}

export interface ComputeOptions {
  managedPaths?: Set<string>
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

async function walk(dir: string, out: string[]): Promise<void> {
  let entries
  try {
    entries = await readdir(dir)
  } catch {
    return
  }
  for (const name of entries) {
    const full = join(dir, name)
    let st
    try {
      st = await stat(full)
    } catch {
      continue
    }
    if (st.isDirectory()) await walk(full, out)
    else if (st.isFile()) out.push(full)
  }
}

function toPosix(p: string): string {
  return sep === '/' ? p : p.split(sep).join('/')
}

function classifyKind(relPath: string): FileKind {
  if (relPath === 'CLAUDE.md') return 'claude-md'
  if (relPath === 'AGENTS.md') return 'agents-md'
  if (relPath === '.mcp.json') return 'mcp-config'
  if (relPath === '.claude/settings.json') return 'settings'
  if (relPath.startsWith('.claude/rules/')) return 'rule'
  if (relPath.startsWith('.claude/skills/')) return 'skill'
  if (relPath.startsWith('.claude/agents/')) return 'agent'
  if (relPath.startsWith('.claude/commands/')) return 'command'
  if (relPath.startsWith('.claude/hooks/')) return 'hook'
  return 'other'
}

/** Extracts YAML frontmatter block including delimiters. Returns empty string if none. */
function extractFrontmatter(content: string): string {
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) return ''
  const end = content.indexOf('\n---', 4)
  if (end === -1) return ''
  return content.slice(0, end + 4)
}

export async function scanArtifacts(projectRoot: string): Promise<ArtifactFile[]> {
  const dirs = [
    '.claude/skills',
    '.claude/rules',
    '.claude/agents',
    '.claude/hooks',
    '.claude/commands',
  ]
  const rootFiles = ['CLAUDE.md', 'AGENTS.md', '.mcp.json', '.claude/settings.json']
  const absPaths: string[] = []
  for (const d of dirs) {
    const abs = join(projectRoot, d)
    if (await pathExists(abs)) await walk(abs, absPaths)
  }
  for (const f of rootFiles) {
    const abs = join(projectRoot, f)
    if (await pathExists(abs)) absPaths.push(abs)
  }

  return absPaths.map((absPath) => {
    const relPath = toPosix(relative(projectRoot, absPath))
    return { absPath, relPath, kind: classifyKind(relPath) }
  })
}

export interface CountResult {
  eager: number
  onDemand: number
  method: 'tiktoken' | 'heuristic'
}

export function countByKind(kind: FileKind, content: string): CountResult {
  switch (kind) {
    case 'claude-md':
    case 'agents-md':
    case 'rule': {
      const { tokens, method } = countTokens(content)
      return { eager: tokens, onDemand: 0, method }
    }
    case 'skill':
    case 'agent':
    case 'command': {
      // Only frontmatter (name + description) is loaded eagerly; body lazy-loaded on invoke.
      const fm = extractFrontmatter(content)
      const fmCount = countTokens(fm)
      const bodyCount = countTokens(content.slice(fm.length))
      return { eager: fmCount.tokens, onDemand: bodyCount.tokens, method: fmCount.method }
    }
    case 'mcp-config': {
      // MCP tool definitions are listed eagerly by the runtime (roughly proportional to config size).
      const { tokens, method } = countTokens(content)
      return { eager: tokens, onDemand: 0, method }
    }
    case 'hook':
    case 'settings':
      // Not loaded into prompt context at all.
      return { eager: 0, onDemand: 0, method: 'tiktoken' }
    case 'other':
    default: {
      const { tokens, method } = countTokens(content)
      return { eager: 0, onDemand: tokens, method }
    }
  }
}

export async function computeContextCost(
  projectRoot: string,
  options: ComputeOptions = {}
): Promise<ContextCostReport> {
  const files = await scanArtifacts(projectRoot)
  const managed = options.managedPaths ?? new Set<string>()
  const results: CostFile[] = []
  const totals = {
    harnessKit: { eager: 0, onDemand: 0 },
    user: { eager: 0, onDemand: 0 },
  }

  for (const file of files) {
    const content = await readFile(file.absPath, 'utf-8')
    const { eager, onDemand, method } = countByKind(file.kind, content)
    const source: CostFile['source'] = managed.has(file.relPath) ? 'harness-kit' : 'user'
    totals[source === 'harness-kit' ? 'harnessKit' : 'user'].eager += eager
    totals[source === 'harness-kit' ? 'harnessKit' : 'user'].onDemand += onDemand
    results.push({ ...file, eagerTokens: eager, onDemandTokens: onDemand, method, source })
  }

  const totalEager = totals.harnessKit.eager + totals.user.eager
  const totalOnDemand = totals.harnessKit.onDemand + totals.user.onDemand

  return {
    files: results,
    totalEager,
    totalOnDemand,
    totalTokens: totalEager,
    byBucket: totals,
  }
}
