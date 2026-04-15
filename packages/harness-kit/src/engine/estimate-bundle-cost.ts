import { readdir, readFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Artifact, BundleManifest } from '@harness-kit/core'
import { getAllBundles } from '@/registry/index.js'
import { getRoleData } from '@/utils/bundle-utils.js'
import { countByKind, type FileKind } from '@/engine/context-cost.js'

const __dir = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = __dir.includes('/dist') ? join(__dir, '..') : join(__dir, '../..')

export interface BundleEstimate {
  name: string
  eager: number
  onDemand: number
  method: 'tiktoken' | 'heuristic'
}

export interface EstimateReport {
  byBundle: BundleEstimate[]
  totalEager: number
  totalOnDemand: number
}

async function walk(dir: string, out: string[]): Promise<void> {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) await walk(full, out)
    else if (entry.isFile()) out.push(full)
  }
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

function collectArtifacts(bundle: BundleManifest): Artifact[] {
  const raw: Artifact[] = [
    ...bundle.common.artifacts,
    ...(getRoleData(bundle, bundle.defaultRole)?.artifacts ?? []),
  ]
  const lookup = new Map(getAllBundles().map((b) => [b.name, b]))
  const expanded: Artifact[] = []
  for (const a of raw) {
    if (a.type !== 'stack') {
      expanded.push(a)
      continue
    }
    const target = lookup.get(a.ref)
    if (target) expanded.push(...target.common.artifacts)
  }
  return expanded
}

async function tallySources(
  sources: Array<{ path: string; kind: FileKind }>
): Promise<{ eager: number; onDemand: number; method: 'tiktoken' | 'heuristic' }> {
  let eager = 0
  let onDemand = 0
  let method: 'tiktoken' | 'heuristic' = 'tiktoken'
  for (const s of sources) {
    try {
      const content = await readFile(s.path, 'utf-8')
      const r = countByKind(s.kind, content)
      eager += r.eager
      onDemand += r.onDemand
      if (r.method === 'heuristic') method = 'heuristic'
    } catch {
      // Source missing (e.g. remote skill) — treat as zero, no hard fail.
    }
  }
  return { eager, onDemand, method }
}

async function sourcesForBundle(bundle: BundleManifest): Promise<Array<{ path: string; kind: FileKind }>> {
  const out: Array<{ path: string; kind: FileKind }> = []
  for (const artifact of collectArtifacts(bundle)) {
    switch (artifact.type) {
      case 'rule':
        out.push({ path: join(PKG_ROOT, artifact.src), kind: 'rule' })
        break
      case 'agent':
        out.push({ path: join(PKG_ROOT, artifact.src), kind: 'agent' })
        break
      case 'hook':
        out.push({ path: join(PKG_ROOT, artifact.src), kind: 'hook' })
        break
      case 'command':
        out.push({ path: join(PKG_ROOT, artifact.src), kind: 'command' })
        break
      case 'skill': {
        // Local folder: walk it. Remote URL: skip (no source to read).
        if (!artifact.src.startsWith('skills/')) break
        const abs = join(PKG_ROOT, artifact.src)
        if (!(await pathExists(abs))) break
        const files: string[] = []
        await walk(abs, files)
        for (const f of files) out.push({ path: f, kind: 'skill' })
        break
      }
      default:
        // mcp/tool/plugin/git-hook/file/stack already handled via `collectArtifacts` expansion or not loaded.
        break
    }
  }
  return out
}

export async function estimateBundlesCost(bundleNames: string[]): Promise<EstimateReport> {
  const registry = getAllBundles()
  const byBundle: BundleEstimate[] = []
  let totalEager = 0
  let totalOnDemand = 0

  for (const name of bundleNames) {
    const bundle = registry.find((b) => b.name === name)
    if (!bundle) continue
    const sources = await sourcesForBundle(bundle)
    const { eager, onDemand, method } = await tallySources(sources)
    byBundle.push({ name, eager, onDemand, method })
    totalEager += eager
    totalOnDemand += onDemand
  }

  return { byBundle, totalEager, totalOnDemand }
}
