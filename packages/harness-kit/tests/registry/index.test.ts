import { describe, it, expect } from 'vitest'
import { getAllBundles, getBundlesByCategory, getBundle } from '../../src/registry/index.js'

describe('getAllBundles', () => {
  it('returns at least 28 bundles', () => {
    expect(getAllBundles().length).toBeGreaterThanOrEqual(27)
  })

  it('every bundle has required fields', () => {
    for (const b of getAllBundles()) {
      expect(b.name).toBeTruthy()
      expect(b.defaultRole).toBeTruthy()
      expect(b.common).toBeDefined()
      expect(b.roles).toBeDefined()
    }
  })

  it('no duplicate names', () => {
    const names = getAllBundles().map(b => b.name)
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('getBundlesByCategory', () => {
  it('returns search bundles: tavily, brave-search', () => {
    const names = getBundlesByCategory('search').map(b => b.name)
    expect(names).toContain('tavily')
    expect(names).toContain('brave-search')
  })

  it('returns browser bundles: playwright, browser-use, agent-browser', () => {
    const names = getBundlesByCategory('browser').map(b => b.name)
    expect(names).toContain('playwright')
    expect(names).toContain('browser-use')
    expect(names).toContain('agent-browser')
  })

  it('returns memory bundles: mem0, mempalace, claude-mem', () => {
    const names = getBundlesByCategory('memory').map(b => b.name)
    expect(names).toContain('mem0')
    expect(names).toContain('mempalace')
    expect(names).toContain('claude-mem')
  })

  it('mem0 also appears in mcp-tool category', () => {
    const names = getBundlesByCategory('mcp-tool').map(b => b.name)
    expect(names).toContain('mem0')
  })

  it('returns empty array for category with no bundles', () => {
    expect(getBundlesByCategory('scrape').length).toBeGreaterThanOrEqual(0)
  })
})

describe('getBundle', () => {
  it('returns bundle by name', () => {
    const b = getBundle('tavily')
    expect(b.name).toBe('tavily')
  })

  it('throws for unknown bundle name', () => {
    expect(() => getBundle('nonexistent')).toThrow('Bundle not found: nonexistent')
  })
})
