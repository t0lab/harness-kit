import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { executeAdd } from '../../../src/commands/add.js'
import { manifest } from '../../../src/registry/bundles/mem0/manifest.js'

const PACKAGE_ROOT = resolve(import.meta.dirname, '../../..')

describe('mem0 bundle artifacts', () => {
  it('skill source file exists', () => {
    const skill = manifest.common.artifacts.find(a => a.type === 'skill')
    expect(skill).toBeDefined()
    if (!skill || skill.type !== 'skill') return
    expect(existsSync(resolve(PACKAGE_ROOT, skill.src, 'SKILL.md'))).toBe(true)
  })
})

describe('mem0 bundle install', () => {
  let dir: string
  beforeEach(async () => {
    dir = join(tmpdir(), `hk-mem0-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'harness.json'), JSON.stringify({
      version: '1.0.0', registry: 'bundled', techStack: [], bundles: [],
    }))
  })
  afterEach(async () => { await rm(dir, { recursive: true, force: true }) })

  it('writes hosted MCP entry to .mcp.json with MEM0_API_KEY env', async () => {
    await executeAdd(dir, 'mem0', { yes: true })
    const mcp = JSON.parse(await readFile(join(dir, '.mcp.json'), 'utf-8'))
    expect(mcp.mcpServers.mem0).toBeDefined()
    expect(mcp.mcpServers.mem0.command).toBe('npx')
    expect(mcp.mcpServers.mem0.args).toEqual(['-y', '@mem0/mcp-server'])
    expect(mcp.mcpServers.mem0.env).toEqual({ MEM0_API_KEY: '${MEM0_API_KEY}' })
  })

  it('records bundle in harness.json', async () => {
    await executeAdd(dir, 'mem0', { yes: true })
    const config = JSON.parse(await readFile(join(dir, 'harness.json'), 'utf-8'))
    expect(config.bundles).toContain('mem0')
  })
})
