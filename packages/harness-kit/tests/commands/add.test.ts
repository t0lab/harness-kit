import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { executeAdd } from '../../src/commands/add.js'

let dir: string

beforeEach(async () => {
  dir = join(tmpdir(), `hk-add-${Date.now()}`)
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

describe('executeAdd', () => {
  it('throws NOT_INITIALIZED when harness.json missing', async () => {
    await expect(executeAdd(dir, 'tavily', {})).rejects.toThrow('NOT_INITIALIZED')
  })

  it('throws UNKNOWN_BUNDLE for unregistered bundle name', async () => {
    await writeHarness(BASE_CONFIG)
    await expect(executeAdd(dir, 'nonexistent-xyz', {})).rejects.toThrow('UNKNOWN_BUNDLE')
  })

  it('throws INVALID_ROLE when role not in bundle.roles', async () => {
    await writeHarness(BASE_CONFIG)
    await expect(executeAdd(dir, 'tavily', { role: 'not-a-real-role' })).rejects.toThrow('INVALID_ROLE')
  })

  it('adds MCP bundle: updates .mcp.json and harness.json', async () => {
    await writeHarness(BASE_CONFIG)
    await executeAdd(dir, 'tavily', { yes: true })

    const harness = JSON.parse(await readFile(join(dir, 'harness.json'), 'utf-8'))
    expect(harness.bundles).toContain('tavily')

    const mcp = JSON.parse(await readFile(join(dir, '.mcp.json'), 'utf-8'))
    expect(mcp.mcpServers).toHaveProperty('tavily')
  })

  it('re-adding same bundle keeps bundles[] length unchanged (no duplicates)', async () => {
    await writeHarness(BASE_CONFIG)
    await executeAdd(dir, 'tavily', { yes: true })
    await executeAdd(dir, 'tavily', { yes: true })

    const harness = JSON.parse(await readFile(join(dir, 'harness.json'), 'utf-8'))
    expect(harness.bundles.filter((n: string) => n === 'tavily')).toHaveLength(1)
  })

  it('adds non-MCP bundle: updates harness.json bundles[], does not touch .mcp.json', async () => {
    await writeHarness(BASE_CONFIG)
    await executeAdd(dir, 'tdd', { yes: true })

    const harness = JSON.parse(await readFile(join(dir, 'harness.json'), 'utf-8'))
    expect(harness.bundles).toContain('tdd')
    expect(harness.mcp).toBeUndefined()

    // .mcp.json should not be created
    await expect(readFile(join(dir, '.mcp.json'), 'utf-8')).rejects.toThrow()
  })

  it('uses default role when no --role given', async () => {
    await writeHarness(BASE_CONFIG)
    const result = await executeAdd(dir, 'tavily', { yes: true })
    expect(result.role).toBe('search') // tavily's defaultRole
  })

  it('uses specified --role when valid', async () => {
    await writeHarness(BASE_CONFIG)
    // tavily has only one role: 'search', so we test that it accepts the default/only role
    const result = await executeAdd(dir, 'tavily', { role: 'search', yes: true })
    expect(result.role).toBe('search')
  })
})
