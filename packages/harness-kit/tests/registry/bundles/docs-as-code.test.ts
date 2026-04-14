import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { manifest } from '../../../src/registry/bundles/docs-as-code/manifest.js'

const PACKAGE_ROOT = resolve(import.meta.dirname, '../../..')

describe('docs-as-code bundle artifacts', () => {
  it('skill source file exists', () => {
    const skill = manifest.common.artifacts.find(a => a.type === 'skill')
    expect(skill).toBeDefined()
    if (!skill || skill.type !== 'skill') return
    expect(existsSync(resolve(PACKAGE_ROOT, skill.src, 'SKILL.md'))).toBe(true)
  })

  it('rule source file exists', () => {
    const rule = manifest.common.artifacts.find(a => a.type === 'rule')
    expect(rule).toBeDefined()
    if (!rule || rule.type !== 'rule') return
    expect(existsSync(resolve(PACKAGE_ROOT, rule.src))).toBe(true)
  })

  it('has both skill and rule artifacts', () => {
    const types = manifest.common.artifacts.map(a => a.type)
    expect(types).toContain('skill')
    expect(types).toContain('rule')
  })
})
