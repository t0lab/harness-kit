import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { auditHarness } from '../../src/commands/status.js'
import { getBundle } from '../../src/registry/index.js'

let dir: string

beforeEach(async () => {
  dir = join(tmpdir(), `hk-status-${Date.now()}`)
  await mkdir(dir, { recursive: true })
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

const BASE_CONFIG = {
  version: '1.0.0',
  registry: 'bundled',
  techStack: [],
  bundles: [],
}

async function writeHarness(config: object): Promise<void> {
  await writeFile(join(dir, 'harness.json'), JSON.stringify(config))
}

describe('auditHarness', () => {
  it('returns empty audit for project with no bundles', async () => {
    await writeHarness(BASE_CONFIG)
    const result = await auditHarness(dir)
    expect(result.bundles).toHaveLength(0)
    expect(result.envVars).toHaveLength(0)
  })

  it('detects drift when mcp bundle missing from .mcp.json', async () => {
    await writeHarness({ ...BASE_CONFIG, bundles: ['tavily'] })
    // No .mcp.json written
    const result = await auditHarness(dir)
    expect(result.bundles[0]?.drift).toBe(true)
  })

  it('no drift when mcp bundle present in .mcp.json', async () => {
    await writeHarness({ ...BASE_CONFIG, bundles: ['tavily'] })
    await writeFile(
      join(dir, '.mcp.json'),
      JSON.stringify({ mcpServers: { tavily: {} } })
    )
    const result = await auditHarness(dir)
    expect(result.bundles[0]?.drift).toBe(false)
  })

  it('non-mcp bundle never shows drift', async () => {
    await writeHarness({ ...BASE_CONFIG, bundles: ['tdd'] })
    const result = await auditHarness(dir)
    expect(result.bundles[0]?.drift).toBe(false)
  })

  it('detects missing config file', async () => {
    await writeHarness(BASE_CONFIG)
    const result = await auditHarness(dir)
    expect(result.files.find((f) => f.path === 'CLAUDE.md')?.exists).toBe(false)
    expect(result.files.find((f) => f.path === 'harness.json')?.exists).toBe(true)
  })

  it('reports env vars for installed bundles based on actual manifest data', async () => {
    await writeHarness({ ...BASE_CONFIG, bundles: ['tavily'] })
    const result = await auditHarness(dir)
    // Derive expected env vars from registry, not hardcoded keys
    const tavilyEnv = getBundle('tavily').common.env ?? []
    expect(result.envVars).toHaveLength(tavilyEnv.length)
    expect(result.envVars.every((e) => e.bundleName === 'tavily')).toBe(true)
  })

  it('handles legacy harness.json without bundles field gracefully', async () => {
    const legacy = { ...BASE_CONFIG, bundles: undefined }
    await writeHarness(legacy)
    const result = await auditHarness(dir)
    expect(result.bundles).toHaveLength(0)
  })

  it('mcp bundle in bundles[] missing from .mcp.json shows drift', async () => {
    await writeHarness({ ...BASE_CONFIG, bundles: ['tavily'] })
    // No .mcp.json written — drift detected via registry lookup
    const result = await auditHarness(dir)
    const driftEntry = result.bundles.find((b) => b.name === 'tavily')
    expect(driftEntry?.drift).toBe(true)
    expect(driftEntry?.hasMcp).toBe(true)
  })

  it('all-clean project has no drift, all files present', async () => {
    await writeHarness(BASE_CONFIG)
    // Write all core files
    await writeFile(join(dir, 'CLAUDE.md'), '# CLAUDE')
    await writeFile(join(dir, 'AGENTS.md'), '# AGENTS')
    await writeFile(join(dir, '.mcp.json'), JSON.stringify({ mcpServers: {} }))
    await mkdir(join(dir, '.claude'), { recursive: true })
    await writeFile(join(dir, '.claude/settings.json'), '{}')
    // harness.json already exists from writeHarness

    const result = await auditHarness(dir)
    expect(result.bundles).toHaveLength(0)
    expect(result.files.find((f) => f.path === 'CLAUDE.md')?.exists).toBe(true)
    expect(result.files.find((f) => f.path === 'AGENTS.md')?.exists).toBe(true)
    expect(result.files.find((f) => f.path === 'harness.json')?.exists).toBe(true)
    expect(result.files.every((f) => f.exists)).toBe(true)
  })
})
