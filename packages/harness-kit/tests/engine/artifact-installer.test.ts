import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import type { BundleManifest } from '@harness-kit/core'

vi.mock('execa', () => ({
  execaCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '' }),
}))

import { installBundle } from '../../src/engine/artifact-installer.js'
import { execaCommand } from 'execa'

const mockedExeca = vi.mocked(execaCommand)

let dir: string

beforeEach(async () => {
  dir = join(tmpdir(), `hk-installer-${Date.now()}`)
  await mkdir(dir, { recursive: true })
  mockedExeca.mockClear()
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

const MCP_BUNDLE: BundleManifest = {
  name: 'test-mcp',
  description: 'test',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'search',
  common: {
    artifacts: [{
      type: 'mcp',
      command: 'npx',
      args: ['-y', 'test-pkg'],
      env: { TEST_KEY: '${TEST_KEY}' },
    }],
    env: [{ key: 'TEST_KEY', description: 'test key', required: true }],
  },
  roles: { search: { artifacts: [] } },
}

const NO_ARTIFACT_BUNDLE: BundleManifest = {
  name: 'tdd',
  description: 'TDD workflow',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'workflow-preset',
  common: { artifacts: [] },
  roles: { 'workflow-preset': { artifacts: [] } },
}

const TOOL_BUNDLE: BundleManifest = {
  name: 'eslint',
  description: 'ESLint',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'dev-integration',
  common: { artifacts: [{ type: 'tool', installCmd: 'pnpm add -D eslint' }] },
  roles: { 'dev-integration': { artifacts: [] } },
}

const SKILL_BUNDLE: BundleManifest = {
  name: 'agent-browser',
  description: 'Browser automation',
  version: '1.0.0',
  experimental: false,
  defaultRole: 'browser',
  common: {
    artifacts: [
      { type: 'skill', src: 'https://github.com/vercel-labs/agent-browser --skill agent-browser' },
    ],
  },
  roles: { browser: { artifacts: [] } },
}

describe('installBundle', () => {
  it('creates .mcp.json for mcp artifact', async () => {
    const result = await installBundle(dir, MCP_BUNDLE, 'search')
    expect(result.mcpUpdated).toBe(true)
    const raw = JSON.parse(await readFile(join(dir, '.mcp.json'), 'utf-8'))
    expect(raw.mcpServers['test-mcp']).toEqual({
      command: 'npx',
      args: ['-y', 'test-pkg'],
      env: { TEST_KEY: '${TEST_KEY}' },
    })
  })

  it('merges into existing .mcp.json without overwriting other entries', async () => {
    const existing = { mcpServers: { other: { command: 'other', args: [] } } }
    await writeFile(join(dir, '.mcp.json'), JSON.stringify(existing))
    await installBundle(dir, MCP_BUNDLE, 'search')
    const raw = JSON.parse(await readFile(join(dir, '.mcp.json'), 'utf-8'))
    expect(Object.keys(raw.mcpServers)).toContain('other')
    expect(Object.keys(raw.mcpServers)).toContain('test-mcp')
  })

  it('re-installing same bundle is idempotent (replaces entry, no duplicates)', async () => {
    await installBundle(dir, MCP_BUNDLE, 'search')
    await installBundle(dir, MCP_BUNDLE, 'search')
    const raw = JSON.parse(await readFile(join(dir, '.mcp.json'), 'utf-8'))
    expect(Object.keys(raw.mcpServers)).toHaveLength(1)
  })

  it('returns mcpUpdated: false for bundle with no mcp artifacts', async () => {
    const result = await installBundle(dir, NO_ARTIFACT_BUNDLE, 'workflow-preset')
    expect(result.mcpUpdated).toBe(false)
    expect(result.warnings).toHaveLength(0)
  })

  it('runs installCmd for tool artifact', async () => {
    const result = await installBundle(dir, TOOL_BUNDLE, 'dev-integration')
    expect(mockedExeca).toHaveBeenCalledWith('pnpm add -D eslint', { cwd: dir, stdio: 'inherit', shell: true })
    expect(result.warnings).toHaveLength(0)
  })

  it('warns when tool install fails', async () => {
    mockedExeca.mockRejectedValueOnce(new Error('command not found'))
    const result = await installBundle(dir, TOOL_BUNDLE, 'dev-integration')
    expect(result.warnings).toContain('Failed: pnpm add -D eslint')
  })

  it('runs npx skills add for skill artifact', async () => {
    const result = await installBundle(dir, SKILL_BUNDLE, 'browser')
    expect(mockedExeca).toHaveBeenCalledWith(
      'npx skills add https://github.com/vercel-labs/agent-browser --skill agent-browser',
      { cwd: dir, stdio: 'inherit', shell: true },
    )
    expect(result.warnings).toHaveLength(0)
  })

  it('warns when skill install fails', async () => {
    mockedExeca.mockRejectedValueOnce(new Error('network error'))
    const result = await installBundle(dir, SKILL_BUNDLE, 'browser')
    expect(result.warnings).toContain(
      'Failed: npx skills add https://github.com/vercel-labs/agent-browser --skill agent-browser',
    )
  })
})
