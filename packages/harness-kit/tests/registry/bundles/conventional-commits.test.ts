import { describe, it, expect } from 'vitest'
import { manifest } from '../../../src/registry/bundles/conventional-commits/manifest.js'

describe('conventional-commits manifest', () => {
  it('has correct name and defaultRole', () => {
    expect(manifest.name).toBe('conventional-commits')
    expect(manifest.defaultRole).toBe('git-workflow')
  })

  it('has skill artifact pointing to git-conventional', () => {
    const skill = manifest.common.artifacts.find(a => a.type === 'skill')
    expect(skill).toBeDefined()
    if (skill?.type === 'skill') {
      expect(skill.src).toBe('skills/git-conventional')
    }
  })

  it('has rule artifact', () => {
    const rule = manifest.common.artifacts.find(a => a.type === 'rule')
    expect(rule).toBeDefined()
  })

  it('has git-workflow role marked recommended', () => {
    expect(manifest.roles['git-workflow']).toBeDefined()
    expect(manifest.roles['git-workflow']?.recommended).toBe(true)
  })
})
