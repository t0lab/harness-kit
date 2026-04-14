import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { executeAdd } from '../../../src/commands/add.js'
import { manifest } from '../../../src/registry/bundles/no-memory/manifest.js'

const PACKAGE_ROOT = resolve(import.meta.dirname, '../../..')

describe('no-memory bundle artifacts', () => {
  it('rule source file exists', () => {
    const rule = manifest.common.artifacts.find(a => a.type === 'rule')
    expect(rule).toBeDefined()
    if (rule?.type !== 'rule') return
    expect(existsSync(resolve(PACKAGE_ROOT, rule.src))).toBe(true)
  })
})

describe('no-memory bundle install', () => {
  let dir: string
  beforeEach(async () => {
    dir = join(tmpdir(), `hk-no-memory-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'harness.json'), JSON.stringify({
      version: '1.0.0', registry: 'bundled', techStack: [], bundles: [],
    }))
  })
  afterEach(async () => { await rm(dir, { recursive: true, force: true }) })

  it('copies rule into .claude/rules/ and records bundle', async () => {
    await executeAdd(dir, 'no-memory', { yes: true })
    const config = JSON.parse(await readFile(join(dir, 'harness.json'), 'utf-8'))
    expect(config.bundles).toContain('no-memory')
    expect(existsSync(join(dir, '.claude/rules/no-memory.md'))).toBe(true)
  })
})
