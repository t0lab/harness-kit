import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { manifest } from '../../../src/registry/bundles/workflow/playwright/manifest.js'

const PACKAGE_ROOT = resolve(import.meta.dirname, '../../..')

describe('playwright bundle artifacts', () => {
  it('skill source file exists', () => {
    const skill = manifest.common.artifacts.find(a => a.type === 'skill')
    expect(skill).toBeDefined()
    if (skill?.type !== 'skill') return
    expect(existsSync(resolve(PACKAGE_ROOT, skill.src, 'SKILL.md'))).toBe(true)
  })

  it('declares a tool artifact that installs chromium', () => {
    const tool = manifest.common.artifacts.find(a => a.type === 'tool')
    expect(tool).toBeDefined()
    if (tool?.type !== 'tool') return
    expect(tool.installCmd).toMatch(/@playwright\/cli/)
    expect(tool.installCmd).toMatch(/install-browser chromium/)
  })
})
