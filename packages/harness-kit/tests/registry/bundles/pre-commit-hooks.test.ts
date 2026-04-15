import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { executeAdd } from '../../../src/commands/add.js'
import { manifest } from '../../../src/registry/bundles/workflow/pre-commit-hooks/manifest.js'

const PACKAGE_ROOT = resolve(import.meta.dirname, '../../..')

describe('pre-commit-hooks bundle artifacts', () => {
  it('git-hook script exists and is pre-commit', () => {
    const hook = manifest.common.artifacts.find(a => a.type === 'git-hook')
    expect(hook).toBeDefined()
    if (hook?.type !== 'git-hook') return
    expect(hook.hookName).toBe('pre-commit')
    expect(existsSync(resolve(PACKAGE_ROOT, hook.src))).toBe(true)
  })

  it('rule source file exists', () => {
    const rule = manifest.common.artifacts.find(a => a.type === 'rule')
    expect(rule).toBeDefined()
    if (rule?.type !== 'rule') return
    expect(existsSync(resolve(PACKAGE_ROOT, rule.src))).toBe(true)
  })
})

describe('pre-commit-hooks bundle install', () => {
  let dir: string
  beforeEach(async () => {
    dir = join(tmpdir(), `hk-pre-commit-hooks-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'harness.json'), JSON.stringify({
      version: '1.0.0', registry: 'bundled', techStack: [], bundles: [],
    }))
  })
  afterEach(async () => { await rm(dir, { recursive: true, force: true }) })

  it('copies pre-commit hook + rule and records bundle', async () => {
    await executeAdd(dir, 'pre-commit-hooks', { yes: true })
    const config = JSON.parse(await readFile(join(dir, 'harness.json'), 'utf-8'))
    expect(config.bundles).toContain('pre-commit-hooks')
    expect(existsSync(join(dir, '.githooks/pre-commit'))).toBe(true)
    expect(existsSync(join(dir, '.githooks/pre-commit.d/pre-commit-hooks.sh'))).toBe(true)
    expect(existsSync(join(dir, '.claude/rules/pre-commit-hooks.md'))).toBe(true)
  })
})
