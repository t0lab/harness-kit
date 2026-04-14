import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { manifest } from '../../../src/registry/bundles/local-memory/manifest.js'

const PACKAGE_ROOT = resolve(import.meta.dirname, '../../..')

describe('local-memory bundle artifacts', () => {
  it('all skill source files exist', () => {
    const skills = manifest.common.artifacts.filter(a => a.type === 'skill')
    expect(skills.length).toBeGreaterThanOrEqual(2)
    for (const skill of skills) {
      if (skill.type !== 'skill') continue
      expect(existsSync(resolve(PACKAGE_ROOT, skill.src, 'SKILL.md'))).toBe(true)
    }
  })

  it('rule source file exists', () => {
    const rule = manifest.common.artifacts.find(a => a.type === 'rule')
    expect(rule).toBeDefined()
    if (!rule || rule.type !== 'rule') return
    expect(existsSync(resolve(PACKAGE_ROOT, rule.src))).toBe(true)
  })

  it('ships both memory write and memory merge skills', () => {
    const skillSrcs = manifest.common.artifacts
      .filter(a => a.type === 'skill')
      .map(a => a.type === 'skill' ? a.src : '')
    expect(skillSrcs).toContain('skills/memory')
    expect(skillSrcs).toContain('skills/memory-merge')
  })

  it('Stop hook script exists', () => {
    const hook = manifest.common.artifacts.find(a => a.type === 'hook')
    expect(hook).toBeDefined()
    if (!hook || hook.type !== 'hook') return
    expect(hook.hookType).toBe('Stop')
    expect(existsSync(resolve(PACKAGE_ROOT, hook.src))).toBe(true)
  })

  it('pre-commit git-hook script exists', () => {
    const gitHook = manifest.common.artifacts.find(a => a.type === 'git-hook')
    expect(gitHook).toBeDefined()
    if (!gitHook || gitHook.type !== 'git-hook') return
    expect(gitHook.hookName).toBe('pre-commit')
    expect(existsSync(resolve(PACKAGE_ROOT, gitHook.src))).toBe(true)
  })
})
