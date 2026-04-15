import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { executeAdd } from '../../../src/commands/add.js'
import { manifest } from '../../../src/registry/bundles/techstack/vue/manifest.js'

const PACKAGE_ROOT = resolve(import.meta.dirname, '../../..')

describe('vue bundle artifacts', () => {
  it('skill artifact references the upstream hyf0/vue-skills repo', () => {
    const skill = manifest.common.artifacts.find(a => a.type === 'skill')
    expect(skill).toBeDefined()
    if (skill?.type !== 'skill') return
    expect(skill.src).toContain('github.com/hyf0/vue-skills')
    expect(skill.src).toContain('--skill vue-best-practices')
  })

  it('rule source file exists', () => {
    const rule = manifest.common.artifacts.find(a => a.type === 'rule')
    expect(rule).toBeDefined()
    if (rule?.type !== 'rule') return
    expect(existsSync(resolve(PACKAGE_ROOT, rule.src))).toBe(true)
  })

  it('inherits typescript stack', () => {
    const stack = manifest.common.artifacts.find(a => a.type === 'stack')
    expect(stack).toBeDefined()
    if (stack?.type !== 'stack') return
    expect(stack.ref).toBe('typescript')
  })
})

describe('vue bundle install', () => {
  let dir: string

  beforeEach(async () => {
    dir = join(tmpdir(), `hk-vue-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'harness.json'), JSON.stringify({
      version: '1.0.0', registry: 'bundled', techStack: [], bundles: [],
    }))
  })

  afterEach(async () => { await rm(dir, { recursive: true, force: true }) })

  it('copies rule and records bundle', async () => {
    await executeAdd(dir, 'vue', { yes: true })

    const config = JSON.parse(await readFile(join(dir, 'harness.json'), 'utf-8'))
    expect(config.bundles).toContain('vue')
    expect(existsSync(join(dir, '.claude/rules/vue.md'))).toBe(true)
  }, 30000)
})
