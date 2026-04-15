import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { executeAdd } from '../../../src/commands/add.js'
import { manifest } from '../../../src/registry/bundles/techstack/django/manifest.js'

const PACKAGE_ROOT = resolve(import.meta.dirname, '../../..')

describe('django bundle artifacts', () => {
  it('bundles all four django skills from affaan-m/everything-claude-code', () => {
    const skills = manifest.common.artifacts.filter(a => a.type === 'skill')
    expect(skills).toHaveLength(4)
    const names = skills.map(s => s.type === 'skill' ? s.src : '')
    expect(names.some(s => s.includes('--skill django-patterns'))).toBe(true)
    expect(names.some(s => s.includes('--skill django-security'))).toBe(true)
    expect(names.some(s => s.includes('--skill django-tdd'))).toBe(true)
    expect(names.some(s => s.includes('--skill django-verification'))).toBe(true)
    for (const s of skills) {
      if (s.type !== 'skill') continue
      expect(s.src).toContain('github.com/affaan-m/everything-claude-code')
    }
  })

  it('rule source file exists', () => {
    const rule = manifest.common.artifacts.find(a => a.type === 'rule')
    expect(rule).toBeDefined()
    if (rule?.type !== 'rule') return
    expect(existsSync(resolve(PACKAGE_ROOT, rule.src))).toBe(true)
  })

  it('inherits python stack', () => {
    const stack = manifest.common.artifacts.find(a => a.type === 'stack')
    expect(stack).toBeDefined()
    if (stack?.type !== 'stack') return
    expect(stack.ref).toBe('python')
  })
})

describe('django bundle install', () => {
  let dir: string

  beforeEach(async () => {
    dir = join(tmpdir(), `hk-django-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'harness.json'), JSON.stringify({
      version: '1.0.0', registry: 'bundled', techStack: [], bundles: [],
    }))
  })

  afterEach(async () => { await rm(dir, { recursive: true, force: true }) })

  it('copies rule and records bundle', async () => {
    await executeAdd(dir, 'django', { yes: true })

    const config = JSON.parse(await readFile(join(dir, 'harness.json'), 'utf-8'))
    expect(config.bundles).toContain('django')
    expect(existsSync(join(dir, '.claude/rules/django.md'))).toBe(true)
  }, 60000)
})
