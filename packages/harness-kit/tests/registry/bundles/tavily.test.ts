import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('execa', () => ({
  execaCommand: vi.fn().mockResolvedValue({ stdout: '', stderr: '' }),
}))
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { executeAdd } from '../../../src/commands/add.js'
import { manifest } from '../../../src/registry/bundles/workflow/tavily/manifest.js'

const PACKAGE_ROOT = resolve(import.meta.dirname, '../../..')

describe('tavily bundle artifacts', () => {
  it('skill source file exists', () => {
    const skill = manifest.common.artifacts.find(a => a.type === 'skill')
    expect(skill).toBeDefined()
    if (!skill || skill.type !== 'skill') return
    expect(existsSync(resolve(PACKAGE_ROOT, skill.src, 'SKILL.md'))).toBe(true)
  })
})

describe('tavily bundle install', () => {
  let dir: string

  beforeEach(async () => {
    dir = join(tmpdir(), `hk-tavily-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'harness.json'), JSON.stringify({
      version: '1.0.0', registry: 'bundled', techStack: [], bundles: [],
    }))
  })

  afterEach(async () => { await rm(dir, { recursive: true, force: true }) })

  it('writes MCP entry with API key env and installs the skill', async () => {
    await executeAdd(dir, 'tavily', { yes: true })

    const mcp = JSON.parse(await readFile(join(dir, '.mcp.json'), 'utf-8'))
    expect(mcp.mcpServers.tavily).toBeDefined()
    expect(mcp.mcpServers.tavily.command).toBe('npx')
    expect(mcp.mcpServers.tavily.args).toEqual(['-y', 'tavily-mcp@latest'])
    expect(mcp.mcpServers.tavily.env).toEqual({ TAVILY_API_KEY: '${TAVILY_API_KEY}' })
  }, 15000)

  it('records bundle in harness.json', async () => {
    await executeAdd(dir, 'tavily', { yes: true })

    const config = JSON.parse(await readFile(join(dir, 'harness.json'), 'utf-8'))
    expect(config.bundles).toContain('tavily')
  }, 15000)
})
