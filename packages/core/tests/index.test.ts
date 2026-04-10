import { describe, it, expect } from 'vitest'
import { HARNESS_KIT_VERSION } from '../src/index.js'

describe('core', () => {
  it('exports a semver version string', () => {
    expect(typeof HARNESS_KIT_VERSION).toBe('string')
    expect(HARNESS_KIT_VERSION).toMatch(/^\d+\.\d+\.\d+/)
  })
})
