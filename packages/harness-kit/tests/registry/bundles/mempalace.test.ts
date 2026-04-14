import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { executeAdd } from '../../../src/commands/add.js'
import { manifest } from '../../../src/registry/bundles/mempalace/manifest.js'

describe('mempalace bundle artifacts', () => {
  it('exposes a plugin artifact with the MemPalace marketplace source', () => {
    const plugin = manifest.common.artifacts.find(a => a.type === 'plugin')
    expect(plugin).toBeDefined()
    if (plugin?.type !== 'plugin') return
    expect(plugin.installSource).toBe('MemPalace/mempalace')
  })
})

describe('mempalace bundle install', () => {
  let dir: string
  beforeEach(async () => {
    dir = join(tmpdir(), `hk-mempalace-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'harness.json'), JSON.stringify({
      version: '1.0.0', registry: 'bundled', techStack: [], bundles: [],
    }))
  })
  afterEach(async () => { await rm(dir, { recursive: true, force: true }) })

  it('records bundle in harness.json', async () => {
    await executeAdd(dir, 'mempalace', { yes: true })
    const config = JSON.parse(await readFile(join(dir, 'harness.json'), 'utf-8'))
    expect(config.bundles).toContain('mempalace')
  })
})
